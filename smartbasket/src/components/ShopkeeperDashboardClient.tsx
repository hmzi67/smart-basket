'use client'

import Link from 'next/link'
import { Package, AlertTriangle, EyeOff, Boxes, Plus, ArrowUpRight, Store } from 'lucide-react'

type Props = { stats: { title: string; value: number }[] }
const icons = [Boxes, Package, AlertTriangle, EyeOff]
const colors = ['bg-emerald-50 text-emerald-700', 'bg-rose-50 text-rose-700', 'bg-amber-50 text-amber-700', 'bg-slate-100 text-slate-600']
const descriptions = ['In the shared catalog', 'Ready for restocking', 'Stock is running low', 'Currently unavailable to shoppers']

export default function ShopkeeperDashboardClient({ stats }: Props) {
  return (
    <main className="min-h-screen bg-[#f6f8f7] px-4 pb-16 pt-28 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4 py-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Your catalog workspace</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Shopkeeper dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Keep the shelves stocked and the essentials within reach.</p>
          </div>
          <Link href="/admin/add-grocery" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"><Plus size={18} /> Add grocery</Link>
        </header>

        <section aria-label="Inventory statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = icons[i] ?? Boxes
            return (
              <article key={stat.title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3"><p className="text-sm font-medium text-slate-500">{stat.title}</p><span className={`rounded-xl p-2.5 ${colors[i] ?? colors[0]}`}><Icon size={20} aria-hidden="true" /></span></div>
                <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{stat.value.toLocaleString('en-PK')}</p>
                <p className="mt-2 text-xs text-slate-500">{descriptions[i]}</p>
              </article>
            )
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="relative overflow-hidden rounded-2xl bg-emerald-950 p-7 text-white sm:p-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-[40px] border-white/5" />
            <Store size={28} className="mb-7 text-emerald-300" />
            <h2 className="relative text-2xl font-semibold tracking-tight">A well-stocked store starts here.</h2>
            <p className="relative mt-3 max-w-md text-sm leading-7 text-emerald-100">Review your products, update prices, and make sure customers can find what they need.</p>
            <Link href="/admin/view-grocery" className="relative mt-7 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Manage inventory <ArrowUpRight size={18} /></Link>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Your daily checklist</h2>
            <p className="mt-1 text-sm text-slate-500">Small updates that keep your catalog ready.</p>
            <ul className="mt-6 space-y-6">
              {[
                { icon: Package, title: 'Review stock levels', text: 'Replenish sold-out items and check low stock.' },
                { icon: Boxes, title: 'Keep details current', text: 'Check product descriptions, images and prices.' },
                { icon: EyeOff, title: 'Check availability', text: 'Hide products that are not ready for sale.' },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3"><span className="h-fit rounded-lg bg-emerald-50 p-2 text-emerald-700"><Icon size={18} /></span><div><h3 className="text-sm font-semibold text-slate-800">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div></li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}
