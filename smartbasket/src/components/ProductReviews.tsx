'use client'

import axios from 'axios'
import { Loader2, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

interface IReview {
    _id: string
    rating: number
    comment?: string
    createdAt: string
    user?: { name?: string }
}

interface Props {
    groceryId: string
    initialReviews: IReview[]
    /** true only when this customer has a delivered order containing the item */
    canReview: boolean
    myReview: IReview | null
}

function ProductReviews({ groceryId, initialReviews, canReview, myReview }: Props) {
    const router = useRouter()
    const [rating, setRating] = useState(myReview?.rating ?? 0)
    const [comment, setComment] = useState(myReview?.comment ?? '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating < 1) return setError('Pick a star rating first')

        setLoading(true)
        setError('')
        try {
            await axios.post(`/api/groceries/${groceryId}/reviews`, { rating, comment })
            setSaved(true)
            router.refresh()
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Could not save your review. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='mt-10 bg-white rounded-2xl shadow-md p-6 border border-gray-100'>
            <h2 className='text-xl font-bold text-gray-800 mb-4'>Reviews</h2>

            {canReview ? (
                <form onSubmit={submit} className='mb-8 border-b border-gray-100 pb-6'>
                    <p className='text-sm font-medium text-gray-700 mb-2'>
                        {myReview ? 'Update your review' : 'Rate this product'}
                    </p>

                    <div className='flex gap-1 mb-3'>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type='button'
                                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    size={24}
                                    className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                                />
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        placeholder='What did you think? (optional)'
                        className='w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500'
                    />

                    <button
                        type='submit'
                        disabled={loading}
                        className='mt-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all'
                    >
                        {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : myReview ? 'Update review' : 'Submit review'}
                    </button>

                    {error && <p className='text-red-600 text-sm mt-2'>{error}</p>}
                    {saved && !error && <p className='text-green-700 text-sm mt-2'>Thanks for your review!</p>}
                </form>
            ) : (
                <p className='text-sm text-gray-500 mb-6'>
                    You can review this product once an order containing it has been delivered.
                </p>
            )}

            {initialReviews.length === 0 ? (
                <p className='text-sm text-gray-500'>No reviews yet. Be the first.</p>
            ) : (
                <ul className='space-y-5'>
                    {initialReviews.map((review) => (
                        <li key={review._id} className='border-b border-gray-50 pb-4 last:border-0'>
                            <div className='flex items-center gap-2'>
                                <div className='flex'>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={14}
                                            className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                                        />
                                    ))}
                                </div>
                                <span className='text-sm font-semibold text-gray-800'>
                                    {review.user?.name ?? 'Customer'}
                                </span>
                                <span className='text-xs text-gray-400'>
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            {review.comment && (
                                <p className='text-sm text-gray-600 mt-1.5 whitespace-pre-line'>{review.comment}</p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default ProductReviews
