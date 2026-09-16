'use client'

import axios from 'axios'
import { Loader2 } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import GroceryItemCard from './GroceryItemCard'

interface Props {
    initialItems: any[]
    initialHasMore: boolean
    total: number
    q?: string
    category?: string
}

/**
 * Paginated product grid. The first page is rendered on the server; further
 * pages come from /api/groceries. "Load more" rather than infinite scroll, to
 * match the rest of the UI (explicit buttons, no scroll hijacking).
 */
function GroceryList({ initialItems, initialHasMore, total, q, category }: Props) {
    const [items, setItems] = useState(initialItems)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const firstRender = useRef(true)

    // a new search / category renders a fresh first page on the server
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false
            return
        }
        setItems(initialItems)
        setPage(1)
        setHasMore(initialHasMore)
        setError('')
    }, [initialItems, initialHasMore])

    const loadMore = async () => {
        setLoading(true)
        setError('')
        try {
            const result = await axios.get('/api/groceries', {
                params: { page: page + 1, q, category },
            })
            setItems((prev) => [...prev, ...(result.data.items ?? [])])
            setPage(result.data.page)
            setHasMore(Boolean(result.data.hasMore))
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Could not load more items. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (items.length === 0) {
        return (
            <p className="col-span-full text-center text-gray-500 py-6">
                No groceries found.
            </p>
        )
    }

    return (
        <>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6'>
                {items.map((item: any, index: number) => (
                    <GroceryItemCard key={item._id ?? index} item={item} eager={index < 4} />
                ))}
            </div>

            {error && <p className='text-red-600 text-sm text-center mt-6'>{error}</p>}

            {hasMore && (
                <div className='flex justify-center mt-10'>
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className='flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-8 py-3 rounded-full font-medium transition-all'
                    >
                        {loading ? <><Loader2 className='w-4 h-4 animate-spin' /> Loading…</> : 'Load more'}
                    </button>
                </div>
            )}

            <p className='text-center text-xs text-gray-400 mt-4'>
                Showing {items.length} of {total}
            </p>
        </>
    )
}

export default GroceryList
