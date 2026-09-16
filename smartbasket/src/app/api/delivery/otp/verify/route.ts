import { auth } from "@/auth";
import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import { MAX_OTP_ATTEMPTS } from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";

/**
 * Confirm a handover with the OTP the customer received.
 *
 * Restricted to the rider assigned to this order; the code expires, wrong tries
 * are counted and lock the code after MAX_OTP_ATTEMPTS, and a successful
 * verification clears it so it can't be replayed.
 */
export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const session = await auth()
        if (!session?.user?.id || session.user.role !== "deliveryBoy") {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 })
        }

        const { orderId, otp } = await req.json()
        if (!orderId || !otp) {
            return NextResponse.json({ message: "orderId or OTP not found" }, { status: 400 })
        }

        const order = await Order.findById(orderId)
        if (!order) {
            return NextResponse.json({ message: "order not found" }, { status: 404 })
        }

        if (String(order.assignedDeliveryBoy ?? "") !== String(session.user.id)) {
            return NextResponse.json(
                { message: "you are not assigned to this order" },
                { status: 403 }
            )
        }
        if (order.status === "delivered") {
            return NextResponse.json({ message: "this order is already delivered" }, { status: 409 })
        }
        if (order.status === "cancelled") {
            return NextResponse.json({ message: "this order was cancelled" }, { status: 409 })
        }

        if (!order.deliveryOtp) {
            return NextResponse.json(
                { message: "No OTP has been requested for this order" },
                { status: 400 }
            )
        }
        if (order.deliveryOtpAttempts >= MAX_OTP_ATTEMPTS) {
            return NextResponse.json(
                { message: "Too many incorrect attempts. Send a new OTP." },
                { status: 429 }
            )
        }
        if (!order.deliveryOtpExpiresAt || order.deliveryOtpExpiresAt.getTime() < Date.now()) {
            return NextResponse.json(
                { message: "This OTP has expired. Send a new one." },
                { status: 400 }
            )
        }

        if (order.deliveryOtp !== String(otp)) {
            order.deliveryOtpAttempts += 1
            await order.save()
            const left = MAX_OTP_ATTEMPTS - order.deliveryOtpAttempts
            return NextResponse.json(
                {
                    message: left > 0
                        ? `Incorrect OTP. ${left} attempt${left === 1 ? "" : "s"} left.`
                        : "Incorrect OTP. Too many attempts - send a new OTP.",
                },
                { status: 400 }
            )
        }

        order.status = "delivered"
        order.deliveryOtpVerification = true
        order.deliveredAt = new Date()
        // burn the code so it cannot be reused
        order.deliveryOtp = null
        order.deliveryOtpExpiresAt = null
        order.deliveryOtpAttempts = 0
        await order.save()

        await emitEventHandler("order-status-update", { orderId: order._id, status: order.status })

        await DeliveryAssignment.updateOne(
            { order: orderId },
            { $set: { assignedTo: null, status: "completed" } }
        )

        return NextResponse.json(
            { message: "Delivery successfully completed" },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `verify otp error ${error}` },
            { status: 500 }
        )
    }
}
