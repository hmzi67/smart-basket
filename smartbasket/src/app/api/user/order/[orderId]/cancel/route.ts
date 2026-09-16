import { auth } from "@/auth";
import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import Order from "@/models/order.model";
import { releaseStock } from "@/lib/stock";
import { NextRequest, NextResponse } from "next/server";

/**
 * Customer cancels their own order.
 *
 * Only while the order is still "pending" — once an admin has dispatched it the
 * window is closed. The check is here rather than only in the UI, and it is
 * done with a conditional update so two taps can't both cancel (and both
 * restore stock).
 */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectDb()
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 })
        }

        const { orderId } = await context.params

        const order = await Order.findOne({ _id: orderId, user: session.user.id })
        if (!order) {
            return NextResponse.json({ message: "order not found" }, { status: 404 })
        }
        if (order.status !== "pending") {
            return NextResponse.json(
                {
                    message:
                        order.status === "cancelled"
                            ? "This order is already cancelled"
                            : "This order has already been dispatched and can no longer be cancelled",
                },
                { status: 409 }
            )
        }

        // only the update that actually flips pending -> cancelled restores stock
        const updated = await Order.findOneAndUpdate(
            { _id: orderId, user: session.user.id, status: "pending" },
            { $set: { status: "cancelled", cancelledAt: new Date() } },
            { returnDocument: "after" }
        )

        if (!updated) {
            return NextResponse.json(
                { message: "This order has already been dispatched and can no longer be cancelled" },
                { status: 409 }
            )
        }

        // stock was taken when the order was placed; give it back
        await releaseStock(
            updated.items.map((item: any) => ({
                grocery: String(item.grocery),
                name: item.name,
                price: item.price,
                unit: item.unit,
                image: item.image,
                quantity: item.quantity,
            }))
        )

        await emitEventHandler("order-status-update", { orderId: updated._id, status: updated.status })

        return NextResponse.json({ message: "Order cancelled", status: updated.status }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `cancel order error ${error}` }, { status: 500 })
    }
}
