import { auth } from "@/auth"
import connectDb from "@/lib/db"
import Grocery from "@/models/grocery.model"
import { NextResponse } from "next/server"

/**
 * Full grocery list for the admin panel, including out-of-stock and
 * switched-off items. The customer-facing listing is /api/groceries.
 */
export async function GET() {
  try {
    await connectDb()
    const session = await auth()
    if (session?.user?.role !== "admin" && session?.user?.role !== "shopkeeper") {
      return NextResponse.json({ message: "only admins and shopkeepers can view all groceries" }, { status: 403 })
    }

    const groceries = await Grocery.find({}).sort({ createdAt: -1 })
    return NextResponse.json(groceries, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: `get groceries error ${error}` }, { status: 500 })
  }
}
