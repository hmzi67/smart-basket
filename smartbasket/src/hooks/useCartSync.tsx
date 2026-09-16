'use client'
import axios from 'axios'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSession } from 'next-auth/react'
import { setCartData, setCartHydrated } from '@/redux/cartSlice'
import type { AppDispatch, RootState } from '@/redux/store'

/**
 * Keeps the Redux cart (the working in-session copy) and the stored Cart
 * document in step.
 *
 * On login / page load the stored cart is fetched. If the visitor already had
 * items in Redux from browsing logged-out, those are merged on top of the
 * stored cart rather than discarded. After that first load, every change to the
 * cart is written back, debounced so a burst of +/- taps is one request.
 */
function useCartSync() {
    const dispatch = useDispatch<AppDispatch>()
    const { status } = useSession()
    const { cartData, hydrated } = useSelector((state: RootState) => state.cart)
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const loadedFor = useRef<string | null>(null)

    // load (and merge) once per authenticated session
    useEffect(() => {
        if (status !== 'authenticated') {
            if (status === 'unauthenticated') {
                loadedFor.current = null
                dispatch(setCartHydrated(false))
            }
            return
        }
        if (loadedFor.current === 'done') return
        loadedFor.current = 'done'

        const load = async () => {
            try {
                const guestItems = cartData.map((i) => ({ grocery: i._id, quantity: i.quantity }))
                const result = guestItems.length
                    ? await axios.put('/api/user/cart', { items: guestItems, mode: 'merge' })
                    : await axios.get('/api/user/cart')
                dispatch(setCartData(result.data.items ?? []))
            } catch {
                // offline or not logged in yet — keep whatever is in Redux and
                // let the next change try again
                dispatch(setCartHydrated(true))
            }
        }
        load()
    }, [status, dispatch, cartData])

    // write back on change, once the stored cart has been loaded
    useEffect(() => {
        if (status !== 'authenticated' || !hydrated) return

        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
            axios
                .put('/api/user/cart', {
                    items: cartData.map((i) => ({ grocery: i._id, quantity: i.quantity })),
                })
                .catch(() => {
                    // a failed save is not worth interrupting shopping for; the
                    // next cart change retries
                })
        }, 600)

        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current)
        }
    }, [cartData, hydrated, status])
}

export default useCartSync
