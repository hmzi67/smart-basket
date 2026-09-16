'use client'
import { useId, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import axios from 'axios'
import { ChevronDown, CreditCard, MapPin, Package, Phone, Truck, XCircle } from 'lucide-react'
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
  return <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md hover:shadow-xl transition-all">
    <header className="space-y-2 px-5 pt-5">
      <h2 className="font-semibold text-gray-800">Order <span className="text-green-700">#{order._id.slice(-6)}</span></h2>
      <p className="text-xs text-gray-500">Placed on {dateLabel}</p>
      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
    </header>
    <div className="space-y-4 p-5">
      {order.status === 'cancelled' && <p className="flex items-center gap-2 text-xs text-gray-600"><XCircle size={16} /> This order was cancelled.</p>}
      <div className="space-y-3 text-sm text-gray-600">
        <p className="flex items-center gap-2"><CreditCard size={16} className="shrink-0 text-green-600" />{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online payment'} <span className="text-xs text-gray-400">· {order.isPaid ? 'Paid' : order.status === 'cancelled' ? 'Cancelled' : 'Unpaid'}</span></p>
        <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-green-600" /><span title={order.address.fullAddress} className="truncate">{order.address.fullAddress}</span></p>
      </div>
      {order.assignedDeliveryBoy && order.status !== 'cancelled' && order.status !== 'delivered' && <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Truck size={18} className="text-green-700" /><p className="text-sm text-gray-500">Your rider <span className="font-semibold text-gray-800">{order.assignedDeliveryBoy.name}</span></p></div>{order.assignedDeliveryBoy.mobile && <a href={`tel:${order.assignedDeliveryBoy.mobile}`} className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700"><Phone size={14} /> Call</a>}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4"><button aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(value => !value)} className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"><Package size={15} />{expanded ? 'Hide items' : `View ${order.items.length} item${order.items.length === 1 ? '' : 's'}`}<ChevronDown size={16} className={`transition ${expanded ? 'rotate-180' : ''}`} /></button><div className="flex flex-wrap gap-2">{order.status === 'pending' && <button onClick={() => { setError(''); setConfirmCancel(true) }} className="rounded-full bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-100">Cancel order</button>}{order.assignedDeliveryBoy && order.status !== 'cancelled' && order.status !== 'delivered' && <Link href={`/user/track-order/${order._id}`} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-700"><Truck size={16} /> Track Order</Link>}</div></div>
      <div id={detailsId} hidden={!expanded}><ul className="divide-y divide-gray-100">{order.items.map((item, index) => <li key={`${item.grocery}-${index}`} className="flex items-center gap-3 py-3"><div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">{item.image && <Image src={item.image} alt={item.name} fill sizes="48px" className="object-contain p-1" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-800">{item.name}</p><p className="mt-1 text-xs text-gray-500">{item.quantity} × Rs. {money(item.price)} / {item.unit}</p></div><p className="text-sm font-semibold text-gray-700">Rs. {money(Number(item.price) * item.quantity)}</p></li>)}</ul></div>
    </div>
    <footer className="mx-5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 py-3 text-xs text-gray-600"><span className="flex items-center gap-1.5"><Truck size={15} className="text-green-600" /> Delivery: {order.status}</span><span>Total: <strong className="text-green-700">Rs. {money(order.totalAmount)}</strong></span></footer>
    {confirmCancel && <ManagementDialog title="Cancel this order?" busy={busy} onClose={() => setConfirmCancel(false)}><p className="text-sm leading-6 text-slate-600">Your order can be cancelled while it is still being prepared. Once dispatched, it cannot be cancelled.</p>{error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={() => setConfirmCancel(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">Keep order</button><button disabled={busy} onClick={cancel} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Cancelling…' : 'Cancel order'}</button></div></ManagementDialog>}
  </article>
}
