import React from 'react'
import Link from 'next/link'
import HeroSection from './HeroSection'
import CategorySlider from './CategorySlider'
import GroceryList from './GroceryList'

interface Props {
  groceryList: any[]
  hasMore: boolean
  total: number
  q?: string
  category?: string
}

function UserDashboard({ groceryList, hasMore, total, q, category }: Props) {
  const heading = category
    ? category
    : q
      ? `Results for “${q}”`
      : 'Popular Grocery items'

  return (
    <>
      <HeroSection />
      <CategorySlider activeCategory={category} />

      <div className='w-[90%] md:w-[80%] mx-auto mt-10'>
        <div className='flex items-baseline justify-between mb-6 gap-4 flex-wrap'>
          <h2 className='text-2xl md:text-3xl font-bold text-green-700'>
            {heading}
          </h2>
          {(category || q) && (
            <Link href='/' className='text-sm text-green-700 underline hover:text-green-800'>
              Clear filter
            </Link>
          )}
        </div>

        <GroceryList
          initialItems={groceryList}
          initialHasMore={hasMore}
          total={total}
          q={q}
          category={category}
        />
      </div>
    </>
  )
}

export default UserDashboard
