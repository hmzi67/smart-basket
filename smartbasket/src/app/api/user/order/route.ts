import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Order from "@/models/order.model";
import Cart from "@/models/cart.model";

import { NextRequest, NextResponse } from "next/server";
import emitEventHandler from "@/lib/emitEventHandler";
import { auth } from "@/auth";
import { calcTotals } from "@/lib/cart";
import { releaseStock, reserveStock, validateCartAgainstStock } from "@/lib/stock";

export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Please log in to place an order" },
                { status: 401 }
            )
        }
        const { items, paymentMethod, address, paymentProof } = await req.json()
        const userId = session.user.id

        const missing = Object.entries({ items: items?.length, paymentMethod, address })
            .filter(([, value]) => !value)
            .map(([key]) => key)
        if (missing.length > 0) {
            return NextResponse.json(
                { message: `Missing order fields: ${missing.join(", ")}` },
                { status: 400 }
            )
        }
        if (paymentMethod === "online" && !paymentProof) {
            return NextResponse.json(
                { message: "Upload a screenshot of your transaction to place an online order" },
                { status: 400 }
            )
        }

        // Check if user exists
        const user = await User.findById(userId)
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Re-price and stock-check the cart against the database. Never trust the
        // prices or availability the browser sent.
        const checked = await validateCartAgainstStock(items)
        if ("error" in checked) {
            return NextResponse.json({ message: checked.error }, { status: 409 })
        }
        const { lines } = checked
        const { finalTotal } = calcTotals(lines)

        const reserved = await reserveStock(lines)
        if (!reserved.ok) {
            return NextResponse.json({ message: reserved.error }, { status: 409 })
        }

        try {
            // Create new order
            const newOrder = await Order.create({
                user: userId,
                items: lines,
                paymentMethod,
                totalAmount: String(finalTotal),
                address,
                paymentProof: paymentMethod === "online" ? paymentProof : null,
            })

            // the cart has become an order — empty the stored copy
            await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } })

            await emitEventHandler("new-order", newOrder)

            return NextResponse.json(
                newOrder,
                { status: 201 }
            )
        } catch (error) {
            // order creation failed after stock was taken — give it back
            await releaseStock(lines)
            throw error
        }

    } catch (error) {
        return NextResponse.json(
            { message : `place order error ${error}` },
            { status: 500 }
        )
    }
}
