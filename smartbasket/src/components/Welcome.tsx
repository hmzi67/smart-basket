"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from "motion/react"
import { ArrowRight, Bike, ShoppingBasket } from 'lucide-react'

type propType = {
  nextStep?: (s:number) => void;
}

function Welcome({ nextStep }: propType) {
  const router = useRouter()

  return (
    <div className='flex flex-col items-center justify-center min-h-screen text-center p-6 bg-linear-to-b from-green-100 to-white'>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="flex items-center gap-3"
      >
        <ShoppingBasket className="w-10 h-10 text-green-600" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-700">
          SmartBasket
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="mt-4 text-center text-lg text-gray-700"
      >
        Your one-stop solution for effortless grocery shopping.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex items-center justify-center gap-10 mt-10"
      >
        <ShoppingBasket className="w-24 h-24 md:w-32 md:h-32 text-green-600 drop-shadow-md" />
        <Bike className="w-24 h-24 md:w-32 md:h-32 text-orange-500 drop-shadow-md" />
      </motion.div>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-16 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
        onClick={() => {
          if (nextStep) {
            nextStep(2)
          } else {
            router.push('/register')
          }
        }}
        type="button"
      >
        Next <ArrowRight className="w-4 h-4 inline-block ml-1" />
      </motion.button>
    </div>
  )
}

export default Welcome

