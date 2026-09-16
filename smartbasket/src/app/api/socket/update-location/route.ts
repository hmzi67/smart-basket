import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Order from "@/models/order.model";
import DeliveryTracking from "@/models/deliveryTracking.model";
import { distanceInMeters } from "@/lib/geo";
import { NextRequest, NextResponse } from "next/server";

// watchPosition fires constantly; only keep a breadcrumb when the rider has
// actually moved, or when enough time has passed to prove they haven't.
const MIN_TRAIL_DISTANCE_METERS = 15
const MIN_TRAIL_INTERVAL_MS = 20_000

export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const { userId, location } = await req.json()

        const coordinates = location?.coordinates
        if (!userId || !Array.isArray(coordinates) || coordinates.length !== 2) {
            return NextResponse.json({
                message: "Missing userId or location"
            }, { status: 400 })
        }

        // GeoJSON Point: [longitude, latitude]
        const point = [Number(coordinates[0]), Number(coordinates[1])]
        const user = await User.findByIdAndUpdate(
            userId,
            {
                location: { type: "Point", coordinates: point },
                isOnline: true
            },
            { returnDocument: "after" }
        ).select("-password")

        if (!user) {
            return NextResponse.json({
                message: "User not found"
            }, { status: 404 })
        }

        // A delivery boy on an active run also leaves a trail for that order.
        if (user.role === "deliveryBoy") {
            const activeOrder = await Order.findOne({
                assignedDeliveryBoy: user._id,
                status: "out of delivery"
            }).select("_id")

            if (activeOrder) {
                const last = await DeliveryTracking.findOne({ order: activeOrder._id })
                    .sort({ recordedAt: -1 })
                    .select("coordinates recordedAt")

                const movedFar =
                    !last || distanceInMeters(last.coordinates, point) >= MIN_TRAIL_DISTANCE_METERS
                const waitedLong =
                    !last || Date.now() - new Date(last.recordedAt).getTime() >= MIN_TRAIL_INTERVAL_MS

                if (movedFar || waitedLong) {
                    await DeliveryTracking.create({
                        order: activeOrder._id,
                        deliveryBoy: user._id,
                        coordinates: point,
                        recordedAt: new Date()
                    })
                }
            }
        }

        return NextResponse.json({
            message: "Location updated",
            user
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({
            message: `update location error ${error}`
        }, { status: 500 })
    }
}
