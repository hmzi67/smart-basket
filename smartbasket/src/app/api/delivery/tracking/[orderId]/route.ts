import { auth } from "@/auth";
import connectDb from "@/lib/db";
import DeliveryTracking from "@/models/deliveryTracking.model";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

/** Breadcrumb trail for one order, for the customer, its rider, or an admin. */
export async function GET(
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
        const order = await Order.findById(orderId).select("user assignedDeliveryBoy")
        if (!order) {
            return NextResponse.json({ message: "order not found" }, { status: 404 })
        }

        const viewerId = String(session.user.id)
        const allowed =
            session.user.role === "admin" ||
            String(order.user) === viewerId ||
            String(order.assignedDeliveryBoy ?? "") === viewerId

        if (!allowed) {
            return NextResponse.json({ message: "forbidden" }, { status: 403 })
        }

        const trail = await DeliveryTracking.find({ order: orderId })
            .sort({ recordedAt: 1 })
            .select("coordinates recordedAt")
            .lean()

        return NextResponse.json({
            // [lat, lng] pairs, the order Leaflet wants
            trail: trail.map((t: any) => ({
                latitude: t.coordinates[1],
                longitude: t.coordinates[0],
                recordedAt: t.recordedAt,
            })),
        }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `get tracking error ${error}` }, { status: 500 })
    }
}
