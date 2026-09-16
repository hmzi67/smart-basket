
import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import Order from "@/models/order.model";
import { auth } from "@/auth";
import { dispatchOrder } from "@/lib/dispatch";


import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, context: { params :Promise<{orderId:string;}>;}){
    try {
    const session = await auth()
    if (session?.user?.role !== "admin") {
        return NextResponse.json({ message: "only admins can update order status" }, { status: 403 })
    }
    await connectDb()
    const { orderId } = await context.params
    const { status } = await req.json()

    if (!["pending", "out of delivery", "delivered"].includes(status)) {
        return NextResponse.json({ message: "unknown order status" }, { status: 400 })
    }

    const order = await Order.findById(orderId).populate("user")
    if (!order) {
    return NextResponse.json({ message: "order not found" }, { status: 404 })
    }
    if (order.status === "cancelled") {
    return NextResponse.json({ message: "this order was cancelled by the customer" }, { status: 409 })
    }
    order.status=status

    if (status === "out of delivery" && !order.assignment) {
        const { assignment, availableBoys } = await dispatchOrder(order)

        if (!assignment) {
            await order.save()
            await emitEventHandler("order-status-update",{orderId:order._id,status:order.status})
            return NextResponse.json({ message: "there is no available Delivery boys" }, { status: 200 })
        }

        order.assignment = assignment._id
        await order.save()
        await emitEventHandler("order-status-update",{orderId:order._id,status:order.status})

        return NextResponse.json({
            assignment: assignment._id,
            availableBoys
        }, {status: 200})
    }

    // any other status change (or order already has an assignment)
    await order.save()
    await emitEventHandler("order-status-update",{orderId:order._id,status:order.status})
    return NextResponse.json({ message: "order status updated", status: order.status }, { status: 200 })

    } catch (error) {
    return NextResponse.json({
    message: `update status error ${error}`,
    }, {status: 500})
    }
}
