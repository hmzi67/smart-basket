'use client'
import React, { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
})
type props ={
    position: [number, number],
  setPosition: (pos: [number, number]) => void
}
function DraggableMarker({ position, setPosition }: props) {
            const map = useMap()
            useEffect(() => {
                if (position) {
                    map.setView(position as LatLngExpression, 15, { animate: true })
                }
            }, [position, map]);
            return (
                <Marker
                    icon={markerIcon}
                    position={position as LatLngExpression}
                    draggable={true}
                    eventHandlers={{
                        dragend: (e: L.LeafletEvent) => {
                            const marker = e.target as L.Marker
                            const { lat, lng } = marker.getLatLng()
                            setPosition([lat, lng])
                        }
                    }}
                />
            )
        }

function CheckoutMap({ position, setPosition}: props) {
  return (
    <MapContainer center={position as LatLngExpression}
                                      zoom={13} scrollWheelZoom={true} className='relative isolate z-0 w-full h-full'>
                                      <TileLayer
                                          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                      />
                                      <DraggableMarker position={position} setPosition={setPosition} />
                                       </MapContainer>
  )
}

export default CheckoutMap