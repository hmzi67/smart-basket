import { auth } from "@/auth";
import connectDb from "@/lib/db";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import { dispatchOrder } from "@/lib/dispatch";
import { NextRequest, NextResponse } from "next/server";

/**
 * A delivery boy turns an offered assignment down.
 *
 * They are removed from the broadcast pool. If they were the last rider in it,
 * the order is re-dispatched through the same logic the admin transition uses,
 * excluding everyone who has already rejected it — so it goes back into the
 * pool rather than getting stuck.
 */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDb()
        const session = await auth()
        const deliveryBoyId = session?.user?.id

        if (!deliveryBoyId || session?.user?.role !== "deliveryBoy") {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 })
        }

        const { id } = await context.params
        const assignment = await DeliveryAssignment.findById(id)
        if (!assignment) {
            return NextResponse.json({ message: "assignment not found" }, { status: 404 })
        }
        if (assignment.status !== "broadcasted") {
            return NextResponse.json({ message: "this assignment is no longer open" }, { status: 409 })
        }
        if (!assignment.brodcastedTo.some((b: any) => String(b) === String(deliveryBoyId))) {
            return NextResponse.json({ message: "this assignment was not offered to you" }, { status: 403 })
        }

        const remaining = assignment.brodcastedTo
            .map((b: any) => String(b))
            .filter((b: string) => b !== String(deliveryBoyId)).length

        // record the rejection so a re-broadcast doesn't offer it straight back
        await DeliveryAssignment.updateOne(
            { _id: assignment._id },
            {
                $pull: { brodcastedTo: deliveryBoyId },
                $addToSet: { rejectedBy: deliveryBoyId },
            }
        )

        if (remaining > 0) {
            // other riders still have the offer open
            return NextResponse.json(
                { message: "Assignment rejected", reBroadcast: false },
                { status: 200 }
            )
        }

        // nobody left: put it back into the pool, skipping this rider
        const order = await Order.findById(assignment.order)
        if (!order) {
            return NextResponse.json({ message: "order not found" }, { status: 404 })
        }

        // dispatchOrder reads rejectedBy off the assignment, so every previous
        // rejection is skipped too
        const { assignment: reDispatched } = await dispatchOrder(order)

        return NextResponse.json(
            {
                message: reDispatched
                    ? "Assignment rejected and offered to another rider"
                    : "Assignment rejected. No other rider is available right now.",
                reBroadcast: Boolean(reDispatched),
            },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json({ message: `reject assignment error ${error}` }, { status: 500 })
    }
}
