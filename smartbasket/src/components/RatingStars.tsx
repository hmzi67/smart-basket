import { Star } from "lucide-react";
import React from "react";

/**
 * Read-only average rating. Renders nothing when a product has no reviews yet,
 * so an unrated item doesn't look like a zero-star item.
 */
function RatingStars({
    rating,
    numReviews,
    className = "",
    showCount = true,
}: {
    rating: number
    numReviews: number
    className?: string
    showCount?: boolean
}) {
    if (!numReviews) {
        return <p className={`text-xs text-gray-400 ${className}`}>No reviews yet</p>
    }

    return (
        <div className={`flex items-center gap-1 ${className}`} aria-label={`${rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={14}
                    className={star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                />
            ))}
            <span className="text-xs text-gray-600 ml-1">
                {rating.toFixed(1)}{showCount && ` (${numReviews})`}
            </span>
        </div>
    )
}

export default RatingStars
