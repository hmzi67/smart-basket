import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// Admin marks an online order's uploaded transaction screenshot as verified.
export async function POST(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
    try {
        const session = await auth()
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "only admins can approve payments" }, { status: 403 })
        }
        await connectDb()
        const { orderId } = await context.params
        const order = await Order.findById(orderId)
        if (!order) {
            return NextResponse.json({ message: "order not found" }, { status: 404 })
        }
        if (order.paymentMethod !== "online" || !order.paymentProof) {
            return NextResponse.json({ message: "this order has no transaction screenshot to approve" }, { status: 400 })
        }
        if (order.isPaid) {
            return NextResponse.json({ message: "payment already approved", isPaid: true }, { status: 200 })
        }
        order.isPaid = true
        await order.save()
        return NextResponse.json({ message: "payment approved", isPaid: true }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `approve payment error ${error}` }, { status: 500 })
    }
}
