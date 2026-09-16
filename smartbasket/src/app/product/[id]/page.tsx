import { auth } from '@/auth'
import AddToCartControl from '@/components/AddToCartControl'
import ProductReviews from '@/components/ProductReviews'
import RatingStars from '@/components/RatingStars'
import connectDb from '@/lib/db'
import Grocery from '@/models/grocery.model'
import Order from '@/models/order.model'
import Review from '@/models/review.model'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import React from 'react'

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params

    await connectDb()
    const session = await auth()
    if (!session?.user?.id) {
        redirect('/login')
    }

    // isAvailable false is a 404; out of stock still has a page
    const product = await Grocery.findOne({ _id: id, isAvailable: true }).lean()
    if (!product) {
        notFound()
    }

    const [rawReviews, deliveredOrder, myReview] = await Promise.all([
        Review.find({ grocery: id }).sort({ createdAt: -1 }).limit(50).populate('user', 'name image').lean(),
        // the same entitlement rule the review API enforces
        Order.findOne({ user: session.user.id, status: 'delivered', 'items.grocery': id }).select('_id').lean(),
        Review.findOne({ grocery: id, user: session.user.id }).lean(),
    ])

    const plainProduct = JSON.parse(JSON.stringify(product))
    const plainReviews = JSON.parse(JSON.stringify(rawReviews))
    const plainMyReview = myReview ? JSON.parse(JSON.stringify(myReview)) : null
    const stock = plainProduct.stock ?? 0

    return (
        <div className='w-[95%] sm:w-[90%] md:w-[80%] mx-auto mt-8 mb-24'>
            <Link href='/' className='flex items-center gap-2 text-green-700 hover:text-green-800 font-medium transition-all mb-6'>
                <ArrowLeft size={20} />
                <span>Back to home</span>
            </Link>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-2xl shadow-md p-6 border border-gray-100'>
                <div className='relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden'>
                    <Image
                        src={plainProduct.image}
                        alt={plainProduct.name}
                        fill
                        sizes='(max-width: 768px) 100vw, 40vw'
                        priority
                        className='object-contain p-6'
                    />
                </div>

                <div className='flex flex-col'>
                    <p className='text-sm text-gray-500 font-medium'>{plainProduct.category}</p>
                    <h1 className='text-2xl md:text-3xl font-bold text-gray-800 mt-1'>{plainProduct.name}</h1>

                    <RatingStars
                        rating={plainProduct.rating ?? 0}
                        numReviews={plainProduct.numReviews ?? 0}
                        className='mt-3'
                    />

                    <div className='flex items-baseline gap-3 mt-4'>
                        <span className='text-3xl font-bold text-green-700'>Rs.{plainProduct.price}</span>
                        <span className='text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full'>
                            per {plainProduct.unit}
                        </span>
                    </div>

                    <div className='mt-4'>
                        {stock < 1 ? (
                            <span className='text-sm font-semibold text-red-600'>Out of stock</span>
                        ) : stock <= 5 ? (
                            <span className='text-sm font-semibold text-amber-700'>Only {stock} left in stock</span>
                        ) : (
                            <span className='text-sm font-semibold text-green-700'>In stock ({stock} available)</span>
                        )}
                    </div>

                    {plainProduct.description && (
                        <div className='mt-6'>
                            <h2 className='font-semibold text-gray-800 mb-2'>Description</h2>
                            <p className='text-gray-600 text-sm leading-relaxed whitespace-pre-line'>
                                {plainProduct.description}
                            </p>
                        </div>
                    )}

                    {session.user.role === 'user' && (
                        <div className='mt-auto pt-6'>
                            <AddToCartControl item={plainProduct} size='lg' />
                        </div>
                    )}
                </div>
            </div>

            <ProductReviews
                groceryId={String(plainProduct._id)}
                initialReviews={plainReviews}
                canReview={Boolean(deliveredOrder) && session.user.role === 'user'}
                myReview={plainMyReview}
            />
        </div>
    )
}
