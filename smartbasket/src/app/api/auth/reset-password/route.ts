import connectDb from "@/lib/db";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";
import { hashResetToken, validatePassword } from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";

/** Finish a password reset: validate the token, set the new password, burn the token. */
export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const { token, password } = await req.json()

        if (typeof token !== "string" || !token) {
            return NextResponse.json({ message: "Missing reset token" }, { status: 400 })
        }

        const strengthError = validatePassword(password)
        if (strengthError) {
            return NextResponse.json({ message: strengthError }, { status: 400 })
        }

        // the stored value is a hash, so the raw token from the link is hashed to look it up
        const user = await User.findOne({
            resetPasswordTokenHash: hashResetToken(token),
            resetPasswordExpiresAt: { $gt: new Date() },
        }).select("+resetPasswordTokenHash +resetPasswordExpiresAt")

        if (!user) {
            return NextResponse.json(
                { message: "This reset link is invalid or has expired. Please request a new one." },
                { status: 400 }
            )
        }

        user.password = await bcrypt.hash(password, 10)
        // single use
        user.resetPasswordTokenHash = null
        user.resetPasswordExpiresAt = null
        await user.save()

        return NextResponse.json(
            { message: "Password updated. You can now log in." },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `reset password error ${error}` },
            { status: 500 }
        )
    }
}
