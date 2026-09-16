'use client'

import Link from 'next/link'
import { AlertTriangle, Boxes, EyeOff, Package, Plus, Store } from 'lucide-react'
import { motion } from 'motion/react'

type Props = { stats: { title: string; value: number }[] }

const icons = [Boxes, Package, AlertTriangle, EyeOff]

export default function ShopkeeperDashboardClient({ stats }: Props) {
  return (
    <div className="pt-28 w-[90%] md:w-[80%] mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 text-center sm:text-left">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-bold text-green-700">
          Shopkeeper Dashboard
        </motion.h1>
        <Link href="/admin/add-grocery" className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-full font-semibold hover:bg-green-700 transition-all shadow-md shadow-green-200">
          <Plus size={18} /> Add Grocery
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => {
          const Icon = icons[i] ?? Boxes
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }} className="bg-white border border-gray-100 rounded-2xl shadow-md p-5 flex gap-4 items-center hover:shadow-lg transition-all">
              <div className="bg-green-200 p-3 rounded-xl mb-2"><Icon className="text-green-700 w-6 h-6" /></div>
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-green-800">{stat.value.toLocaleString('en-PK')}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-green-500 to-green-700 p-8 text-white shadow-xl">
          <Store size={34} className="mb-6 text-white" />
          <h2 className="text-2xl font-extrabold">Manage your grocery shelf</h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-green-50">
            Add groceries, update prices, manage stock, and decide which products are visible in the store.
          </p>
          <Link href="/admin/view-grocery" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-green-700 hover:bg-green-100 transition-all">
            View Grocery
          </Link>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl shadow-md p-5 h-fit">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Today&apos;s Checklist</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="rounded-xl bg-green-50 p-3">Check low stock products.</p>
            <p className="rounded-xl bg-green-50 p-3">Update unavailable grocery items.</p>
            <p className="rounded-xl bg-green-50 p-3">Review prices before customers order.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
