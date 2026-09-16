import Credentials from "next-auth/providers/credentials"
import connectDb from "./lib/db"
import User from "./models/user.model"
import bcrypt from "bcryptjs"
import Google from "next-auth/providers/google"
import NextAuth from "next-auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDb()
        const email = credentials?.email
        const password = credentials?.password as string
        const user = await User.findOne({ email })
        if (!user) {
          throw new Error("user does not exist")
        }
        if (!user.password) {
          throw new Error("this account signs in with Google")
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
          throw new Error("incorrect password")
        }
        if (user.isActive === false) {
          throw new Error("this account has been deactivated")
        }
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    // token ke ander user ka data dalta hai
    async signIn({ user, account }) {
      if (account?.provider == "google") {
        await connectDb()
        let dbUser = await User.findOne({ email: user.email })
        if (!dbUser) {
          dbUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
          })
        }

        if (dbUser.isActive === false) {
          return false
        }

        user.id = dbUser._id.toString()
        user.role = dbUser.role
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.role = user.role
      }
      // Check current permissions on every session read, including existing JWTs.
      // Never trust a role supplied by useSession().update().
      if (!token.id) return null
      await connectDb()
      const dbUser = await User.findById(token.id).select("role name isActive image")
      if (!dbUser || dbUser.isActive === false) return null
      token.role = dbUser.role
      token.name = dbUser.name
      token.picture = dbUser.image || null
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.role = token.role as string
        session.user.image = token.picture as string | null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 10 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
})