import Grocery from "@/models/grocery.model";
import { sellableFilter } from "@/lib/grocery";

export interface IOrderLine {
    grocery: string
    name: string
    price: string
    unit: string
    image: string
    quantity: number
}

/**
 * Validate the client's cart against the database.
 *
 * Returns order lines built from the *database* values (price, name, unit,
 * image) so a tampered client payload can't change what an order costs, and an
 * error message when anything is unavailable or short on stock.
 */
export async function validateCartAgainstStock(
    rawItems: { _id?: string; grocery?: string; quantity?: number }[]
): Promise<{ lines: IOrderLine[] } | { error: string }> {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
        return { error: "Your cart is empty" }
    }

    const lines: IOrderLine[] = []
    for (const raw of rawItems) {
        const id = String(raw.grocery ?? raw._id ?? "")
        const quantity = Number(raw.quantity)

        if (!id) {
            return { error: "A cart item is missing its product id" }
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            return { error: "Quantity must be a whole number of at least 1" }
        }

        const product = await Grocery.findOne({ _id: id, ...sellableFilter })
        if (!product) {
            return { error: "One of the items in your cart is no longer available" }
        }
        if (product.stock < quantity) {
            return {
                error: `Only ${product.stock} x ${product.name} left in stock`,
            }
        }

        lines.push({
            grocery: String(product._id),
            name: product.name,
            price: product.price,
            unit: product.unit,
            image: product.image,
            quantity,
        })
    }

    return { lines }
}

/**
 * Decrement stock for every line, conditionally so two shoppers racing for the
 * last unit can't both win. If any line fails, the already-applied decrements
 * are put back — this project's MongoDB isn't guaranteed to be a replica set,
 * so a real transaction isn't available.
 */
export async function reserveStock(
    lines: IOrderLine[]
): Promise<{ ok: true } | { ok: false; error: string }> {
    const applied: IOrderLine[] = []

    for (const line of lines) {
        const result = await Grocery.updateOne(
            { _id: line.grocery, stock: { $gte: line.quantity }, isAvailable: true },
            { $inc: { stock: -line.quantity } }
        )
        if (result.modifiedCount !== 1) {
            await releaseStock(applied)
            return { ok: false, error: `${line.name} just went out of stock` }
        }
        applied.push(line)
    }

    return { ok: true }
}

/** Put stock back — used on a failed reservation and on order cancellation. */
export async function releaseStock(lines: IOrderLine[]) {
    for (const line of lines) {
        await Grocery.updateOne(
            { _id: line.grocery },
            { $inc: { stock: line.quantity } }
        )
    }
}
