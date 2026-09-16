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
  return <main className="min-h-screen bg-[#f6f8f7] px-4 pb-16 pt-28 sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl space-y-6"><RiderSummary earning={earning} completed={completed} today={today} /><div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">{dashboardError ? <><p role="alert" className="text-sm text-red-700">{dashboardError}</p><button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-emerald-700">Try again</button></> : <p role="status" className="text-sm text-slate-500">Loading your deliveries…</p>}</div></div></main>
}

if(!activeOrder && assignments.length===0){
  return <main className="min-h-screen bg-[#f6f8f7] px-4 pb-16 pt-28 sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl space-y-7"><RiderSummary earning={earning} completed={completed} today={today} /><section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Truck size={32} /></span><h2 className="mt-5 text-xl font-semibold text-slate-900">You’re all caught up.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">No active deliveries or new offers right now. Keep this page open to receive delivery offers.</p><button onClick={() => window.location.reload()} className="mt-6 rounded-xl border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Check for deliveries</button></section></div></main>
}

if(activeOrder && userLocation){
    return (
      <main className="min-h-screen bg-[#f6f8f7] px-4 pb-12 pt-28 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <RiderSummary earning={earning} completed={completed} today={today} />
          <header className="flex flex-wrap items-center justify-between gap-4 py-2">
            <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Delivery workspace</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">Active delivery</h1><p className="mt-2 text-sm text-slate-500">Order #{String(activeOrder.order._id).slice(-6)}</p></div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"><Truck size={16} /> In progress</span>
          </header>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-5">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-800"><MapPin size={18} className="text-emerald-600" /> Delivery route</div>
                <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation} />
                <div className="px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Deliver to</p><p className="mt-1 text-sm font-semibold text-slate-800">{activeOrder.order.address?.fullName}</p><p className="mt-1 text-sm leading-6 text-slate-500">{activeOrder.order.address?.fullAddress}</p></div>
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-start gap-3"><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><ShieldCheck size={22} /></span><div><h2 className="font-semibold text-slate-900">Complete delivery</h2><p className="mt-1 text-xs leading-5 text-slate-500">Confirm the handoff with the customer’s delivery code.</p></div></div>
                {otpError && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{otpError}</p>}
                {!activeOrder.order.deliveryOtpVerification && !showOtpBox && <button disabled={sendOtpLoading} onClick={sendOtp} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60">{sendOtpLoading ? <><Loader size={16} className="animate-spin" /> Sending code…</> : 'Mark as delivered'}</button>}
                {showOtpBox && <form onSubmit={event => { event.preventDefault(); if (/^\d{4}$/.test(otp) && !verifyOtpLoading) void verifyOtp() }} className="space-y-3">
                  <label htmlFor="delivery-otp" className="block text-sm font-medium text-slate-700">Customer’s 4-digit code</label>
                  <input id="delivery-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={4} placeholder="0000" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xl tracking-[0.5em] text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  <button type="submit" disabled={verifyOtpLoading || !/^\d{4}$/.test(otp)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50">{verifyOtpLoading ? <><Loader size={16} className="animate-spin" /> Verifying…</> : 'Verify & complete delivery'}</button>
                </form>}
                {activeOrder.order.deliveryOtpVerification && <p className="rounded-xl bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-700">Delivery completed!</p>}
              </section>
            </div>
            <DeliveryChat orderId={activeOrder.order._id} deliveryBoyId={userData?._id?.toString() ?? ''} />
          </div>
        </div>
      </main>
    )
}

  return (
    <main className='min-h-screen bg-[#f6f8f7] px-4 pb-16 pt-28 sm:px-6 lg:px-10'>
      <div className='max-w-7xl mx-auto'>
        <RiderSummary earning={earning} completed={completed} today={today} />
        <h2 className='text-xl font-bold mt-8 mb-5 text-slate-900'>Delivery Assignments</h2>

        {assignmentError && (
          <div className='mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm'>
            {assignmentError}
          </div>
        )}

        {assignments.filter((a)=>a?.order).map((a) => (
          <div key={a._id} className='p-6 bg-white rounded-2xl shadow-sm mb-4 border border-slate-200'>
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