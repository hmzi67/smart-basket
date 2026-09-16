import mongoose from "mongoose";

export interface ICartItem {
    grocery: mongoose.Types.ObjectId
    quantity: number
}

export interface ICart {
    _id?: mongoose.Types.ObjectId
    user: mongoose.Types.ObjectId
    items: ICartItem[]
    createdAt?: Date
    updatedAt?: Date
}

/**
 * One cart document per user. Only the product reference and the quantity are
 * stored — name, price and image are read back from Grocery, so a cart that has
 * been sitting around for a week can't resurrect a stale price.
 */
const cartSchema = new mongoose.Schema<ICart>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        items: [
            {
                grocery: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Grocery",
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                }
            }
        ]
    },
    { timestamps: true }
);

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema)
export default Cart;
