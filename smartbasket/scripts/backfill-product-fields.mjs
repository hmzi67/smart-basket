/**
 * One-off migration for products created before stock/availability existed.
 *
 * Without it every existing grocery is missing `stock`, so the sellable filter
 * ({ isAvailable: true, stock: { $gt: 0 } }) hides the whole shop.
 *
 * Idempotent: each $set only touches documents where the field is still absent.
 *
 *   node scripts/backfill-product-fields.mjs [defaultStock]
 *
 * Reads MONGODB_URI from .env.local.
 */
import mongoose from "mongoose"
import fs from "node:fs"

const defaultStock = Number(process.argv[2] ?? 100)
if (!Number.isFinite(defaultStock) || defaultStock < 0) {
    console.error("defaultStock must be a number >= 0")
    process.exit(1)
}

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
const groceries = mongoose.connection.collection("groceries")
const users = mongoose.connection.collection("users")
const orders = mongoose.connection.collection("orders")

const results = await Promise.all([
    groceries.updateMany({ stock: { $exists: false } }, { $set: { stock: defaultStock } }),
    groceries.updateMany({ isAvailable: { $exists: false } }, { $set: { isAvailable: true } }),
    groceries.updateMany({ description: { $exists: false } }, { $set: { description: "" } }),
    groceries.updateMany({ rating: { $exists: false } }, { $set: { rating: 0, numReviews: 0 } }),
    users.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } }),
    orders.updateMany({ deliveryOtpAttempts: { $exists: false } }, { $set: { deliveryOtpAttempts: 0 } }),
])

const labels = [
    `groceries.stock (= ${defaultStock})`,
    "groceries.isAvailable (= true)",
    "groceries.description",
    "groceries.rating/numReviews",
    "users.isActive (= true)",
    "orders.deliveryOtpAttempts",
]
results.forEach((r, i) => console.log(`${labels[i]}: ${r.modifiedCount} updated`))

await mongoose.disconnect()
