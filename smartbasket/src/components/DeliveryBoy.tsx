import DeliveryBoyDashboard from './DeliveryBoyDashboard'
import { auth } from '@/auth'
import Order from '@/models/order.model'
import connectDb from '@/lib/db'
import { DELIVERY_EARNING, deliveryDayStart } from '@/lib/delivery-summary'

export default async function DeliveryBoy() {
  const session = await auth()
  if (session?.user?.role !== 'deliveryBoy') return null
  await connectDb()
  const completedFilter = { assignedDeliveryBoy: session.user.id, status: 'delivered', deliveryOtpVerification: true }
  const [completed, today] = await Promise.all([
    Order.countDocuments(completedFilter),
    Order.countDocuments({ ...completedFilter, deliveredAt: { $gte: deliveryDayStart() } }),
  ])
  return <DeliveryBoyDashboard earning={today * DELIVERY_EARNING} completed={completed} today={today} />
}
