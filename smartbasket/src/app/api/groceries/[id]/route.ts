import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

/**
 * Public product detail.
 *
 * Unlike the listing this does not require stock > 0 - an item that is
 * temporarily sold out still has a page, showing "Out of stock". An item the
 * admin has switched off (isAvailable false) is a 404.
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDb()
        const { id } = await context.params

        const grocery = await Grocery.findOne({ _id: id, isAvailable: true }).lean()
        if (!grocery) {
            return NextResponse.json({ message: "product not found" }, { status: 404 })
        }

        return NextResponse.json(grocery, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `get product error ${error}` }, { status: 500 })
    }
}
