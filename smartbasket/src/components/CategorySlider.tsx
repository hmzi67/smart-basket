'use client'
import { Apple, Baby, Box, Coffee, Cookie, Flame, Heart, Home, Milk, Wheat, ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from "motion/react"
import Link from 'next/link'

function CategorySlider({ activeCategory }: { activeCategory?: string }) {
    const categories = [
        { id: 1, name: "Fruits & Vegetables", icon: Apple, color: "bg-green-100" },
        { id: 2, name: "Dairy & Eggs", icon: Milk, color: "bg-yellow-100" },
        { id: 3, name: "Rice, Atta & Grains", icon: Wheat, color: "bg-orange-100" },
        { id: 4, name: "Snacks & Biscuits", icon: Cookie, color: "bg-pink-100" },
        { id: 5, name: "Spices & Masalas", icon: Flame, color: "bg-red-100" },
        { id: 6, name: "Beverages & Drinks", icon: Coffee, color: "bg-blue-100" },
        { id: 7, name: "Personal Care", icon: Heart, color: "bg-purple-100" },
        { id: 8, name: "Household Essentials", icon: Home, color: "bg-lime-100" },
        { id: 9, name: "Instant & Packaged Food", icon: Box, color: "bg-teal-100" },
        { id: 10, name: "Baby & Pet Care", icon: Baby, color: "bg-rose-100" },
    ]
        const [showLeft,setShowLeft] = useState<boolean>(false);
        const [showRight,setShowRight] = useState<boolean>(false);
    const scrollRef = useRef<HTMLDivElement>(null)

    const handleScroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current
        if (!el) return
        const scrollAmount = el.clientWidth / 2
        if (direction === 'left') el.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
        else el.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
    const checkScroll = () => {
        if (!scrollRef.current) return
        const { scrollWidth, clientWidth, scrollLeft } = scrollRef.current
        setShowLeft(scrollLeft > 0)
        setShowRight(scrollLeft + clientWidth < scrollWidth - 1)
    }

    useEffect(() => {
        const autoscroll = setInterval((autoscroll) => {
            const el = scrollRef.current
            if (!el) return
            const { scrollWidth, clientWidth, scrollLeft } = el
            if (clientWidth >= scrollWidth - 5) {
                // nothing to scroll
                return
            }
            // if at end, scroll back to start, else advance
            if (scrollLeft + clientWidth >= scrollWidth - 5) {
                el.scrollTo({ left: 0, behavior: 'smooth' })
            } else {
                el.scrollBy({ left: 300, behavior: 'smooth' })
            }
        }, 4000)
        return () => clearInterval(autoscroll)
    }, [])

        useEffect(() => {
            const el = scrollRef.current
            if (!el) return
            // initial check
            checkScroll()
            el.addEventListener("scroll", checkScroll)
            return () => el.removeEventListener("scroll", checkScroll)
        }, [])

    return (
        <motion.div
            className='w-[90%] md:w-[80%] mx-auto mt-10 relative'
            initial={{opacity:0,y:50}}
            whileInView={{opacity:1,y:0}}
            transition={{duration:0.1}}
            viewport={{once:false,amount:0.6}}
        >
           <h2 className='text-2xl md:text-3xl font-bold text-green-700 mb-6 text-center'>🛍️ Shop by Category</h2>
           {showLeft && (
               <button onClick={() => handleScroll('left')} className='absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-green-100 rounded-full w-10 h-10 flex items-center justify-center transition-all'>
                   <ChevronLeft className='w-6 h-6 text-green-700' />
               </button>
           )}
         
           <div ref={scrollRef} className='flex gap-6 overflow-x-auto px-10 pb-4 scrollbar-hide scroll-smooth'>
               {categories.map((cat) => {
        const Icon = cat.icon
        const isActive = activeCategory === cat.name
        // clicking a tile filters the listing server-side via ?category=
        // clicking the active tile clears the filter
        const href = isActive ? '/' : `/?category=${encodeURIComponent(cat.name)}`
        return (
            <Link
                href={href}
                key={cat.id}
                aria-current={isActive ? 'true' : undefined}
                className={`min-w-[150px] md:min-w-[180px] flex flex-col items-center justify-center rounded-2xl ${cat.color} shadow-md hover:shadow-xl transition-all cursor-pointer ${isActive ? 'ring-2 ring-green-600 ring-offset-2' : ''}`}
            >
                <div className='flex flex-col items-center justify-center p-5'>
                    <Icon className='w-10 h-10 text-green-700 mb-3' />
                    <p className='text-center text-sm md:text-base font-semibold text-gray-700'>{cat.name}</p>
                </div>
            </Link>
            )
        })}
           </div>
               {showRight && (
                   <button onClick={() => handleScroll('right')} className='absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-green-100 rounded-full w-10 h-10 flex items-center justify-center transition-all'>
                       <ChevronRight className='w-6 h-6 text-green-700' />
                   </button>
               )}
            </motion.div>
        )
    }

    export default CategorySlider