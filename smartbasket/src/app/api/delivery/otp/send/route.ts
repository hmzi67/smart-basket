import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import Order from "@/models/order.model";
import { OTP_TTL_MS } from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";

/**
 * Email a fresh delivery OTP to the customer.
 *
 * Only the delivery boy actually assigned to the order may ask for it.
 * Requires EMAIL / PASS (the Gmail credentials src/lib/mailer.ts uses).
 */
export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const session = await auth()
        if (!session?.user?.id || session.user.role !== "deliveryBoy") {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 })
        }

        const { orderId } = await req.json()
        const order = await Order.findById(orderId).populate("user")
        if (!order) {
            return NextResponse.json({
                message: "order not found"
            }, { status: 404 })
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

        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        order.deliveryOtp = otp
        order.deliveryOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS)
        // a new code starts the attempt count over
        order.deliveryOtpAttempts = 0
        await order.save()

        await sendMail(order.user.email,
            "Your Delivery OTP",
            `<h2>Your Delivery OTP is <strong>${otp}</strong></h2>
             <p>It expires in 10 minutes. Share it with your delivery rider to confirm the handover.</p>`)

        return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `send otp error ${error}` }, { status: 500 })
    }
}
