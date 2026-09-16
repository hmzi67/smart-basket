'use client'

import { TbCurrencyRupee as PKR } from 'react-icons/tb'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Boxes, ClipboardCheck, Package, PlusCircle, Truck, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

type Props = {
  earning: { today: number; sevenDays: number; total: number }
  stats: { title: string; value: number }[]
  chartData: { day: string; orders: number }[]
}

const quickActions = [
  { href: '/admin/view-grocery', title: 'View Grocery', icon: Boxes },
  { href: '/admin/manage-orders', title: 'Manage Orders', icon: ClipboardCheck },
  { href: '/admin/users', title: 'Users', icon: Users },
]

export default function AdminDashboardClient({ earning, stats, chartData }: Props) {
  const [filter, setFilter] = useState<'today' | 'sevenDays' | 'total'>('sevenDays')
  const currentEarning = filter === 'today' ? earning.today : filter === 'sevenDays' ? earning.sevenDays : earning.total
  const title = filter === 'today' ? "Today's Earning" : filter === 'sevenDays' ? 'Last 7 Days Earning' : 'Total Earning'
  const icons = [
    <Package key="p" className="text-green-700 w-6 h-6" />,
    <Users key="u" className="text-green-700 w-6 h-6" />,
    <Truck key="t" className="text-green-700 w-6 h-6" />,
    <PKR key="r" className="text-green-700 w-6 h-6" />,
  ]

  return (
    <div className="pt-36 w-[90%] md:w-[80%] mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 text-center sm:text-left">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-bold text-green-700">
          Admin Dashboard
        </motion.h1>
        <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none transition w-full sm:w-auto bg-white" onChange={(e) => setFilter(e.target.value as typeof filter)} value={filter}>
          <option value="sevenDays">Last 7 Days</option>
          <option value="today">Today</option>
          <option value="total">Total</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-green-50 border border-green-200 shadow-sm rounded-2xl p-6 text-center mb-10">
        <h2 className="text-lg font-semibold text-green-700 mb-2">{title}</h2>
        <p className="text-4xl font-extrabold text-green-800">Rs. {currentEarning.toLocaleString('en-PK')}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }} className="bg-white border border-gray-100 rounded-2xl shadow-md p-5 flex gap-4 items-center hover:shadow-lg transition-all">
            <div className="bg-green-200 p-3 rounded-xl mb-2">{icons[i]}</div>
            <div>
              <p className="text-sm text-gray-600">{s.title}</p>
              <p className="text-2xl font-bold text-green-800">{s.title === 'Total Revenue' ? `Rs. ${s.value.toLocaleString('en-PK')}` : s.value.toLocaleString('en-PK')}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-5 mb-10">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Orders Overview (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="day" />
              <Tooltip />
              <Bar dataKey="orders" fill="#16A34A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-5 h-fit">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map(({ href, title: actionTitle, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center justify-between gap-3 rounded-xl bg-green-50 px-4 py-3 font-semibold text-green-700 hover:bg-green-100 transition-all">
                <span className="flex items-center gap-3"><Icon size={18} /> {actionTitle}</span>
                <PlusCircle size={16} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
