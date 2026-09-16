import crypto from "crypto"

export const MIN_PASSWORD_LENGTH = 8

/**
 * Minimum password strength, shared by register, reset and profile change so
 * the three cannot drift apart. Returns null when the password is acceptable.
 */
export function validatePassword(password: unknown): string | null {
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    }
    if (!/[a-zA-Z]/.test(password)) {
        return "Password must contain at least one letter"
    }
    if (!/\d/.test(password)) {
        return "Password must contain at least one number"
    }
    return null
}

/** Raw token for the email link; only its hash is stored. */
export function createResetToken() {
    const token = crypto.randomBytes(32).toString("hex")
    return { token, tokenHash: hashResetToken(token) }
}

export function hashResetToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex")
}

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

/** Delivery OTP policy, shared by the send and verify routes. */
export const OTP_TTL_MS = 10 * 60 * 1000
export const MAX_OTP_ATTEMPTS = 5
