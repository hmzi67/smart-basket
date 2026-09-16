'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, MapPin, Package, RefreshCw, Truck, Wallet } from 'lucide-react'
import CustomerPageHeader from '@/components/CustomerPageHeader'
import { getSocket } from '@/lib/socket'

type Delivery = { _id: string; status: 'pending' | 'out of delivery' | 'delivered' | 'cancelled'; items: { name: string; quantity: number; unit: string }[]; address: { fullName: string; fullAddress: string }; totalAmount: string; paymentMethod: string; createdAt: string; deliveredAt?: string; earning: number }
type Result = { deliveries: Delivery[]; total: number; hasMore: boolean; summary: { completed: number; active: number; todayCompleted: number; todayEarnings: number; totalEarnings: number } }
const labels = { pending: 'Assigned', 'out of delivery': 'In progress', delivered: 'Delivered', cancelled: 'Cancelled' }
const date = (value?: string) => value ? new Date(value).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Karachi' }) : '—'
export default function MyDeliveries() {
  const [result, setResult] = useState<Result | null>(null)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const { data } = await axios.get('/api/delivery/my-deliveries', { params: { status, page }, signal: controller.signal })
        setResult(data); setError('')
      } catch (err) { if (!axios.isCancel(err)) setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Could not load deliveries.' : 'Could not load deliveries.') }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [status, page, revision])
  useEffect(() => {
    const socket = getSocket()
    const refresh = () => setRevision(value => value + 1)
    socket.on('order-status-update', refresh)
    return () => { socket.off('order-status-update', refresh) }
  }, [])
  function refresh() { setLoading(true); setRevision(value => value + 1) }
  return <main className="min-h-screen bg-[#f6f8f7] pb-16"><CustomerPageHeader title="My deliveries" subtitle="Your completed stops, current deliveries, and earnings." backLabel="Back to delivery dashboard" /><div className="mx-auto max-w-6xl space-y-6 px-4 pt-7 sm:px-6">
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-950 p-6 text-white sm:p-8"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Delivery history</p><h2 className="mt-3 text-2xl font-semibold">Every delivery counts.</h2><p className="mt-2 text-sm text-emerald-100">Review your stops and the earnings from completed handoffs.</p></div><Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-950">Delivery dashboard <ArrowUpRight size={17} /></Link></section>
    <section aria-label="Delivery statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ label: 'Completed deliveries', value: result?.summary.completed, icon: CheckCircle2 }, { label: 'Active deliveries', value: result?.summary.active, icon: Truck }, { label: 'Earned today', value: result ? `Rs. ${result.summary.todayEarnings.toLocaleString('en-PK')}` : undefined, icon: Wallet }, { label: 'Total earned', value: result ? `Rs. ${result.summary.totalEarnings.toLocaleString('en-PK')}` : undefined, icon: Wallet }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon size={20} className="mb-4 text-emerald-700" /><p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</section>
    <div className="flex flex-wrap items-center justify-between gap-3"><div aria-label="Delivery filters" className="flex flex-wrap gap-2">{[{ value: 'all', label: 'All deliveries' }, { value: 'active', label: 'In progress' }, { value: 'delivered', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }].map(filter => <button key={filter.value} aria-pressed={status === filter.value} onClick={() => { setStatus(filter.value); setPage(1); if (status !== filter.value) setLoading(true) }} className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${status === filter.value ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{filter.label}</button>)}</div><button disabled={loading} onClick={refresh} className="inline-flex items-center gap-2 text-sm text-emerald-700 disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button></div>
    {error ? <div role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-700">{error}<button onClick={refresh} className="ml-3 underline">Try again</button></div> : loading ? <div role="status" className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"><p className="p-6 text-sm text-slate-500">Loading deliveries…</p></div> : !result?.deliveries.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><Package size={38} className="mx-auto text-emerald-600" /><h2 className="mt-4 font-semibold text-slate-800">No deliveries here yet</h2><p className="mt-2 text-sm text-slate-500">Accepted deliveries will appear here. Try another filter or check your dashboard for offers.</p></div> : <div className="space-y-4">{result.deliveries.map(delivery => <article key={delivery._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">Order #{delivery._id.slice(-6)}</h2><p className="mt-1 text-xs text-slate-500">{delivery.status === 'delivered' ? `Delivered ${date(delivery.deliveredAt)}` : `Ordered ${date(delivery.createdAt)}`}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${delivery.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : delivery.status === 'cancelled' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}>{labels[delivery.status]}</span></header><div className="space-y-4 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex max-w-lg items-start gap-2"><MapPin size={18} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-sm font-semibold text-slate-800">{delivery.address.fullName}</p><p className="mt-1 text-sm leading-6 text-slate-500">{delivery.address.fullAddress}</p></div></div><div className="text-right"><p className="text-xs text-slate-500">Your earnings</p><p className="mt-1 text-lg font-bold text-emerald-700">Rs. {delivery.earning}</p></div></div><details className="border-t border-slate-100 pt-3"><summary className="cursor-pointer text-sm font-semibold text-slate-600">View {delivery.items.length} products · Order total Rs. {Number(delivery.totalAmount).toLocaleString('en-PK')}</summary><ul className="mt-3 divide-y divide-slate-100">{delivery.items.map((item, index) => <li key={index} className="flex justify-between gap-3 py-2 text-sm text-slate-600"><span>{item.name}</span><span>{item.quantity} × {item.unit}</span></li>)}</ul></details>{['pending', 'out of delivery'].includes(delivery.status) && <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">Open active delivery <ArrowUpRight size={16} /></Link>}</div></article>)}</div>}
    {result && !loading && <footer className="flex items-center justify-between text-sm text-slate-500"><span>{result.total} deliveries · Page {page}</span><div className="flex gap-4"><button disabled={page === 1} onClick={() => { setPage(value => value - 1); setLoading(true) }} className="disabled:opacity-30">Previous</button><button disabled={!result.hasMore} onClick={() => { setPage(value => value + 1); setLoading(true) }} className="disabled:opacity-30">Next</button></div></footer>}
  </div></main>
}
