'use client'
import React, { useState } from 'react'
import { motion } from 'motion/react'
// local IOrder defined below; avoid importing server-side types
import { ChevronDown, ChevronUp, CreditCard, MapPin, Package, Phone, Truck, User, UserCheck } from 'lucide-react'
import Image from 'next/image'
import { IUser } from '@/models/user.model'
import axios from 'axios'

// Use plain strings for IDs in the client to avoid referencing mongoose server-side types
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

const STATUS_STYLES: Record<string, string> = {
    delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pending: "bg-amber-50 text-amber-800 border border-amber-200",
    "out of delivery": "bg-sky-50 text-sky-700 border border-sky-200",
}

function AdminOrderCard({ order }: { order: IOrder }) {
    const statusOption = ["pending", "out of delivery"]
    const [status, setStatus] = useState<string>(order.status)
    const [syncedStatus, setSyncedStatus] = useState<string>(order.status)
    const [expanded, setExpanded] = useState<boolean>(false)
    const [updating, setUpdating] = useState<boolean>(false)

    // Keep local status in sync when the order prop changes, without an effect.
    if (order.status !== syncedStatus) {
        setSyncedStatus(order.status)
        setStatus(order.status)
    }
    // some IOrder typings may not include isPaid; derive safely
    const isPaid: boolean = Boolean((order as any).isPaid ?? false)
    const updateStatus = async (orderId: string, status: string) => {
        setUpdating(true)
        try {
            const result = await axios.post(`/api/admin/update-order-status/${orderId}`, { status })
            setStatus(status)
            if (result.data?.message === "there is no available Delivery boys") {
                alert("Status updated, but no delivery boy is available within 10 km right now.")
            }
        } catch (error: any) {
            console.error(error)
            alert(error?.response?.data?.message || "Could not update order status")
        } finally {
            setUpdating(false)
        }
    }

    const totalAmount = order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition hover:shadow-lg"
        >
            <div className="flex flex-col gap-4 p-5">
                <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="flex items-center gap-2 text-base font-bold text-green-700">
                            <Package size={18} className="text-emerald-700" />
                            Order #{order._id?.toString().slice(-6)}
                        </p>
                        {status !== "delivered" && (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${order.isPaid
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-red-200 bg-red-50 text-red-700"}`}>
                                {isPaid ? "Paid" : "Unpaid"}
                            </span>
                        )}
                        <span className="text-xs text-slate-400">
                            {new Date(order.createdAt!).toLocaleString()}
                        </span>
                    </div>

                    <div className="grid gap-1.5 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                            <User size={15} className="shrink-0 text-emerald-600" />
                            <span className="font-medium text-slate-800">{order?.address.fullName}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <Phone size={15} className="shrink-0 text-emerald-600" />
                            <span>{order?.address.mobile}</span>
                        </p>
                        <p className="flex items-center gap-2 ">
                            <MapPin size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                            <span className="leading-5">{order?.address.fullAddress}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <CreditCard size={15} className="shrink-0 text-emerald-600" />
                            <span>{order.paymentMethod === "cod" ? "Cash on delivery" : "Online payment"}</span>
                        </p>
                    </div>

                    {order.assignedDeliveryBoy && (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <UserCheck className="shrink-0 text-sky-600" size={18} />
                                <div>
                                    <p className="font-semibold text-slate-800">{order.assignedDeliveryBoy.name}</p>
                                    <p className="text-xs text-slate-500">+92 {order.assignedDeliveryBoy.mobile}</p>
                                </div>
                            </div>
                            <a
                                href={`tel:${order.assignedDeliveryBoy.mobile}`}
                                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
                            >
                                Call
                            </a>
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {status}
                    </span>
                    {status !== "delivered" && (
                        <select
                            disabled={updating}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm outline-none transition hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                            value={status}
                            onChange={(e) => {
                                if (!order._id) return
                                updateStatus(order._id.toString(), e.target.value)
                            }}
                        >
                            {statusOption.map((st) => (
                                <option key={st} value={st}>{st.toUpperCase()}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-3 sm:px-6">
                <button
                    onClick={() => setExpanded(prev => !prev)}
                    className="flex w-full items-center justify-between text-sm font-medium text-green-700 transition hover:text-green-800"
                >
                    <span className="flex items-center gap-2">
                        <Package size={16} className="text-emerald-600" />
                        {expanded ? "Hide order items" : `View ${order.items.length} item${order.items.length === 1 ? "" : "s"}`}
                    </span>
                    {expanded ? <ChevronUp size={16} className="text-emerald-600" /> : <ChevronDown size={16} className="text-emerald-600" />}
                </button>

                <motion.div
                    initial={false}
                    animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                >
                    <div className="mt-3 space-y-2">
                        {order.items.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 transition hover:bg-slate-100"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={44}
                                        height={44}
                                        className="shrink-0 rounded-lg border border-slate-200 object-cover"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                                        <p className="text-xs text-slate-500">{item.quantity} × {item.unit}</p>
                                    </div>
                                </div>
                                <p className="shrink-0 text-sm font-semibold text-slate-800">Rs. {Number(item.price) * item.quantity}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-sm font-semibold text-slate-800 sm:px-6">
                <div className="flex items-center gap-2 text-slate-600">
                    <Truck size={16} className="text-emerald-600" />
                    <span className="capitalize">Delivery: <span className="font-semibold text-slate-800">{status}</span></span>
                </div>
                <div>
                    Total: <span className="font-bold text-emerald-700">Rs. {order.totalAmount ?? totalAmount}</span>
                </div>
            </div>
        </motion.article>
    )
}

export default AdminOrderCard
