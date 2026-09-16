import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, sellableFilter } from "@/lib/grocery";
import { NextRequest, NextResponse } from "next/server";

/**
 * Public grocery listing: availability filter + search + category + pagination.
 */
export async function GET(req: NextRequest) {
    try {
        await connectDb()
        const { searchParams } = req.nextUrl

        const q = searchParams.get("q")?.trim()
        const category = searchParams.get("category")?.trim()
        const page = Math.max(1, Number(searchParams.get("page")) || 1)
        const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("limit")) || DEFAULT_PAGE_SIZE))

        const filter: Record<string, any> = { ...sellableFilter }
        if (category) {
            filter.category = category
        }
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { category: { $regex: q, $options: "i" } },
            ]
        }

        const [items, total] = await Promise.all([
            Grocery.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Grocery.countDocuments(filter),
        ])

        return NextResponse.json({
            items,
            page,
            limit,
            total,
            hasMore: page * limit < total,
        }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `get groceries error ${error}` }, { status: 500 })
    }
}
