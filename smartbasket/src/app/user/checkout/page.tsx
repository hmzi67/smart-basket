'use client'
import React, { useState } from 'react'
import CustomerPageHeader from '@/components/CustomerPageHeader'
import Link from 'next/link'
import { CreditCard, Loader2, LocateFixed, MapPin, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'
import { clearCart } from '@/redux/cartSlice'
import { useEffect } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'

const CheckOutMap = dynamic(() => import("@/components/CheckoutMap"), { ssr: false });

const DEFAULT_POSITION: [number, number] = [33.6844, 73.0479] // Islamabad


function Checkout() {
    const router = useRouter()
    const dispatch = useDispatch<AppDispatch>()
    const { userData } = useSelector((state: RootState) => state.user)
    const { subTotal, deliveryFee, finalTotal, cartData } = useSelector((state: RootState) => state.cart)
    const [addressDraft, setAddress] = useState({
        fullName: undefined as string | undefined,
        mobile: undefined as string | undefined,
        city: "",
        state: "",
        pincode: "",
        fullAddress: "",
    })
    const address = {
        ...addressDraft,
        fullName: addressDraft.fullName ?? userData?.name ?? '',
        mobile: addressDraft.mobile ?? userData?.mobile ?? '',
    }
    const [locationError, setLocationError] = useState('')
    const [searchLoading, setSearchLoading] = useState("false")
    const [searchQuery, setSearchQuery] = useState("")
    const [suggestions, setSuggestions] = useState<{ label: string; x: number; y: number }[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [position, setPosition] = useState<[number, number]>(DEFAULT_POSITION)
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod")
    const [orderLoading, setOrderLoading] = useState(false)
    const [orderError, setOrderError] = useState("")

    // --- Easypaisa states ---
    const [epMobileNumber, setEpMobileNumber] = useState("")
    const [epEmail, setEpEmail] = useState("")
    const [epLoading, setEpLoading] = useState(false)
    const [epMessage, setEpMessage] = useState("")
    const [epSuccess, setEpSuccess] = useState(false)

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setPosition([latitude, longitude]);
                },
                (err) => {
                    console.warn(`location error (${err.code}): ${err.message}`);
                    setPosition((prev) => prev ?? DEFAULT_POSITION);
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
            );
        }
    }, []);

    const handleSearchQuery = async () => {
        if (!searchQuery.trim()) return
        setSearchLoading("true")
        setLocationError("")
        try {
            const { OpenStreetMapProvider } = await import("leaflet-geosearch")
            const provider = new OpenStreetMapProvider()
            const results = await provider.search({ query: searchQuery });
            if (results.length > 0) {
                setPosition([results[0].y, results[0].x])
                setShowSuggestions(false)
            } else {
                setLocationError(`No location found for "${searchQuery}". Try another area or move the map pin.`)
            }
        } catch (error) {
            console.error("Search error:", error)
            setLocationError("Could not search locations. Please move the map pin or try again.")
        } finally {
            setSearchLoading("false")
        }
    }

    // live suggestions as the user types, debounced so every keystroke doesn't hit Nominatim
    useEffect(() => {
        const query = searchQuery.trim()
        if (query.length < 3) {
            setSuggestions([])
            return
        }
        let cancelled = false
        const timer = setTimeout(async () => {
            try {
                const { OpenStreetMapProvider } = await import("leaflet-geosearch")
                const provider = new OpenStreetMapProvider()
                const results = await provider.search({ query })
                if (cancelled) return
                setSuggestions(results.slice(0, 5).map(r => ({ label: r.label, x: r.x, y: r.y })))
                setShowSuggestions(true)
            } catch (error) {
                if (!cancelled) console.error("Suggestion error:", error)
            }
        }, 350)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [searchQuery])

    const handleSelectSuggestion = (suggestion: { label: string; x: number; y: number }) => {
        setPosition([suggestion.y, suggestion.x])
        setSearchQuery(suggestion.label)
        setSuggestions([])
        setShowSuggestions(false)
        setLocationError("")
    }

    const handleCod = async () => {
        setOrderError("")
        if (!position) {
            setOrderError("Please select your location on the map.")
            return
        }
        const missing = (["fullName", "mobile", "fullAddress", "city", "state", "pincode"] as const)
            .filter((key) => !address[key]?.trim())
        if (missing.length > 0) {
            setOrderError(`Please fill in: ${missing.join(", ")}`)
            return
        }
        setOrderLoading(true)
        try {
            await axios.post("/api/user/order", {
                userId: userData?._id,
                items: cartData.map(item => ({
                    grocery: item._id,
                    name: item.name,
                    price: item.price,
                    unit: item.unit,
                    image: item.image,
                    quantity: item.quantity
                })),
                paymentMethod: "cod",
                address: {
                    fullName: address.fullName,
                    mobile: address.mobile,
                    city: address.city,
                    state: address.state,
                    fullAddress: address.fullAddress,
                    pincode: address.pincode,
                    latitude: position[0],
                    longitude: position[1]
                },
               
            })
            // the order route has already emptied the stored cart; clear the
            // in-session copy too, or useCartSync would write it straight back
            dispatch(clearCart())
            router.push("/user/order-success")
        } catch (error: any) {
            console.error(error)
            setOrderError(error?.response?.data?.message || error?.response?.data?.error || "Could not place order. Please try again.")
        } finally {
            setOrderLoading(false)
        }
    }

    // --- Easypaisa Payment Trigger Function ---
    const handleOnlineOrder = async () => {
        if (!epMobileNumber || !epEmail) {
            setEpSuccess(false)
            setEpMessage("Error: Please enter your Easypaisa number and email.")
            return;
        }

        setEpLoading(true)
        setEpMessage("")
        setEpSuccess(false)

        try {
            const res = await fetch("/api/easypaisa/direct-pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mobileNumber: epMobileNumber,
                    email: epEmail,
                    amount: finalTotal.toString(),
                    addressDetails: address,
                    userId: userData?._id
                }),
            });

            const data = await res.json();

            if (data.success) {
                setEpSuccess(true)
                setEpMessage("Success! Please check your mobile for the PIN popup and approve the payment.")
                // Optionally redirect to success page after approval
                // router.push("/user/order-success")
            } else {
                setEpSuccess(false)
                setEpMessage(`Error: ${data.message || data.error}`)
            }
        } catch {
            setEpSuccess(false)
            setEpMessage("Server error! Please try again.")
        } finally {
            setEpLoading(false)
        }
    }

    useEffect(() => {
        if (!position) return
        // dragging/searching fires a new lookup per position change; an older
        // request can resolve after a newer one and overwrite the current pin's
        // address with stale data, so only the latest request may apply its result
        let cancelled = false
        const fetchAddress = async () => {
            try {
                const result = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`)
                if (cancelled) return
                setAddress(prev => ({
                    ...prev,
                    city: result.data.address.city || result.data.address.town || result.data.address.village || prev.city,
                    state: result.data.address.state || prev.state,
                    pincode: result.data.address.postcode || prev.pincode,
                    fullAddress: result.data.display_name || prev.fullAddress,
                }))
            } catch (error) {
                if (!cancelled) console.log(error)
            }
        }
        fetchAddress()
        return () => { cancelled = true }
    }, [position]);

    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setPosition([latitude, longitude]);
                },
                (err) => {
                    console.log('location error', err);
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
            );
        }
    }

    return (
      <main className="min-h-screen bg-linear-to-b from-white to-gray-100 pb-16">
        <CustomerPageHeader title="Checkout" subtitle="One last step before your groceries are on their way." backHref="/user/cart" backLabel="Back to basket" />
        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <div className="mb-7 flex items-center gap-3 text-xs font-semibold text-gray-400"><Link href="/user/cart" className="text-green-700">01 Basket</Link><span className="h-px w-8 bg-gray-200" /><span className="text-green-700">02 Checkout</span><span className="h-px w-8 bg-gray-200" /><span>03 Confirmation</span></div>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg hover:shadow-xl transition-all sm:p-7">
              <div className="mb-6 flex items-center gap-3"><span className="rounded-xl bg-green-100 p-2.5 text-green-700"><MapPin size={21} /></span><div><h2 className="font-semibold text-gray-800">Where should we deliver?</h2><p className="mt-1 text-xs text-gray-500">Enter your address and confirm the pin on the map.</p></div></div>
              <div className="grid gap-4 sm:grid-cols-2">
                {([{ key: 'fullName', label: 'Full name', placeholder: 'Recipient name', autoComplete: 'name' }, { key: 'mobile', label: 'Mobile number', placeholder: '03XXXXXXXXX', autoComplete: 'tel' }, { key: 'city', label: 'City', placeholder: 'City', autoComplete: 'address-level2' }, { key: 'state', label: 'Province / region', placeholder: 'Province or region', autoComplete: 'address-level1' }, { key: 'pincode', label: 'Postal code', placeholder: 'Postal code', autoComplete: 'postal-code' }] as const).map(field => <label key={field.key} className="block text-xs font-semibold text-gray-600">{field.label}<input type={field.key === 'mobile' ? 'tel' : 'text'} autoComplete={field.autoComplete} value={address[field.key]} onChange={event => setAddress(prev => ({ ...prev, [field.key]: event.target.value }))} placeholder={field.placeholder} className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-sm font-normal text-gray-800 outline-none focus:ring-2 focus:ring-green-500" /></label>)}
                <label className="block text-xs font-semibold text-gray-600 sm:col-span-2">Street address<textarea autoComplete="street-address" rows={2} value={address.fullAddress} onChange={event => setAddress(prev => ({ ...prev, fullAddress: event.target.value }))} placeholder="House, street and nearby landmark" className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-sm font-normal text-gray-800 outline-none focus:ring-2 focus:ring-green-500" /></label>
              </div>
              <div className="mt-6 border-t border-gray-100 pt-5"><label htmlFor="location-search" className="text-xs font-semibold text-gray-600">Find your location</label><div className="relative mt-2"><form onSubmit={event => { event.preventDefault(); void handleSearchQuery() }} className="flex gap-2"><input id="location-search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} onFocus={() => { if (suggestions.length) setShowSuggestions(true) }} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} placeholder="Search city or area" autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500" /><button type="submit" disabled={searchLoading === 'true'} className="rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">{searchLoading === 'true' ? <Loader2 size={18} className="animate-spin" /> : 'Search'}</button></form>{showSuggestions && suggestions.length > 0 && <ul role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white text-sm shadow-lg">{suggestions.map((suggestion, i) => <li key={`${suggestion.label}-${i}`}><button type="button" role="option" onMouseDown={event => event.preventDefault()} onClick={() => handleSelectSuggestion(suggestion)} className="block w-full truncate px-3 py-2 text-left text-gray-700 hover:bg-green-50">{suggestion.label}</button></li>)}</ul>}</div><div className="relative isolate mt-4 h-72 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-inner">{position ? <CheckOutMap position={position} setPosition={setPosition} /> : <p role="status" className="flex h-full items-center justify-center text-sm text-gray-500">Finding your location...</p>}<button type="button" aria-label="Use my current location" onClick={handleCurrentLocation} className="absolute bottom-6 right-3 z-10 rounded-xl bg-white p-3 text-green-700 shadow-md hover:bg-green-50"><LocateFixed size={20} /></button></div>{locationError && <p role="alert" className="mt-2 text-xs text-amber-700">{locationError}</p>}<p className="mt-2 text-xs text-gray-500">Drag the pin to your delivery location.</p></div>
            </section>
            <aside className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl lg:sticky lg:top-6">
              <h2 className="text-lg font-semibold text-gray-800">Payment & summary</h2><p className="mt-1 text-xs text-gray-500">Choose how you&apos;d like to pay.</p>
              <div className="mt-5 space-y-3">{([{ value: 'cod', label: 'Cash on delivery', detail: 'Pay when your groceries arrive', icon: Truck }, { value: 'online', label: 'Easypaisa', detail: 'Pay with your mobile wallet', icon: CreditCard }] as const).map(({ value, label, detail, icon: Icon }) => <button key={value} type="button" aria-pressed={paymentMethod === value} onClick={() => { setPaymentMethod(value); setOrderError(''); setEpMessage('') }} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === value ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:bg-green-50'}`}><Icon size={20} className="shrink-0 text-green-700" /><span className="flex-1"><span className="block text-sm font-semibold text-gray-800">{label}</span><span className="mt-1 block text-xs text-gray-500">{detail}</span></span><span className={`h-4 w-4 rounded-full border ${paymentMethod === value ? 'border-[5px] border-green-600' : 'border-gray-300'}`} /></button>)}</div>
              {paymentMethod === 'online' && <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4"><label className="block text-xs font-semibold text-slate-600">Wallet mobile number<input type="tel" value={epMobileNumber} onChange={event => setEpMobileNumber(event.target.value)} placeholder="03XXXXXXXXX" className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm font-normal" /></label><label className="block text-xs font-semibold text-slate-600">Email<input type="email" value={epEmail} onChange={event => setEpEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm font-normal" /></label>{epMessage && <p role="status" className={`text-xs leading-5 ${epSuccess ? 'text-emerald-700' : 'text-red-600'}`}>{epMessage}</p>}</div>}
              <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm"><div className="flex justify-between text-slate-500"><dt>Subtotal</dt><dd className="text-slate-800">Rs. {subTotal.toLocaleString('en-PK')}</dd></div><div className="flex justify-between text-slate-500"><dt>Delivery</dt><dd className="text-slate-800">{deliveryFee === 0 ? 'Free' : `Rs. ${deliveryFee.toLocaleString('en-PK')}`}</dd></div><div className="flex justify-between border-t border-slate-100 pt-4 text-lg font-bold text-slate-900"><dt>Total</dt><dd>Rs. {finalTotal.toLocaleString('en-PK')}</dd></div></dl>
              <button type="button" disabled={epLoading || orderLoading || !cartData.length} onClick={() => { if (paymentMethod === 'cod') void handleCod(); else void handleOnlineOrder() }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">{epLoading || orderLoading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : paymentMethod === 'cod' ? 'Place order' : 'Pay & place order'}</button>
              {orderError && <p role="alert" className="mt-3 text-sm text-red-600">{orderError}</p>}{!cartData.length && <p className="mt-3 text-center text-xs text-slate-500">Your basket is empty. <Link href="/" className="font-semibold text-emerald-700">Add groceries</Link></p>}
            </aside>
          </div>
        </div>
      </main>
    )
}

export default Checkout
