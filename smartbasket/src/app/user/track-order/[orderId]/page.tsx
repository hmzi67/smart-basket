'use client'
import axios from 'axios'
import React, { useEffect, useState,useRef } from 'react'
import { useParams} from 'next/navigation'
import { IUser } from '@/models/user.model'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { ArrowLeft, MapPin, Truck, Package } from 'lucide-react'
import OrderChatPanel from '@/components/OrderChatPanel'
import { useRouter} from 'next/navigation'
import dynamic from 'next/dynamic'
// Leaflet touches `window` at import time, so the map must not be server-rendered
const LiveMap = dynamic(() => import('@/components/LiveMap'), {
  ssr: false,
  loading: () => <div className='w-full h-[340px] sm:h-[440px] rounded-xl bg-gray-100 animate-pulse' />,
})
import { getSocket } from '@/lib/socket'
import { IMessages } from '@/models/message.model'
import { CheckCircle2 } from 'lucide-react'
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
interface Ilocation{
  latitude : number,
  longitude : number
}
function TrackOrder() {
    const {userData}=useSelector((state:RootState)=>state.user)
    const { orderId } = useParams<{ orderId: string }>()
    const [order,setOrder]=useState<IOrder>()
    const router=useRouter()
const [newMessage, setNewMessage] = useState("")
const [messages, setMessages] = useState<IMessages[]>([])
 const chatBoxRef=useRef<HTMLDivElement>(null)
 const [loading,setLoading]=useState(false)
const [suggestions, setSuggestions] = useState([
    
])

     const [userLocation,setUserLocation]=useState<Ilocation>({latitude:0, longitude:0})
      const [deliveryBoyLocation,setdeliveryBoyLocation]=useState<Ilocation>({latitude:0, longitude:0})
      const [trail,setTrail]=useState<Ilocation[]>([])
     
    
    useEffect(() => {
        const getOrder = async () => {
            try {
                const result = await axios.get(`/api/user/get-order/${orderId}`)
                setOrder(result.data)
                setUserLocation({
                   latitude:result.data.address.latitude,
                    longitude:result.data.address.longitude
                })
                const riderCoords = result.data.assignedDeliveryBoy?.location?.coordinates
                if (Array.isArray(riderCoords)) {
                    setdeliveryBoyLocation({
                        latitude: riderCoords[1],
                        longitude: riderCoords[0],
                    })
                }
            } catch (error) {
                console.log(error)
            }
        }
        getOrder()
    }, [userData?._id, orderId])

    // the breadcrumb trail survives a reload, unlike the live socket updates
    useEffect(() => {
        const getTrail = async () => {
            try {
                const result = await axios.get(`/api/delivery/tracking/${orderId}`)
                setTrail(result.data.trail ?? [])
            } catch (error) {
                // no trail yet is normal; the map just shows the route ahead
                console.log(error)
            }
        }
        getTrail()
    }, [orderId])

    useEffect(() => {
  const socket = getSocket()
  // socket server emits { userId, location: { type: "Point", coordinates: [lng, lat] } }
  socket.on("update-deliveryboy-location", ({ userId, location }) => {
    const assigned = (order as any)?.assignedDeliveryBoy
    const assignedId = assigned?._id ?? assigned
    if (assignedId && String(assignedId) !== String(userId)) return
    if (!Array.isArray(location?.coordinates)) return
    setdeliveryBoyLocation({
      latitude: location.coordinates[1],
      longitude: location.coordinates[0],
    })
  })
  return () => {
    socket.off("update-deliveryboy-location")
  }
    }, [order])

    useEffect(() => {
        const socket = getSocket()
        socket.on("order-status-update", ({ orderId: updatedOrderId, status }) => {
            if (String(updatedOrderId) !== String(orderId)) return
            setOrder((prev) => (prev ? { ...prev, status } : prev))
        })
        return () => {
            socket.off("order-status-update")
        }
    }, [orderId])

useEffect(()=>{
  const socket=getSocket()
  socket.emit("join-room",orderId)
   socket.on("send-message",(message)=>{
if(message.roomId==orderId){

    setMessages((prev)=>[...prev!,message])
}
  })
  return()=>{socket.off("send-message")}
},[orderId])

const sendMsg=()=>{
  if (!newMessage.trim() || !userData?._id || order?.status === "delivered") return
  const socket=getSocket()
  const message={
    roomId:orderId,
    text:newMessage,
    senderId:userData?._id,
    time:new Date().toLocaleTimeString([],{
    hour:"2-digit",
    minute:"2-digit"
    })
}
  socket.emit("send-message",message)

  setNewMessage("")
}

useEffect(()=>{
  const getAllMessages=async ()=>{
    try {
    const result=await axios.post("/api/chat/messages",{roomId:orderId})
    setMessages(result.data)
    } catch (error) {
    console.log(error);
    }
  }

  getAllMessages()
},[orderId]);
useEffect(()=>{
    chatBoxRef.current?.scrollTo({
    top:chatBoxRef.current.scrollHeight,
    behavior:"smooth"
    })
},[messages])

const getSuggestion=async ()=>{
setLoading(true)
    try {
    const lastMessage=messages?.filter(m=>m.senderId?.toString()!==userData?._id)?.at(-1)
    const result=await axios.post("/api/chat/ai-suggestions", {message:lastMessage?.text,role:"user"})
   setSuggestions(Array.isArray(result.data.suggestions) ? result.data.suggestions : [])
   setLoading(false)
    } catch (error) {
    console.log(error)
    setLoading(false)
    }
}


    return (
      <main className="min-h-screen bg-[#f6f8f7] pb-12">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5 sm:px-6">
            <button aria-label="Back to orders" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700" onClick={() => router.push('/user/my-orders')}><ArrowLeft size={20} /></button>
            <div><p className="text-xs font-medium text-slate-500">Your delivery</p><h1 className="text-xl font-bold tracking-tight text-slate-900">Track order <span className="text-slate-400">#{String(order?._id ?? orderId).slice(-6)}</span></h1></div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6">
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-white p-3 text-emerald-700">{order?.status === 'delivered' ? <CheckCircle2 size={24} /> : <Truck size={24} />}</span><div><h2 className="font-semibold text-emerald-950">{order?.status === 'delivered' ? 'Your order has arrived' : order?.status === 'out of delivery' ? 'Your order is on the way' : 'Preparing your delivery'}</h2><p className="mt-1 text-sm text-emerald-800">{order?.status === 'delivered' ? 'Thank you for shopping with SmartBasket.' : 'Follow the route and stay in touch with your rider.'}</p></div></div>
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold capitalize text-emerald-700">{order?.status ?? 'Loading order'}</span>
          </section>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-5">
              {order?.status !== 'delivered' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-800"><MapPin size={18} className="text-emerald-600" /> Delivery route</div>
                <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation} trail={trail} />
                <div className="flex flex-wrap gap-4 px-5 py-3 text-xs text-slate-500"><span>📍 Delivery address</span><span>🛵 Delivery rider</span></div>
              </section>}
              {order && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><Package size={18} className="text-emerald-600" /> Delivery details</div><p className="text-sm font-medium text-slate-800">{order.address.fullName}</p><p className="mt-1 text-sm leading-6 text-slate-500">{order.address.fullAddress}</p>{order.assignedDeliveryBoy?.name && <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">Your rider: <span className="font-semibold text-slate-800">{order.assignedDeliveryBoy.name}</span></p>}</section>}
            </div>
            <OrderChatPanel title="Chat with your rider" messages={messages} currentUserId={userData?._id}
              message={newMessage} onMessageChange={setNewMessage} onSend={sendMsg}
              suggestions={suggestions} onSuggest={getSuggestion} suggesting={loading}
              closed={order?.status === 'delivered'} chatRef={chatBoxRef} />
          </div>
        </div>
      </main>
    )
}

export default TrackOrder
