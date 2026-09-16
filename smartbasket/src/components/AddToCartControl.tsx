"use client";

import React from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { addToCart, decreaseQuantity, increaseQuantity } from "@/redux/cartSlice";

interface IGrocery {
    _id: string
    name: string
    category: string
    price: string
    unit: string
    image: string
    stock?: number
}

/**
 * Add-to-cart button that turns into a quantity stepper once the item is in the
 * cart. Shared by the product card and the product detail page so the stock
 * clamping only has to be right in one place.
 */
function AddToCartControl({ item, size = "sm" }: { item: IGrocery; size?: "sm" | "lg" }) {
    const dispatch = useDispatch<AppDispatch>()
    const { cartData } = useSelector((state: RootState) => state.cart)
    const cartItem = cartData.find((i) => i._id === String(item._id))

    const stock = item.stock ?? 0
    const outOfStock = stock < 1
    const atStockLimit = Boolean(cartItem && cartItem.quantity >= stock)

    if (outOfStock) {
        return (
            <button
                disabled
                className={`mt-4 w-full rounded-full bg-gray-200 text-gray-500 font-medium cursor-not-allowed ${size === "lg" ? "py-3 text-base" : "py-2 text-sm"}`}
            >
                Out of stock
            </button>
        )
    }

    if (!cartItem) {
        return (
            <motion.button
                className={`mt-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium transition-all w-full ${size === "lg" ? "py-3 text-base" : "py-2 text-sm"}`}
                whileTap={{ scale: 0.96 }}
                onClick={() => dispatch(addToCart({ ...item, stock, quantity: 1 }))}
            >
                <ShoppingCart size={size === "lg" ? 20 : 16} /> Add to Cart
            </motion.button>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mt-4 flex items-center justify-center bg-green-50 border border-green-200 rounded-full px-4 gap-4 ${size === "lg" ? "py-3" : "py-2"}`}
        >
            <button
                aria-label={`Remove one ${item.name}`}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 transition-all"
                onClick={() => dispatch(decreaseQuantity(String(item._id)))}
            >
                <Minus size={16} className="text-green-700" />
            </button>

            <span className="text-sm font-semibold text-gray-800 min-w-[24px] text-center">
                {cartItem.quantity}
            </span>

            <button
                aria-label={`Add one ${item.name}`}
                disabled={atStockLimit}
                title={atStockLimit ? `Only ${stock} left in stock` : undefined}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                onClick={() => dispatch(increaseQuantity(String(item._id)))}
            >
                <Plus size={16} className="text-green-700" />
            </button>
        </motion.div>
    )
}

export default AddToCartControl
