export type OrderStatus = 'pending' | 'out of delivery' | 'delivered' | 'cancelled'
export interface CustomerOrder {
  _id: string
  items: { grocery: string; name: string; price: string; unit: string; image: string; quantity: number }[]
  isPaid?: boolean
  totalAmount?: string | number
  paymentMethod: 'cod' | 'online'
  address: { fullName: string; mobile: string; fullAddress: string; city?: string; state?: string; pincode?: string }
  assignedDeliveryBoy?: { _id?: string; name: string; mobile?: string } | null
  status: OrderStatus
  createdAt?: string | Date
}
