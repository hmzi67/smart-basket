/**
 * Promote an existing user to admin.
 *
 * The app deliberately has no self-service path to the admin role, so the FIRST
 * admin is created here, against the database directly. After that, an admin
 * can promote others from Admin -> Users in the UI.
 *
 *   node scripts/make-admin.mjs someone@example.com
 *
 * Reads MONGODB_URI from .env.local.
 */
import mongoose from "mongoose"
import fs from "node:fs"

const email = process.argv[2]
if (!email) {
    console.error("usage: node scripts/make-admin.mjs <email>")
    process.exit(1)
}

// minimal .env.local reader so the script needs no extra dependency
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
const result = await mongoose.connection
    .collection("users")
    .updateOne({ email }, { $set: { role: "admin" } })

if (result.matchedCount === 0) {
    console.error(`no user with email ${email} - register first, then run this again`)
    process.exitCode = 1
} else {
    console.log(`${email} is now an admin. Sign out and back in to refresh the session token.`)
}

await mongoose.disconnect()
