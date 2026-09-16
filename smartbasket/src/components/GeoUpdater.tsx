"use client"
import { getSocket } from '@/lib/socket'
import React, { useEffect } from 'react'

function GeoUpdater({ userId }: { userId: string }) {
    useEffect(() => {
        if (!userId) return
        const socket = getSocket()
        socket.emit('identity', userId)

        if (!navigator.geolocation) return

        const watcher = navigator.geolocation.watchPosition(
            (pos) => {
                socket.emit("update-location", {
                    userId,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
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
    }, [userId])

    return null
}

export default GeoUpdater
