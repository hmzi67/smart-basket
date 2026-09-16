"use client"
import React, { useEffect, useState } from 'react'
import { Leaf, Truck, Smartphone, ShoppingBasket } from 'lucide-react'
import Image from 'next/image'
import { motion,AnimatePresence } from 'motion/react'
import { getSocket } from '@/lib/socket'

function HeroSection() {
  useEffect(()=>{
    let socket=getSocket()
  },[])
  const slides = [
    {
      id: 1,
      icon: <Leaf className="w-20 h-20 sm:w-28 sm:h-28 text-green-400 drop-shadow" />,
      title: "Fresh Organic Groceries 🥦",
      subtitle: "Farm-fresh fruits, vegetables, and daily essentials delivered to your door.",
      btnText: "Shop Now",
      bg: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      id: 2,
      icon: <Truck className="w-20 h-20 sm:w-28 sm:h-28 text-yellow-400 drop-shadow" />,
      title: "Fast & Reliable Delivery 🚚",
      subtitle: "We ensure your groceries reach your doorstep in no time.",
      btnText: "Order Now",
      bg: "https://images.unsplash.com/photo-1607273685680-6bd976c5a5ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGRlbGl2ZXJ5JTIwbWFufGVufDB8fDB8fHww"
    },
    {
      id: 3,
      icon: <Smartphone className="w-20 h-20 sm:w-28 sm:h-28 text-blue-400 drop-shadow" />,
      title: "Shop Anytime, Anywhere 📱",
      subtitle: "Easy and seamless online grocery shopping experience.",
      btnText: "Get Started",
      bg: "https://images.unsplash.com/photo-1628102491629-778571d893a3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Z3JvY2VyaWVzfGVufDB8fDB8fHww"
    }
  ]

 const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className='relative w-[98%] mx-auto mt-32 h-[80vh] rounded-3xl overflow-hidden shadow-2xl'>
<AnimatePresence mode='wait'>
    <motion.div
      key={current}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      exit={{ opacity: 0 }}
      className='absolute inset-0'
    >
      <Image
        src={slides[current]?.bg} 
        fill 
        alt='slide' 
        priority 
        className="object-cover"
      />
    <div className='absolute inset-0 bg-black/50 backdrop-blur-[1px]' />
</motion.div>
</AnimatePresence>

<div className='absolute inset-0 flex items-center justify-center text-center text-white px-6'>
  <motion.div
    initial={{ y: 30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.6 }}
    className='flex flex-col items-center justify-center gap-6 max-w-3xl'
  >
    <div className='bg-white/10 backdrop-blur-md p-6 rounded-full shadow-lg'>
      {slides[current].icon}
    </div>
    <h1 className='text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg'>
      {slides[current].title}
    </h1>
    <p className='text-lg sm:text-xl text-gray-200 max-w-2xl'>{slides[current].subtitle}</p>

<motion.button
  whileHover={{ scale: 1.09 }}
  whileTap={{ scale: 0.96 }}
  transition={{ duration: 0.2 }}
  className='mt-4 bg-white text-green-700 hover:bg-green-100 px-8 py-3 rounded-full font-bold shadow-lg transition-all duration-300 flex items-center gap-2'
>
  <ShoppingBasket className='w-5 h-5' />
  {slides[current].btnText}
</motion.button>
  </motion.div>
</div>

<div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3'>
  {slides.map((_, index) => (
    <button
      key={index}
      onClick={() => setCurrent(index)}
      className={`w-3 h-3 rounded-full transition-all ${
        index === current ? "bg-white w-6" : "bg-white/50"
      }`}
    />
  ))}
</div>

    </div>
  
  )
}

export default HeroSection