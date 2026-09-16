import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

/**
 * Edit the signed-in user's own profile.
 *
 * Only name, mobile and address are writable here. Role, email and isActive are
 * deliberately not accepted, so this route can't be used to escalate or to take
 * over another account's address.
 */
export async function PUT(req: NextRequest) {
    try {
        await connectDb()
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 })
        }

        const { name, mobile, address } = await req.json()

        if (typeof name !== "string" || name.trim().length < 2) {
            return NextResponse.json({ message: "Name must be at least 2 characters" }, { status: 400 })
        }
        if (typeof mobile !== "string" || !/^\d{10,15}$/.test(mobile)) {
            return NextResponse.json({ message: "Enter a valid mobile number" }, { status: 400 })
        }
        if (address != null && (typeof address !== "string" || address.length > 300)) {
            return NextResponse.json({ message: "Address must be under 300 characters" }, { status: 400 })
        }

        const user = await User.findByIdAndUpdate(
            session.user.id,
            { name: name.trim(), mobile, address: address?.trim() ?? "" },
            { returnDocument: "after" }
        ).select("-password")

        if (!user) {
            return NextResponse.json({ message: "user not found" }, { status: 404 })
        }

        return NextResponse.json({ user, message: "Profile updated" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `update profile error ${error}` }, { status: 500 })
    }
}
