'use client'
import axios from 'axios'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PackageSearch, Search } from 'lucide-react'
import UserOrderCard from '@/components/UserOrderCard'
import CustomerPageHeader from '@/components/CustomerPageHeader'
import { getSocket } from '@/lib/socket'
import type { CustomerOrder, OrderStatus } from '@/types/customer-order'

type Filter = 'all' | 'active' | 'delivered' | 'cancelled'
const filters: { value: Filter; label: string }[] = [{ value: 'all', label: 'All orders' }, { value: 'active', label: 'In progress' }, { value: 'delivered', label: 'Delivered' }, { value: 'cancelled', label: 'Cancelled' }]
export default function MyOrders() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const { data } = await axios.get('/api/user/my-orders', { signal: controller.signal })
        setOrders(data.map((order: CustomerOrder) => ({ ...order, _id: String(order._id) })))
      } catch (err) { if (!axios.isCancel(err)) setError('We couldn’t load your orders. Please try again.') }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [retry])
  useEffect(() => {
    const socket = getSocket()
    const assigned = ({ orderId, assignedDeliveryBoy }: { orderId: string; assignedDeliveryBoy: CustomerOrder['assignedDeliveryBoy'] }) => setOrders(current => current.map(order => order._id === String(orderId) ? { ...order, assignedDeliveryBoy } : order))
    const updated = ({ orderId, status }: { orderId: string; status: OrderStatus }) => setOrders(current => current.map(order => order._id === String(orderId) ? { ...order, status } : order))
    socket.on('order-assigned', assigned); socket.on('order-status-update', updated)
    return () => { socket.off('order-assigned', assigned); socket.off('order-status-update', updated) }
  }, [])
  const active = orders.filter(order => order.status === 'pending' || order.status === 'out of delivery').length
  const delivered = orders.filter(order => order.status === 'delivered').length
  const counts = { all: orders.length, active, delivered, cancelled: orders.filter(order => order.status === 'cancelled').length }
  const visible = orders.filter(order => (filter === 'all' || (filter === 'active' ? ['pending', 'out of delivery'].includes(order.status) : order.status === filter)) && `${order._id} ${order.items.map(item => item.name).join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()))
  return <main className="min-h-screen bg-linear-to-b from-white to-gray-100 pb-16">
    <CustomerPageHeader title="My Orders" subtitle="" />
    <div className="mx-auto max-w-6xl space-y-6 px-4 pt-7 sm:px-6">
      <details className="rounded-xl border border-gray-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-medium text-green-700">Search and filter orders ({orders.length})</summary>
      <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row"><div aria-label="Filter orders" className="flex flex-wrap gap-2">{filters.map(item => <button key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${filter === item.value ? 'border-green-600 bg-green-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-green-50 hover:text-green-700'}`}>{item.label} <span className="ml-1 opacity-70">{loading ? '-' : counts[item.value]}</span></button>)}</div><label className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 shadow-sm"><Search size={17} className="text-gray-400" /><input aria-label="Search orders" placeholder="Search product or order number" value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 text-sm outline-none lg:w-60" /></label></div>
      </details>
      {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-md"><p className="text-sm text-red-700">{error}</p><button onClick={() => { setError(''); setLoading(true); setRetry(value => value + 1) }} className="mt-4 rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white">Try again</button></div> : loading ? <div role="status" aria-label="Loading orders" className="space-y-4">{[0, 1].map(key => <div key={key} className="h-64 animate-pulse rounded-2xl bg-white shadow-md motion-reduce:animate-none" />)}</div> : !visible.length ? <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-md"><PackageSearch size={40} className="mx-auto text-green-600" /><h2 className="mt-4 text-lg font-semibold text-gray-800">{orders.length ? 'No matching orders' : 'Your first basket is waiting'}</h2><p className="mt-2 text-sm text-gray-500">{orders.length ? 'Try another filter or search for a different product.' : 'Once you place an order, you can follow its progress here.'}</p>{orders.length ? <button onClick={() => { setSearch(''); setFilter('all') }} className="mt-5 text-sm font-semibold text-green-700">Clear filters</button> : <Link href="/" className="mt-5 inline-block rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white">Start shopping</Link>}</div> : <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map(order => <UserOrderCard key={order._id} order={order} onStatusChange={status => setOrders(current => current.map(item => item._id === order._id ? { ...item, status } : item))} />)}</div>}
    </div>
  </main>
}
