import mongoose from "mongoose";

export interface IReview {
    _id?: mongoose.Types.ObjectId
    grocery: mongoose.Types.ObjectId
    user: mongoose.Types.ObjectId
    /** the delivered order that entitles this user to review the product */
    order: mongoose.Types.ObjectId
    rating: number
    comment?: string
    createdAt?: Date
    updatedAt?: Date
}

const reviewSchema = new mongoose.Schema<IReview>(
    {
        grocery: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Grocery",
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            default: "",
            maxlength: 1000
        }
    },
    { timestamps: true }
);

// one review per product per customer; a second submission edits the first
reviewSchema.index({ grocery: 1, user: 1 }, { unique: true })

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema)
export default Review;
