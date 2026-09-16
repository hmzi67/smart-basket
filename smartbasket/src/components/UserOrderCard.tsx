'use client'
import { useId, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import axios from 'axios'
import { Check, ChevronDown, CreditCard, MapPin, Package, Phone, Truck, XCircle } from 'lucide-react'
import ManagementDialog from './ManagementDialog'
import type { CustomerOrder, OrderStatus } from '@/types/customer-order'

const statuses = {
  pending: { label: 'Preparing', color: 'border-amber-200 bg-amber-50 text-amber-800' },
  'out of delivery': { label: 'On the way', color: 'border-blue-200 bg-blue-50 text-blue-700' },
  delivered: { label: 'Delivered', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'border-slate-200 bg-slate-100 text-slate-600' },
}
const money = (amount: string | number = 0) => Number(amount).toLocaleString('en-PK', { maximumFractionDigits: 2 })
export default function UserOrderCard({ order, onStatusChange }: { order: CustomerOrder; onStatusChange: (status: OrderStatus) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const detailsId = useId()
  const status = statuses[order.status]
  const step = order.status === 'delivered' ? 2 : order.status === 'out of delivery' ? 1 : 0
  const date = order.createdAt ? new Date(order.createdAt) : null
  const dateLabel = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable'
  async function cancel() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const { data } = await axios.post(`/api/user/order/${order._id}/cancel`)
      onStatusChange(data.status); setConfirmCancel(false)
    } catch (err) { setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Could not cancel your order.' : 'Could not cancel your order.') }
    finally { setBusy(false) }
  }
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><Package size={21} /></span><div><h2 className="font-semibold text-slate-900">Order #{order._id.slice(-6)}</h2><p className="mt-1 text-xs text-slate-500">{dateLabel} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p></div></div><span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${status.color}`}>{status.label}</span></header>
    <div className="space-y-5 p-5 sm:p-6">
      {order.status !== 'cancelled' ? <ol aria-label="Delivery progress" className="grid grid-cols-3 gap-2">{['Preparing', 'On the way', 'Delivered'].map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined} className={`flex flex-col gap-2 text-xs font-medium ${index <= step ? 'text-emerald-700' : 'text-slate-400'}`}><div className={`h-1 rounded-full ${index <= step ? 'bg-emerald-600' : 'bg-slate-100'}`} /><span className="flex items-center gap-1">{index < step && <Check size={13} />}{label}</span></li>)}</ol> : <p className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><XCircle size={16} /> This order was cancelled.</p>}
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex -space-x-2">{order.items.slice(0, 4).map((item, index) => <div key={`${item.grocery}-${index}`} className="relative h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-slate-50">{item.image && <Image src={item.image} alt={item.name} fill sizes="56px" className="object-contain p-1" />}</div>)}{order.items.length > 4 && <span className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-slate-100 text-xs font-semibold text-slate-500">+{order.items.length - 4}</span>}</div><div className="text-right"><p className="text-xs text-slate-500">Order total</p><p className="mt-1 text-xl font-bold tracking-tight text-slate-900">Rs. {money(order.totalAmount)}</p></div></div>
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><div className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold text-slate-700">{order.address.fullName}</p><p className="mt-1 text-xs leading-5 text-slate-500">{order.address.fullAddress}</p></div></div><div className="flex items-start gap-2"><CreditCard size={16} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold text-slate-700">{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online payment'}</p><p className="mt-1 text-xs text-slate-500">{order.isPaid ? 'Paid' : order.status === 'cancelled' ? 'Order cancelled' : order.paymentMethod === 'cod' ? 'Payment collected on delivery' : 'Payment pending'}</p></div></div></div>
      {order.assignedDeliveryBoy && order.status !== 'cancelled' && order.status !== 'delivered' && <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Truck size={18} className="text-emerald-700" /><p className="text-sm text-slate-500">Your rider <span className="font-semibold text-slate-800">{order.assignedDeliveryBoy.name}</span></p></div>{order.assignedDeliveryBoy.mobile && <a href={`tel:${order.assignedDeliveryBoy.mobile}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-emerald-700"><Phone size={14} /> Call</a>}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><button aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(value => !value)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700">{expanded ? 'Hide details' : 'View items'}<ChevronDown size={16} className={`transition ${expanded ? 'rotate-180' : ''}`} /></button><div className="flex flex-wrap gap-2">{order.status === 'pending' && <button onClick={() => { setError(''); setConfirmCancel(true) }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-500 hover:border-red-200 hover:text-red-600">Cancel order</button>}{order.assignedDeliveryBoy && order.status !== 'cancelled' && order.status !== 'delivered' && <Link href={`/user/track-order/${order._id}`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800"><Truck size={16} /> Track delivery</Link>}</div></div>
      <div id={detailsId} hidden={!expanded}><ul className="divide-y divide-slate-100">{order.items.map((item, index) => <li key={`${item.grocery}-${index}`} className="flex items-center gap-3 py-3"><div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-50">{item.image && <Image src={item.image} alt={item.name} fill sizes="48px" className="object-contain p-1" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.quantity} × Rs. {money(item.price)} / {item.unit}</p></div><p className="text-sm font-semibold text-slate-700">Rs. {money(Number(item.price) * item.quantity)}</p></li>)}</ul></div>
    </div>
    {confirmCancel && <ManagementDialog title="Cancel this order?" busy={busy} onClose={() => setConfirmCancel(false)}><p className="text-sm leading-6 text-slate-600">Your order can be cancelled while it is still being prepared. Once dispatched, it cannot be cancelled.</p>{error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={() => setConfirmCancel(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">Keep order</button><button disabled={busy} onClick={cancel} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Cancelling…' : 'Cancel order'}</button></div></ManagementDialog>}
  </article>
}
