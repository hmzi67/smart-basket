/**
 * Clear every delivery boy's current order.
 *
 * Removes the rider-side state only:
 *   - deletes the DeliveryAssignment join documents (assigned + broadcasted)
 *   - detaches `assignedDeliveryBoy` and `assignment` from the affected orders
 *   - returns any "out of delivery" order to "pending"
 *
 * The customer's Order documents are kept, so nothing is lost and an admin can
 * dispatch them again from Manage Orders. Delivered and cancelled orders are
 * never touched.
 *
 *   node scripts/clear-delivery-assignments.mjs
 *
 * Reads MONGODB_URI from .env.local.
 */
import mongoose from "mongoose"
import fs from "node:fs"

const envFile = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
const uri = envFile
    .split("\n")
    .find((line) => line.startsWith("MONGODB_URI="))
    ?.slice("MONGODB_URI=".length)
    .trim()

if (!uri) {
    console.error("MONGODB_URI not found in .env.local")
    process.exit(1)
}

await mongoose.connect(uri)
const db = mongoose.connection
const assignments = db.collection("deliveryassignments")
const orders = db.collection("orders")

// every assignment a rider currently holds or has been offered
const open = await assignments.find({ status: { $in: ["assigned", "broadcasted"] } }).toArray()
const orderIds = open.map((a) => a.order).filter(Boolean)

console.log(`open assignments: ${open.length}`)

// put the orders back in the admin's queue
const reset = await orders.updateMany(
    {
        $or: [{ _id: { $in: orderIds } }, { assignedDeliveryBoy: { $ne: null, $exists: true } }],
        status: { $nin: ["delivered", "cancelled"] },
    },
    {
        $set: { status: "pending" },
        $unset: { assignedDeliveryBoy: "", assignment: "", deliveryOtp: "", deliveryOtpExpiresAt: "" },
    }
)
console.log(`orders returned to pending: ${reset.modifiedCount}`)

const removed = await assignments.deleteMany({ status: { $in: ["assigned", "broadcasted"] } })
console.log(`assignment documents deleted: ${removed.deletedCount}`)

console.log("\n--- after ---")
const byStatus = await assignments.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]).toArray()
console.log("remaining assignments:", byStatus.length ? byStatus.map((g) => `${g._id}=${g.n}`).join(", ") : "none")
console.log("orders still attached to a rider:", await orders.countDocuments({ assignedDeliveryBoy: { $ne: null, $exists: true } }))

await mongoose.disconnect()
