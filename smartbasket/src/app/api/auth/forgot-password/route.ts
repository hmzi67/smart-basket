import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { sendMail } from "@/lib/mailer";
import { createResetToken, RESET_TOKEN_TTL_MS } from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";

/**
 * Start a password reset.
 *
 * Uses the same success message whether or not the address exists,
 * so this route can't be used to discover who has an account.
 *
 * Requires EMAIL / PASS (the Gmail credentials src/lib/mailer.ts uses) and
 * NEXT_PUBLIC_APP_URL for the link; without EMAIL/PASS the mail send fails and
 * returns a service error so the user can retry.
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
        // Google accounts can also set a local password by proving ownership
        // of their email through the same single-use reset link.

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
                 `<p>Hello,</p>
                 <p>Click the link below to choose a new password. It expires in one hour.</p>
                 <p><a href="${resetUrl}">Reset my password</a></p>
                 <p>If you didn't ask for this, you can ignore this email.</p>`
            )
        } catch (mailError) {
            // Match this token so a newer request is not invalidated.
            await User.updateOne(
                { _id: user._id, resetPasswordTokenHash: tokenHash },
                { $unset: { resetPasswordTokenHash: 1, resetPasswordExpiresAt: 1 } }
            )
            const code = mailError && typeof mailError === "object" && "code" in mailError
                ? String(mailError.code) : "UNKNOWN"
            console.error("forgot-password: reset email delivery failed", code)
            return NextResponse.json(
                { message: "We couldn't send the reset email. Please try again shortly." },
                { status: 503 }
            )
        }

        return genericResponse
    } catch (error) {
        console.error("forgot-password: request failed", error instanceof Error ? error.name : "UNKNOWN")
        return NextResponse.json(
            { message: "Could not process your password reset. Please try again." },
            { status: 500 }
        )
    }
}
