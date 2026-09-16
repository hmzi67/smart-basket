"use client"

import { getSocket } from '@/lib/socket'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState} from '@/redux/store'
import dynamic from 'next/dynamic'
// Leaflet touches `window` at import time, so the map must not be server-rendered
const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => <div className='w-full h-[340px] sm:h-[440px] rounded-xl bg-gray-100 animate-pulse' />,
})
import DeliveryChat from './DeliveryChat'
import { Loader, MapPin, Truck, ShieldCheck } from 'lucide-react'
import RiderSummary from './RiderSummary'




interface Ilocation{
  latitude : number,
  longitude : number
}

function DeliveryBoyDashboard({earning, completed, today}:{earning:number; completed:number; today:number}) {
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState("")
  const [assignments, setAssignments] = useState<any[]>([])
  const {userData}=useSelector((state:RootState)=>state.user)
  const [activeOrder,setActiveOrder]=useState<any>(null)
  const [showOtpBox,setShowOtpBox]=useState(false)
  const [otpError,setOtpError]=useState("")
  const [sendOtpLoading,setSendOtpLoading]=useState(false)
    const [verifyOtpLoading,setVerifyOtpLoading]=useState(false)
  const [otp,setOtp]=useState("")
  const [actionId,setActionId]=useState<string|null>(null)
  const [assignmentError,setAssignmentError]=useState("")
  const [userLocation,setUserLocation]=useState<Ilocation>({latitude:0, longitude:0})
  const [deliveryBoyLocation,setdeliveryBoyLocation]=useState<Ilocation>({latitude:0, longitude:0})
 

useEffect(()=>{
  const socket=getSocket()
    if (!userData?._id) return
        if (!navigator.geolocation) return
        
        const watcher = navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude
                const lon = pos.coords.longitude
                setdeliveryBoyLocation({
                  latitude: lat,
                  longitude: lon
                })
                socket.emit("update-location", {
               userId :userData?._id,
                    latitude: lat,
                    longitude: lon
                })
            },
            (error) => {
                console.warn(`Geolocation error (${error.code}): ${error.message}`)
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        )
        
        return () => {
            navigator.geolocation.clearWatch(watcher)

        }

},[userData?._id])
 
useEffect(():any=>{
  const socket=getSocket()

  socket.on("new-assignment",(deliveryAssignment)=>{
    setAssignments((prev)=>[...prev,deliveryAssignment])
  })

  return ()=>socket.off("new-assignment")
},[])

const handleAccept=async (id:string)=>{
    setActionId(id)
    setAssignmentError("")
    try {
    await axios.get(`/api/delivery/assignment/${id}/accept-assignment`)
    setAssignments((prev)=>prev.filter((a)=>a._id!==id))
    await fetchCurrentOrder()
    } catch (error:any) {
        setAssignmentError(error?.response?.data?.message || "Could not accept assignment")
    } finally {
        setActionId(null)
    }
}

const handleReject=async (id:string)=>{
    setActionId(id)
    setAssignmentError("")
    try {
    await axios.post(`/api/delivery/assignment/${id}/reject-assignment`)
    // the offer is gone from this rider's list either way
    setAssignments((prev)=>prev.filter((a)=>a._id!==id))
    } catch (error:any) {
        setAssignmentError(error?.response?.data?.message || "Could not reject assignment")
    } finally {
        setActionId(null)
    }
}

const fetchCurrentOrder=async ()=>{
try {
    const result=await axios.get("/api/delivery/current-order")
    if(result.data.active && result.data.assignment?.order){
      setActiveOrder(result.data.assignment)
      setUserLocation({
        latitude: result.data.assignment.order.address.latitude,
        longitude: result.data.assignment.order.address.longitude
      })
    } else {
      setActiveOrder(null)
    }
} catch (error) {
    console.log(error)
    setDashboardError("Could not load your active delivery. Please try again.")
}
}
useEffect(():any=>{
const socket=getSocket()
socket.on("update-deliveryboy-location",({userId,location})=>{
if (String(userId) !== String(userData?._id) || !Array.isArray(location?.coordinates)) return
setdeliveryBoyLocation({
latitude:location.coordinates[1],
longitude:location.coordinates[0]
})
})
return ()=>socket.off("update-deliveryboy-location")
},[userData?._id])



 useEffect(() => {
   const fetchAssignments = async () => {
      try {
        const result = await axios.get('/api/delivery/get-assignments')
        setAssignments(Array.isArray(result.data?.assignments) ? result.data.assignments : [])
      } catch (error) {
        console.log(error)
        setDashboardError("Could not load delivery offers. Please try again.")
      }
    }
    async function loadDashboard() {
      await Promise.all([fetchCurrentOrder(), fetchAssignments()])
      setDashboardLoading(false)
    }
    void loadDashboard()
  }, [userData?._id])
const sendOtp=async ()=>{
  setSendOtpLoading(true)
  setOtpError("")
  try {
    await axios.post("/api/delivery/otp/send",{orderId:activeOrder.order._id})
    setShowOtpBox(true)
  } catch (error:any) {
    setOtpError(error?.response?.data?.message || "Could not send the OTP. Please try again.")
  } finally {
    setSendOtpLoading(false)
  }
}
const verifyOtp = async ()=>{
  setVerifyOtpLoading(true)
  setOtpError("")
  try {
    await axios.post("/api/delivery/otp/verify", {
      orderId: activeOrder.order._id,
      otp
    })
    setActiveOrder(null)
    await fetchCurrentOrder()
    window.location.reload()
  } catch (error:any) {
    // surface the real reason: wrong code, expired, or too many attempts
    setOtpError(error?.response?.data?.message || "Could not verify the OTP. Please try again.")
  } finally {
    setVerifyOtpLoading(false)
  }
}

if (dashboardLoading || dashboardError) {
  return <main className="min-h-screen bg-linear-to-b from-white to-gray-100 px-4 pb-16 pt-28 sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl space-y-6"><RiderSummary earning={earning} completed={completed} today={today} /><div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">{dashboardError ? <><p role="alert" className="text-sm text-red-700">{dashboardError}</p><button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-green-700">Try again</button></> : <p role="status" className="text-sm text-gray-500">Loading your deliveries…</p>}</div></div></main>
}

if(!activeOrder && assignments.length===0){
  return <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-white to-green-50 px-4 pb-12 pt-28">
    <div className="w-full max-w-md text-center">
      <h1 className="text-2xl font-bold text-gray-800">No Active Deliveries 🚚</h1>
      <p className="mb-5 text-sm text-gray-500">Stay online to receive new orders</p>
      <RiderSummary earning={earning} completed={completed} today={today} />
      <button onClick={() => window.location.reload()} className="mt-5 text-sm font-medium text-green-700">Check for deliveries</button>
    </div>
  </main>
}

if(activeOrder && userLocation){
    return (
      <main className="min-h-screen bg-linear-to-b from-white to-gray-100 px-4 pb-12 pt-28 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4 py-2">
            <div><h1 className="text-2xl font-bold text-green-700">Active Delivery</h1><p className="mt-2 text-sm text-gray-500">Order #{String(activeOrder.order._id).slice(-6)}</p></div>
            <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700"><Truck size={16} /> In progress</span>
          </header>
          <div className="flex flex-col gap-6">
            <div className="contents">
              <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
                <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 text-sm font-semibold text-gray-800"><MapPin size={18} className="text-green-600" /> Delivery route</div>
                <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation} />
                <div className="px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Deliver to</p><p className="mt-1 text-sm font-semibold text-gray-800">{activeOrder.order.address?.fullName}</p><p className="mt-1 text-sm leading-6 text-gray-500">{activeOrder.order.address?.fullAddress}</p></div>
              </section>
              <section className="order-3 w-full rounded-xl border border-gray-300 bg-white p-5 shadow-md sm:p-6">
                <div className="mb-5 flex items-start gap-3"><span className="rounded-xl bg-green-50 p-2.5 text-green-700"><ShieldCheck size={22} /></span><div><h2 className="font-semibold text-gray-800">Complete delivery</h2><p className="mt-1 text-xs leading-5 text-gray-500">Confirm the handoff with the customer’s delivery code.</p></div></div>
                {otpError && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{otpError}</p>}
                {!activeOrder.order.deliveryOtpVerification && !showOtpBox && <button disabled={sendOtpLoading} onClick={sendOtp} className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">{sendOtpLoading ? <><Loader size={16} className="animate-spin" /> Sending code…</> : 'Mark as delivered'}</button>}
                {showOtpBox && <form onSubmit={event => { event.preventDefault(); if (/^\d{4}$/.test(otp) && !verifyOtpLoading) void verifyOtp() }} className="space-y-3">
                  <label htmlFor="delivery-otp" className="block text-sm font-medium text-gray-700">Customer’s 4-digit code</label>
                  <input id="delivery-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={4} placeholder="0000" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center text-xl tracking-[0.5em] text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
                  <button type="submit" disabled={verifyOtpLoading || !/^\d{4}$/.test(otp)} className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50">{verifyOtpLoading ? <><Loader size={16} className="animate-spin" /> Verifying…</> : 'Verify & complete delivery'}</button>
                </form>}
                {activeOrder.order.deliveryOtpVerification && <p className="rounded-xl bg-green-50 p-4 text-center text-sm font-semibold text-green-700">Delivery completed!</p>}
              </section>
            </div>
            <DeliveryChat orderId={activeOrder.order._id} deliveryBoyId={userData?._id?.toString() ?? ''} />
          </div>
        </div>
      </main>
    )
}

  return (
    <main className='min-h-screen bg-linear-to-b from-white to-gray-100 px-4 pb-16 pt-28 sm:px-6 lg:px-10'>
      <div className='max-w-3xl mx-auto'>
        <h2 className='text-2xl font-bold mb-5 text-gray-800'>Delivery Assignments</h2>

        {assignmentError && (
          <div className='mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm'>
            {assignmentError}
          </div>
        )}

        {assignments.filter((a)=>a?.order).map((a) => (
          <div key={a._id} className='p-6 bg-white rounded-2xl shadow-md mb-4 border border-gray-100'>
            <p>
              <b>Order Id </b>#{String(a.order._id).slice(-6)}
            </p>
            <p className='text-gray-600'>{a.order.address?.fullAddress}</p>
            <div className='flex gap-3 mt-4'>
              <button
                className='flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg transition'
                disabled={actionId===a._id}
                onClick={()=>handleAccept(a._id)}
              >
                {actionId===a._id ? <Loader size={16} className='animate-spin mx-auto' /> : 'Accept'}
              </button>
              <button
                className='flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2 rounded-lg transition'
                disabled={actionId===a._id}
                onClick={()=>handleReject(a._id)}
              >
                {actionId===a._id ? <Loader size={16} className='animate-spin mx-auto' /> : 'Reject'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

export default DeliveryBoyDashboard
