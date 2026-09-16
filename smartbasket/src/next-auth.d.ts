import type { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: DefaultSession["user"] & {
            id: string
            role: string
        }
    }

    interface User {
        id: string
          name: string
            email: string
        role: string
    }
}
export {}