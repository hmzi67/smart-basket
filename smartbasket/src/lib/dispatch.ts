import DeliveryAssignment from "@/models/deliveryAssignment.model";
import User from "@/models/user.model";
import emitEventHandler from "@/lib/emitEventHandler";

export const MAX_DISPATCH_DISTANCE_METERS = 10000

export interface IDispatchResult {
    assignment: any | null
    availableBoys: {
        id: string
        name: string
        mobile?: string
        latitude: number
        longitude: number
    }[]
}

/**
 * Find delivery boys who could take this order and offer it to them.
 *
 * Shared by the admin "out of delivery" transition and by a rider rejecting an
 * assignment, so the two can't drift apart. Passing `excludeIds` keeps riders
 * who have already turned this order down out of the new broadcast.
 *
 * Returns `assignment: null` when nobody is available.
 */
export async function dispatchOrder(
    order: any,
    { excludeIds = [] }: { excludeIds?: string[] } = {}
): Promise<IDispatchResult> {
    // $near needs a 2dsphere index; create it if missing (no-op when it exists)
    await User.collection.createIndex({ location: "2dsphere" })

    const { latitude, longitude } = order.address

    // a re-broadcast must skip every rider who already rejected this order, not
    // just the one who triggered it
    const existingAssignment = order.assignment
        ? await DeliveryAssignment.findById(order.assignment)
        : null
    const excluded = new Set([
        ...excludeIds.map(String),
        ...((existingAssignment?.rejectedBy ?? []) as any[]).map(String),
    ])

    let nearByDeliveryBoys = await User.find({
        role: "deliveryBoy",
        isActive: { $ne: false },
        location: {
            $near: {
                $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                $maxDistance: MAX_DISPATCH_DISTANCE_METERS
            }
        }
    })

    // Fallback: delivery boys whose browser never shared a location stay at [0,0].
    // If nobody is nearby, offer the order to online delivery boys with unknown location.
    if (nearByDeliveryBoys.length === 0) {
        nearByDeliveryBoys = await User.find({
            role: "deliveryBoy",
            isActive: { $ne: false },
            isOnline: true,
            socketId: { $ne: null },
            "location.coordinates": [0, 0]
        })
    }

    // drop anyone who already rejected this order
    nearByDeliveryBoys = nearByDeliveryBoys.filter((b: any) => !excluded.has(String(b._id)))

    // drop anyone already out on a delivery
    const nearByIds = nearByDeliveryBoys.map((b: any) => b._id)
    const busyIds = await DeliveryAssignment.find({
        assignedTo: { $in: nearByIds },
        status: "assigned"
    }).distinct("assignedTo") as string[]
    const busyIdSet = new Set<string>(busyIds.map((b: any) => String(b)))

    const availableDeliveryBoys = nearByDeliveryBoys.filter(
        (b: any) => !busyIdSet.has(String(b._id))
    )
    const candidates = availableDeliveryBoys.map((b: any) => b._id)

    if (candidates.length === 0) {
        return { assignment: null, availableBoys: [] }
    }

    // reuse the order's existing assignment when there is one (a re-broadcast
    // after a rejection), otherwise start a new one
    let assignment = existingAssignment

    if (assignment) {
        assignment.brodcastedTo = candidates
        assignment.status = "broadcasted"
        assignment.assignedTo = null
        await assignment.save()
    } else {
        assignment = await DeliveryAssignment.create({
            order: order._id,
            brodcastedTo: candidates,
            status: "broadcasted"
        })
    }

    await assignment.populate("order")

    for (const boy of availableDeliveryBoys) {
        if (boy.socketId) {
            await emitEventHandler("new-assignment", assignment, boy.socketId)
        }
    }

    return {
        assignment,
        availableBoys: availableDeliveryBoys.map((b: any) => ({
            id: String(b._id),
            name: b.name,
            mobile: b.mobile,
            latitude: b.location?.coordinates?.[1] ?? 0,
            longitude: b.location?.coordinates?.[0] ?? 0
        }))
    }
}
