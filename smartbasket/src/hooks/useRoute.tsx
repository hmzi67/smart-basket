'use client'
import { useEffect, useRef, useState } from 'react'
import { distanceInMeters } from '@/lib/geo'

interface ILocation {
    latitude: number
    longitude: number
}

/**
 * Road route between two points, from OSRM.
 *
 * Uses OSRM's free public demo server (router.project-osrm.org): no API key,
 * no billing, which suits this project. It is explicitly not meant for
 * production traffic and is rate-limited, so set NEXT_PUBLIC_OSRM_URL to a
 * self-hosted OSRM instance before going live.
 *
 * Returns [] while loading or when the request fails; the map then falls back
 * to a straight line, so the route is never the thing that breaks the page.
 */
export function useRoute(from: ILocation | null, to: ILocation | null) {
    const [route, setRoute] = useState<[number, number][]>([])
    const lastFrom = useRef<[number, number] | null>(null)
    const lastTo = useRef<[number, number] | null>(null)

    const valid = (p: ILocation | null): p is ILocation =>
        Boolean(p) && Number.isFinite(p!.latitude) && Number.isFinite(p!.longitude) &&
        !(p!.latitude === 0 && p!.longitude === 0)

    useEffect(() => {
        if (!valid(from) || !valid(to)) return

        const fromPoint: [number, number] = [from.longitude, from.latitude]
        const toPoint: [number, number] = [to.longitude, to.latitude]

        // The rider's position updates constantly. Only ask OSRM again once an
        // endpoint has actually moved a meaningful distance.
        const movedEnough =
            !lastFrom.current ||
            !lastTo.current ||
            distanceInMeters(lastFrom.current, fromPoint) > 50 ||
            distanceInMeters(lastTo.current, toPoint) > 50

        if (!movedEnough) return

        lastFrom.current = fromPoint
        lastTo.current = toPoint

        const controller = new AbortController()
        const base = process.env.NEXT_PUBLIC_OSRM_URL || 'https://router.project-osrm.org'
        const url =
            `${base}/route/v1/driving/` +
            `${fromPoint[0]},${fromPoint[1]};${toPoint[0]},${toPoint[1]}` +
            `?overview=full&geometries=geojson`

        fetch(url, { signal: controller.signal })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
            .then((data) => {
                const coords = data?.routes?.[0]?.geometry?.coordinates
                if (Array.isArray(coords)) {
                    // OSRM returns [lng, lat]; Leaflet wants [lat, lng]
                    setRoute(coords.map((c: number[]) => [c[1], c[0]] as [number, number]))
                }
            })
            .catch((error) => {
                if (error?.name !== 'AbortError') {
                    console.warn('route lookup failed, falling back to a straight line', error)
                }
            })

        return () => controller.abort()
    }, [from?.latitude, from?.longitude, to?.latitude, to?.longitude])

    return route
}

export default useRoute
