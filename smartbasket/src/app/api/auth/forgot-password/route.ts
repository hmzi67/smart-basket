import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { sendMail } from "@/lib/mailer";
import { createResetToken, RESET_TOKEN_TTL_MS } from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";

/**
 * Start a password reset.
 *
 * Always answers 200 with the same message whether or not the address exists,
 * so this route can't be used to discover who has an account.
 *
 * Requires EMAIL / PASS (the Gmail credentials src/lib/mailer.ts uses) and
 * NEXT_PUBLIC_APP_URL for the link; without EMAIL/PASS the mail send fails and
 * is logged, and no reset mail arrives.
 */
export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const { email } = await req.json()

        const genericResponse = NextResponse.json(
            { message: "If that email has an account, a reset link is on its way." },
            { status: 200 }
        )

        if (typeof email !== "string" || !email.includes("@")) {
            return genericResponse
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
        if (!user || user.isActive === false) {
            return genericResponse
        }
        if (!user.password) {
            // Google-only account: there is no password to reset
            return genericResponse
        }

        const { token, tokenHash } = createResetToken()
        user.resetPasswordTokenHash = tokenHash
        user.resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
        await user.save()

        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
            req.nextUrl.origin
        const resetUrl = `${baseUrl}/reset-password?token=${token}`

        try {
            await sendMail(
                user.email,
                "Reset your SmartBasket password",
                `<p>Hi ${user.name},</p>
                 <p>Click the link below to choose a new password. It expires in one hour.</p>
                 <p><a href="${resetUrl}">Reset my password</a></p>
                 <p>If you didn't ask for this, you can ignore this email.</p>`
            )
        } catch (mailError) {
            // Don't leak mail-server problems to the caller, but make them
            // visible in the server log.
            console.error("forgot-password: could not send reset mail", mailError)
        }

        return genericResponse
    } catch (error) {
        return NextResponse.json(
            { message: `forgot password error ${error}` },
            { status: 500 }
        )
    }
}
