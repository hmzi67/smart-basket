import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Order from '@/models/order.model'
import { DELIVERY_EARNING, deliveryDayStart } from '@/lib/delivery-summary'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ message: 'Sign in to view your deliveries' }, { status: 401 })
    if (session.user.role !== 'deliveryBoy') return NextResponse.json({ message: 'Only delivery riders can view this page' }, { status: 403 })
    const status = req.nextUrl.searchParams.get('status') || 'all'
    if (!['all', 'active', 'delivered', 'cancelled'].includes(status)) return NextResponse.json({ message: 'Invalid delivery filter' }, { status: 400 })
    const page = Math.min(100000, Math.max(1, Math.floor(Number(req.nextUrl.searchParams.get('page'))) || 1))
    const limit = 10
    // Always scope to the authenticated rider, never a client-supplied userId.
    const scope = { assignedDeliveryBoy: session.user.id }
    const filter = { ...scope, ...(status === 'all' ? {} : { status: status === 'active' ? { $in: ['pending', 'out of delivery'] } : status }) }
    const completed = { ...scope, status: 'delivered', deliveryOtpVerification: true }
    await connectDb()
    const [orders, total, deliveredCount, activeCount, todayCount] = await Promise.all([
      Order.find(filter).select('items.name items.quantity items.unit address.fullName address.fullAddress totalAmount paymentMethod status createdAt deliveredAt deliveryOtpVerification').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
      Order.countDocuments(completed),
      Order.countDocuments({ ...scope, status: { $in: ['pending', 'out of delivery'] } }),
      Order.countDocuments({ ...completed, deliveredAt: { $gte: deliveryDayStart() } }),
    ])
    return NextResponse.json({
      deliveries: orders.map(order => ({ ...order, earning: order.status === 'delivered' && order.deliveryOtpVerification ? DELIVERY_EARNING : 0 })),
      total, page, hasMore: page * limit < total,
      summary: { completed: deliveredCount, active: activeCount, todayCompleted: todayCount, todayEarnings: todayCount * DELIVERY_EARNING, totalEarnings: deliveredCount * DELIVERY_EARNING },
    })
  } catch (error) {
    console.error('Delivery history failed:', error)
    return NextResponse.json({ message: 'Could not load your deliveries. Please try again.' }, { status: 500 })
  }
}
