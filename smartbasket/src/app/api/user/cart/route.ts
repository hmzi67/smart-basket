import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Cart from "@/models/cart.model";
import Grocery from "@/models/grocery.model";
import { sellableFilter } from "@/lib/grocery";
import { NextRequest, NextResponse } from "next/server";

type IncomingItem = { _id?: string; grocery?: string; quantity?: number }

/**
 * Turn stored { grocery, quantity } pairs into the shape the Redux cart holds,
 * dropping anything that is no longer sellable and clamping quantities that now
 * exceed stock.
 */
async function hydrate(items: { grocery: unknown; quantity: number }[]) {
    const ids = items.map((i) => String(i.grocery))
    const products = await Grocery.find({ _id: { $in: ids }, ...sellableFilter }).lean()
    const byId = new Map(products.map((p: any) => [String(p._id), p]))

    const hydrated: any[] = []
    let adjusted = false

    for (const item of items) {
        const product = byId.get(String(item.grocery))
        if (!product) {
            adjusted = true
            continue
        }
        const quantity = Math.min(item.quantity, product.stock)
        if (quantity !== item.quantity) adjusted = true
        if (quantity < 1) {
            adjusted = true
            continue
        }
        hydrated.push({
            _id: String(product._id),
            name: product.name,
            category: product.category,
            price: product.price,
            unit: product.unit,
            image: product.image,
            stock: product.stock,
            quantity,
        })
    }

    return { hydrated, adjusted }
}

/** Normalise and stock-check what the browser sent before it is stored. */
async function toStorableItems(raw: IncomingItem[]) {
    const merged = new Map<string, number>()
    for (const item of raw ?? []) {
        const id = String(item.grocery ?? item._id ?? "")
        const quantity = Number(item.quantity)
        if (!id || !Number.isInteger(quantity) || quantity < 1) continue
        merged.set(id, (merged.get(id) ?? 0) + quantity)
    }
    if (merged.size === 0) return []

    const products = await Grocery.find({
        _id: { $in: [...merged.keys()] },
        ...sellableFilter,
    }).lean()

    return products
        .map((p: any) => ({
            grocery: p._id,
            // never store more than is actually on the shelf
            quantity: Math.min(merged.get(String(p._id))!, p.stock),
        }))
        .filter((i) => i.quantity >= 1)
}

export async function GET() {
    try {
        await connectDb()
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 })
        }

        const cart = await Cart.findOne({ user: session.user.id }).lean()
        const { hydrated, adjusted } = await hydrate((cart as any)?.items ?? [])

        // if items dropped out or quantities were clamped, persist the correction
        if (adjusted) {
            await Cart.findOneAndUpdate(
                { user: session.user.id },
                { $set: { items: hydrated.map((i) => ({ grocery: i._id, quantity: i.quantity })) } },
                { upsert: true }
            )
        }

        return NextResponse.json({ items: hydrated, adjusted }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `get cart error ${error}` }, { status: 500 })
    }
}

/**
 * Replace the stored cart with what the browser holds, or merge the two.
 * `mode: "merge"` is what a login uses: quantities from a guest session are
 * added on top of whatever was already saved for the account.
 */
export async function PUT(req: NextRequest) {
    try {
        await connectDb()
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 })
        }

        const { items, mode } = await req.json()
        const incoming: IncomingItem[] = Array.isArray(items) ? items : []

        let toStore = incoming
        if (mode === "merge") {
            const existing = await Cart.findOne({ user: session.user.id }).lean()
            toStore = [
                ...((existing as any)?.items ?? []).map((i: any) => ({
                    grocery: String(i.grocery),
                    quantity: i.quantity,
                })),
                ...incoming,
            ]
        }

        const storable = await toStorableItems(toStore)
        await Cart.findOneAndUpdate(
            { user: session.user.id },
            { $set: { items: storable } },
            { upsert: true }
        )

        const { hydrated } = await hydrate(storable)
        return NextResponse.json({ items: hydrated }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `save cart error ${error}` }, { status: 500 })
    }
}

export async function DELETE() {
    try {
        await connectDb()
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 })
        }
        await Cart.findOneAndUpdate(
            { user: session.user.id },
            { $set: { items: [] } },
            { upsert: true }
        )
        return NextResponse.json({ items: [] }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `clear cart error ${error}` }, { status: 500 })
    }
}
