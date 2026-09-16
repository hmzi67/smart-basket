import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
import Order from "@/models/order.model";
import Review from "@/models/review.model";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

/** Recompute the denormalised average on the product after any review write. */
async function refreshProductRating(groceryId: string) {
    const [summary] = await Review.aggregate([
        { $match: { grocery: new mongoose.Types.ObjectId(groceryId) } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])

    await Grocery.findByIdAndUpdate(groceryId, {
        rating: summary ? Math.round(summary.avg * 10) / 10 : 0,
        numReviews: summary ? summary.count : 0,
    })
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDb()
        const { id } = await context.params

        const reviews = await Review.find({ grocery: id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("user", "name image")
            .lean()

        return NextResponse.json({ reviews }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `get reviews error ${error}` }, { status: 500 })
    }
}

/**
 * Leave or update a review.
 *
 * Only a customer who has actually received this product may review it: there
 * must be one of their own orders with status "delivered" containing the item.
 * That check is here, on the server; the UI merely hides the form.
 */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDb()
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ message: "please log in to leave a review" }, { status: 401 })
        }

        const { id } = await context.params
        const { rating, comment } = await req.json()

        const numericRating = Number(rating)
        if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
            return NextResponse.json({ message: "rating must be a whole number from 1 to 5" }, { status: 400 })
        }
        if (comment != null && (typeof comment !== "string" || comment.length > 1000)) {
            return NextResponse.json({ message: "comment must be under 1000 characters" }, { status: 400 })
        }

        const deliveredOrder = await Order.findOne({
            user: session.user.id,
            status: "delivered",
            "items.grocery": id,
        }).select("_id")

        if (!deliveredOrder) {
            return NextResponse.json(
                { message: "You can only review items from an order that has been delivered" },
                { status: 403 }
            )
        }

        await Review.findOneAndUpdate(
            { grocery: id, user: session.user.id },
            {
                grocery: id,
                user: session.user.id,
                order: deliveredOrder._id,
                rating: numericRating,
                comment: comment ?? "",
            },
            { upsert: true, returnDocument: "after" }
        )

        await refreshProductRating(id)

        return NextResponse.json({ message: "Thanks for your review!" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `save review error ${error}` }, { status: 500 })
    }
}
