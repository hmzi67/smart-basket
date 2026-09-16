'use client'
import AdminOrderCard from '@/components/AdminOrderCard'
import axios from 'axios'
import { ArrowLeft, Loader2, PackageSearch, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { getSocket } from '@/lib/socket'
import { IUser } from '@/models/user.model'


interface IOrder {
    _id?: string
    user: string
    items: Array<{
        grocery: string,
        name: string,
        price: string,
        unit: string,
        image: string,
        quantity: number
    }>
    isPaid?: boolean
    totalAmount?: string,
    paymentMethod: "cod" | "online"

    address: {
        fullName: string,
        mobile: string,
        city: string,
        state: string,
        pincode: string,
        fullAddress: string,
        latitude?: number,
        longitude?: number
    }
    assignment?: string
    assignedDeliveryBoy?: IUser;
    status: "pending" | "out of delivery" | "delivered",
    createdAt?: string | Date
    updatedAt?: string | Date
}

const STATUS_TABS = [
    { value: "all", label: "All orders" },
    { value: "pending", label: "Pending" },
    { value: "out of delivery", label: "Out for delivery" },
    { value: "delivered", label: "Delivered" },
] as const

function ManageOrders() {
    const router = useRouter()
    const [orders, setOrders] = useState<IOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<typeof STATUS_TABS[number]["value"]>("all")

    useEffect(() => {
        const getOrders = async () => {
            try {
                const result = await axios.get('/api/admin/get-orders')
                setOrders(result.data)
            } catch (error) {
                console.log(error)
                setError("Could not load orders. Please try again.")
            } finally {
                setLoading(false)
            }
        }

        getOrders()
    }, [])

useEffect(()=>{
  const socket=getSocket()
  socket.on("new-order",(newOrder)=>{
    setOrders((prev)=>[newOrder, ...prev])
  })

  socket.on("order-assigned",({orderId,assignedDeliveryBoy})=>{
    setOrders((prev)=>prev?.map((o)=>o._id==orderId?{...o,assignedDeliveryBoy}:o))
})

  socket.on("order-status-update",({orderId,status})=>{
    setOrders((prev)=>prev?.map((o)=>o._id==orderId?{...o,status}:o))
  })

  return ()=>{
    socket.off("new-order")
    socket.off("order-assigned")
    socket.off("order-status-update")
}
},[])

    const counts = useMemo(() => ({
        all: orders.length,
        pending: orders.filter(o => o.status === "pending").length,
        "out of delivery": orders.filter(o => o.status === "out of delivery").length,
        delivered: orders.filter(o => o.status === "delivered").length,
    }), [orders])

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        return orders.filter(order => {
            if (statusFilter !== "all" && order.status !== statusFilter) return false
            if (!query) return true
            return [
                order._id,
                order.address?.fullName,
                order.address?.mobile,
                order.assignedDeliveryBoy?.name,
            ].some(field => field?.toString().toLowerCase().includes(query))
        })
    }, [orders, search, statusFilter])

    return (
        <main className="min-h-screen bg-[#f6f8f7] px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-6xl">
                <button
                    onClick={() => router.push('/')}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                    <ArrowLeft size={17} /> Dashboard
                </button>

                <header className="mb-7">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-700">Order desk</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manage orders</h1>
                    <p className="mt-2 text-sm text-slate-500">Track incoming orders, dispatch riders, and follow every delivery in real time.</p>
                </header>

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={`rounded-2xl border px-4 py-3 text-left transition ${
                                statusFilter === tab.value
                                    ? "border-emerald-600 bg-emerald-700 text-white shadow-sm"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                            }`}
                        >
                            <p className={`text-2xl font-bold ${statusFilter === tab.value ? "text-white" : "text-slate-900"}`}>
                                {counts[tab.value]}
                            </p>
                            <p className={`mt-0.5 text-xs font-medium ${statusFilter === tab.value ? "text-emerald-50" : "text-slate-500"}`}>
                                {tab.label}
                            </p>
                        </button>
                    ))}
                </div>

                <label className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <Search size={18} className="text-slate-400" />
                    <input
                        aria-label="Search orders"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by order id, customer name, phone, or rider"
                        className="min-w-0 flex-1 text-sm outline-none"
                    />
                    <span className="whitespace-nowrap text-xs text-slate-500">{filtered.length} order{filtered.length === 1 ? "" : "s"}</span>
                </label>

                {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

                {loading ? (
                    <p role="status" className="flex items-center justify-center gap-2 py-16 text-slate-500">
                        <Loader2 className="animate-spin" size={20} /> Loading orders…
                    </p>
                ) : !filtered.length ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
                        <PackageSearch className="text-slate-300" size={36} />
                        <p className="text-sm text-slate-500">
                            {orders.length === 0 ? "No orders found." : "No orders match your search or filter."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {filtered.map((order, index) => (
                            <AdminOrderCard key={order._id ?? index} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
export default ManageOrders
