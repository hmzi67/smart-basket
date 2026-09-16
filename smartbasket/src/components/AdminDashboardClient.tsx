'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, Boxes, CalendarDays, ClipboardCheck, Package, Truck, Users, Wallet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type Props = {
  earning: { today: number; sevenDays: number; total: number }
  stats: { title: string; value: number }[]
  chartData: { day: string; orders: number }[]
}

const periods = [
  { value: 'today', label: 'Today' },
  { value: 'sevenDays', label: '7 days' },
  { value: 'total', label: 'All time' },
] as const
const number = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 })
const icons = [Package, Users, Truck, Wallet]
const colors = ['bg-emerald-50 text-emerald-700', 'bg-blue-50 text-blue-700', 'bg-amber-50 text-amber-700', 'bg-violet-50 text-violet-700']
const actions = [
  { href: '/admin/manage-orders', title: 'Manage orders', detail: 'Review purchases and delivery progress', icon: ClipboardCheck },
  { href: '/admin/view-grocery', title: 'Browse inventory', detail: 'Check products, prices and availability', icon: Boxes },
  { href: '/admin/users', title: 'Manage people', detail: 'Create, edit and manage user accounts', icon: Users },
]

export default function AdminDashboardClient({ earning, stats, chartData }: Props) {
  const [period, setPeriod] = useState<keyof Props['earning']>('sevenDays')
  const weekOrders = chartData.reduce((total, day) => total + day.orders, 0)

  return (
    <main className="min-h-screen bg-[#f6f8f7] px-4 pb-16 pt-28 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4 py-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Store overview</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Admin dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">A little clarity for your everyday operations.</p>
          </div>
          <Link href="/admin/manage-orders" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">
            View orders <ArrowUpRight size={17} />
          </Link>
        </header>

        <section aria-label="Store statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = icons[i] ?? Package
            return (
              <article key={stat.title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <span className={`rounded-xl p-2.5 ${colors[i] ?? colors[0]}`}><Icon size={20} aria-hidden="true" /></span>
                </div>
                <p className="break-words text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {stat.title === 'Total Revenue' && <span className="mr-1 text-base font-medium text-slate-500">Rs.</span>}
                  {number.format(stat.value)}
                </p>
                <p className="mt-2 text-xs text-slate-500">{stat.title === 'Pending Deliveries' ? 'Awaiting the next step' : 'Across your store'}</p>
              </article>
            )
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Orders overview</h2>
                <p className="mt-1 text-sm text-slate-500">{number.format(weekOrders)} orders over the last 7 days</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"><CalendarDays size={14} /> Last 7 days</span>
            </div>
            {weekOrders > 0 ? (
              <div className="mt-8 h-64 w-full sm:h-72" role="img" aria-label={`Daily orders: ${chartData.map(day => `${day.day}: ${day.orders}`).join(', ')}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 0, left: -24, bottom: 0 }} barSize={28}>
                    <CartesianGrid stroke="#eef2f1" vertical={false} strokeDasharray="4 4" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={8} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f0fdf4', radius: 8 }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Bar dataKey="orders" name="Orders" fill="#059669" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-8 flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center sm:h-72">
                <Package className="mb-3 text-emerald-600" size={30} />
                <p className="font-semibold text-slate-700">A fresh start this week</p>
                <p className="mt-1 px-4 text-sm text-slate-500">New orders will appear here as they come in.</p>
              </div>
            )}
          </section>

          <section className="relative flex flex-col overflow-hidden rounded-2xl bg-emerald-950 p-6 text-white shadow-sm sm:p-7">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border-[35px] border-white/5" />
            <div className="relative flex items-center gap-3">
              <span className="rounded-xl bg-white/10 p-2.5"><Wallet size={20} /></span>
              <h2 className="font-semibold">Revenue summary</h2>
            </div>
            <div className="relative mt-7 flex gap-1 rounded-xl bg-black/15 p-1" aria-label="Revenue period">
              {periods.map(option => (
                <button key={option.value} type="button" aria-pressed={period === option.value} onClick={() => setPeriod(option.value)} className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${period === option.value ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'}`}>
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-8 text-sm text-emerald-200">{period === 'today' ? "Today's revenue" : period === 'sevenDays' ? 'Revenue in the last 7 days' : 'Total revenue'}</p>
            <p className="mt-2 break-words text-4xl font-semibold tracking-tight tabular-nums"><span className="mr-2 text-lg text-emerald-200">Rs.</span>{number.format(earning[period])}</p>
            <div className="mt-8 flex items-start gap-3 border-t border-white/15 pt-5 text-xs leading-5 text-emerald-100 lg:mt-auto">
              <ArrowDownLeft size={18} className="mt-0.5 shrink-0" />
              <p>Based on order totals for the selected period.</p>
            </div>
          </section>
        </div>

        <section aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Keep things moving</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {actions.map(({ href, title, detail, icon: Icon }) => (
              <Link key={href} href={href} className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">
                <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Icon size={21} /></span>
                <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>
                <ArrowUpRight size={17} className="shrink-0 text-slate-400 transition group-hover:text-emerald-700" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
