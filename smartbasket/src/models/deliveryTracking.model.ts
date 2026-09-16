import mongoose from "mongoose";

export interface IDeliveryTracking {
    _id?: mongoose.Types.ObjectId
    order: mongoose.Types.ObjectId
    deliveryBoy: mongoose.Types.ObjectId
    /** GeoJSON order: [longitude, latitude] */
    coordinates: number[]
    recordedAt: Date
    createdAt?: Date
    updatedAt?: Date
}

/**
 * Time-stamped breadcrumb trail of a delivery boy's position for one order.
 *
 * `User.location` still holds the single current position — the $near query
 * that finds nearby delivery boys depends on it, and the live map redraws from
 * the socket event rather than from this collection. This trail is the history:
 * it lets the customer's map draw the route already travelled and survives a
 * page reload, which a single mutable field cannot.
 */
const deliveryTrackingSchema = new mongoose.Schema<IDeliveryTracking>(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },
        deliveryBoy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        },
        recordedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// replaying one order's trail in order
deliveryTrackingSchema.index({ order: 1, recordedAt: 1 })

const DeliveryTracking =
    mongoose.models.DeliveryTracking || mongoose.model("DeliveryTracking", deliveryTrackingSchema)
export default DeliveryTracking;
