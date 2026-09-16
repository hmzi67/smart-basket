import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";

/** Change your own password. The current password must be supplied and match. */
export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 })
        }

        const { currentPassword, newPassword } = await req.json()

        const strengthError = validatePassword(newPassword)
        if (strengthError) {
            return NextResponse.json({ message: strengthError }, { status: 400 })
        }

        const user = await User.findById(session.user.id)
        if (!user) {
            return NextResponse.json({ message: "user not found" }, { status: 404 })
        }
        if (!user.password) {
            return NextResponse.json(
                { message: "This account signs in with Google and has no password to change" },
                { status: 400 }
            )
        }

        if (typeof currentPassword !== "string" || !(await bcrypt.compare(currentPassword, user.password))) {
            return NextResponse.json({ message: "Your current password is incorrect" }, { status: 400 })
        }

        user.password = await bcrypt.hash(newPassword, 10)
        // any outstanding reset link is no longer valid
        user.resetPasswordTokenHash = null
        user.resetPasswordExpiresAt = null
        await user.save()

        return NextResponse.json({ message: "Password changed" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `change password error ${error}` }, { status: 500 })
    }
}
