'use client'

import { motion } from 'motion/react'
import { ArrowRight, CheckCircle, Package } from 'lucide-react'
import Link from 'next/link'

export default function OrderSuccess() {
  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-linear-to-b from-green-50 to-white px-6 text-center">
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10, stiffness: 100 }} className="relative">
        <CheckCircle className="h-24 w-24 text-green-600 md:h-28 md:w-28" />
        <motion.div className="absolute inset-0" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: [0.3, 0, 0.3], scale: [1, 0.6, 1] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
          <div className="h-full w-full rounded-full bg-green-700 blur-2xl" />
        </motion.div>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="mt-6 text-3xl font-bold text-green-700 md:text-4xl">
        Order Placed Successfully!
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }} className="mt-6 max-w-md text-sm text-gray-600 md:text-base">
        Thank you for shopping with us! Your order has been placed and is being processed. You can track its progress in your <span className="font-semibold text-green-700">My Orders</span> section.
      </motion.p>

      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ opacity: 1, y: [0, -10, 0] }} transition={{ delay: 1, duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="mt-10">
        <Package className="h-16 w-16 text-green-500 md:h-20 md:w-20" />
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, duration: 0.4 }} className="mt-12">
        <Link href="/user/my-orders">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.93 }} className="flex items-center gap-2 rounded-full bg-green-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-green-700">
            Go to My Orders <ArrowRight />
          </motion.div>
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ delay: 1, duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="pointer-events-none absolute left-0 top-0 h-full w-full">
        <div className="absolute left-[10%] top-20 h-2 w-2 animate-bounce rounded-full bg-green-400" />
        <div className="absolute left-[30%] top-32 h-2 w-2 animate-pulse rounded-full bg-green-400" />
        <div className="absolute left-[50%] top-24 h-2 w-2 animate-bounce rounded-full bg-green-400" />
        <div className="absolute left-[70%] top-16 h-2 w-2 animate-pulse rounded bg-green-400" />
      </motion.div>
    </div>
  )
}
