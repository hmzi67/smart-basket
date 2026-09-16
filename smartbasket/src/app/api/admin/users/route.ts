import { publicUserFields, userFields, userError } from "@/lib/admin-users";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

/** List customers and delivery boys for the admin user-management page. */
export async function GET(req: NextRequest) {
    try {
        await connectDb()
        const session = await auth()
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "only admins can view users" }, { status: 403 })
        }

        const { searchParams } = req.nextUrl
        const role = searchParams.get("role")?.trim()
        const q = searchParams.get("q")?.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const page = Math.min(100000, Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1))
        const limit = Math.min(100, Math.max(1, Math.floor(Number(searchParams.get("limit"))) || 20))

        const filter: Record<string, any> = {}
        if (role && ["user", "deliveryBoy", "admin", "shopkeeper"].includes(role)) {
            filter.role = role
        }
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
                { mobile: { $regex: q, $options: "i" } },
            ]
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select(publicUserFields)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ])

        // order counts, so an admin can see who is actually active
        const orderCounts = await Order.aggregate([
            { $match: { user: { $in: users.map((u: any) => u._id) } } },
            { $group: { _id: "$user", count: { $sum: 1 } } },
        ])
        const countByUser = new Map(orderCounts.map((c: any) => [String(c._id), c.count]))

        return NextResponse.json({
            users: users.map((u: any) => ({ ...u, orderCount: countByUser.get(String(u._id)) ?? 0 })),
            page,
            limit,
            total,
            hasMore: page * limit < total,
        }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `list users error ${error}` }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (session?.user?.role !== "admin") return NextResponse.json({ message: "Only admins can create users" }, { status: 403 })
        await connectDb()
        const data = await userFields(await req.json(), true)
        const created = await User.create(data)
        const user = await User.findById(created._id).select(publicUserFields)
        return NextResponse.json({ user, message: "User created" }, { status: 201 })
    } catch (error) { return userError(error) }
}
