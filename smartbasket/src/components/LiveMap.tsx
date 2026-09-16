'use client'

import React, { useEffect } from 'react'
import L from "leaflet"
import { MapContainer, Polyline, Popup, TileLayer, Marker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import useRoute from '@/hooks/useRoute'

interface ILocation{
    latitude:number,
    longitude:number
}

interface Iprops{
    userLocation: ILocation
    deliveryBoyLocation: ILocation
    /** breadcrumb trail of where the rider has already been, from DeliveryTracking */
    trail?: ILocation[]
}

function Recenter({positions}:{positions:[number,number]}){
    const map = useMap()
    const [latitude, longitude] = positions
    useEffect(() => {
        map.setView([latitude, longitude], map.getZoom(), { animate: true })
    }, [latitude, longitude, map])
    return null
}

function hasLocation(location: ILocation) {
    return Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude)
        && !(location.latitude === 0 && location.longitude === 0)
}

function LiveMap({ userLocation, deliveryBoyLocation, trail = [] }: Iprops) {
      const deliveryBoyIcon=L.icon({
        iconUrl:"https://cdn-icons-png.flaticon.com/128/9561/9561839.png",
        iconSize:[45,45],
         })
           const userIcon=L.icon({
        iconUrl:"https://cdn-icons-png.flaticon.com/128/4821/4821951.png",
        iconSize:[45,45],
         })

    // real road route from OSRM; falls back to a straight line if unavailable
    const route = useRoute(deliveryBoyLocation, userLocation)

    const straightLine: [number, number][] =
        hasLocation(deliveryBoyLocation) && hasLocation(userLocation)
            ? [
                [deliveryBoyLocation.latitude, deliveryBoyLocation.longitude],
                [userLocation.latitude, userLocation.longitude],
            ]
            : []

    const routePositions = hasLocation(deliveryBoyLocation) ? (route.length > 1 ? route : straightLine) : []
    const trailPositions: [number, number][] = trail.map((p) => [p.latitude, p.longitude])

    if (!hasLocation(userLocation)) {
        return <div role="status" className="flex h-[340px] items-center justify-center bg-slate-50 px-6 text-center text-sm text-slate-500 sm:h-[440px]">Waiting for the delivery location…</div>
    }

    const center: [number, number] = [userLocation.latitude, userLocation.longitude]

    return (
     <div className='relative isolate z-0 h-[340px] w-full overflow-hidden bg-slate-100 sm:h-[440px]'>

 <MapContainer center={center}
                                    zoom={13} scrollWheelZoom={false} className='relative isolate z-0 w-full h-full'>
                                  <Recenter positions={center}/>
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors | Routing by <a href="https://project-osrm.org/">OSRM</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />

                                    <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
    <Popup>Delivery Address</Popup>
</Marker>

{hasLocation(deliveryBoyLocation) && (
    <Marker position={[deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]} icon={deliveryBoyIcon}>
        <Popup>Delivery Boy</Popup>
    </Marker>
)}

{/* where the rider has already been */}
{trailPositions.length > 1 && (
    <Polyline positions={trailPositions} pathOptions={{ color: "#9ca3af", weight: 3, dashArray: "6 8" }} />
)}

{/* the road ahead (straight line only while OSRM is unreachable) */}
{routePositions.length > 1 && (
    <Polyline
        positions={routePositions}
        pathOptions={{
            color: "#16a34a",
            weight: 5,
            dashArray: route.length > 1 ? undefined : "8 10",
        }}
    />
)}
</MapContainer>
     </div>
    ) 
}

export default LiveMap
