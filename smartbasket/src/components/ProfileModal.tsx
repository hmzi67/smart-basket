'use client'

import axios from 'axios'
import { Loader2, Lock, X } from 'lucide-react'
import ProfilePictureEditor from './ProfilePictureEditor'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useDispatch } from 'react-redux'
import { setUserData } from '@/redux/userSlice'
import type { AppDispatch } from '@/redux/store'
import { MIN_PASSWORD_LENGTH, validatePassword } from '@/lib/password'

interface IUser {
    _id?: string
    name: string
    email: string
    mobile?: string
    address?: string
    role: "user" | "deliveryBoy" | "admin" | "shopkeeper"
    image?: string
}

/** Editable profile: details on one tab, password change on the other. */
function ProfileModal({ user, onClose }: { user: IUser; onClose: () => void }) {
    const router = useRouter()
    const dispatch = useDispatch<AppDispatch>()
    const [tab, setTab] = useState<'details' | 'password'>('details')

    const [form, setForm] = useState({
        name: user?.name ?? '',
        mobile: user?.mobile ?? '',
        address: user?.address ?? '',
    })
    const [detailsState, setDetailsState] = useState({ loading: false, error: '', saved: false })

    const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
    const [pwState, setPwState] = useState({ loading: false, error: '', saved: false })

    const saveDetails = async (e: React.FormEvent) => {
        e.preventDefault()
        // mirror of the server rules, for immediate feedback
        if (form.name.trim().length < 2) {
            return setDetailsState({ loading: false, error: 'Name must be at least 2 characters', saved: false })
        }
        if (!/^\d{10,15}$/.test(form.mobile)) {
            return setDetailsState({ loading: false, error: 'Enter a valid mobile number', saved: false })
        }

        setDetailsState({ loading: true, error: '', saved: false })
        try {
            const result = await axios.put('/api/user/profile', form)
            dispatch(setUserData(result.data.user))
            setDetailsState({ loading: false, error: '', saved: true })
            router.refresh()
        } catch (err: any) {
            setDetailsState({
                loading: false,
                error: err?.response?.data?.message || 'Could not save your profile. Please try again.',
                saved: false,
            })
        }
    }

    const savePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        const strengthError = validatePassword(pw.newPassword)
        if (strengthError) {
            return setPwState({ loading: false, error: strengthError, saved: false })
        }
        if (pw.newPassword !== pw.confirm) {
            return setPwState({ loading: false, error: 'The two passwords do not match', saved: false })
        }

        setPwState({ loading: true, error: '', saved: false })
        try {
            await axios.post('/api/user/profile/password', {
                currentPassword: pw.currentPassword,
                newPassword: pw.newPassword,
            })
            setPw({ currentPassword: '', newPassword: '', confirm: '' })
            setPwState({ loading: false, error: '', saved: true })
        } catch (err: any) {
            setPwState({
                loading: false,
                error: err?.response?.data?.message || 'Could not change your password. Please try again.',
                saved: false,
            })
        }
    }

    const field = 'w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500'

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-999 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
                <button
                    aria-label="Close profile"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center mb-5">
                    <ProfilePictureEditor image={user.image} name={user.name} />
                    <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium capitalize mt-1">
                        {user?.role}
                    </span>
                </div>

                <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setTab('details')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === 'details' ? 'bg-white shadow text-green-700' : 'text-gray-600'}`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setTab('password')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === 'password' ? 'bg-white shadow text-green-700' : 'text-gray-600'}`}
                    >
                        Password
                    </button>
                </div>

                {tab === 'details' ? (
                    <form onSubmit={saveDetails} className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600">Name</label>
                            <input
                                className={field}
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Mobile</label>
                            <input
                                className={field}
                                inputMode="numeric"
                                value={form.mobile}
                                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Address</label>
                            <textarea
                                className={field}
                                rows={3}
                                maxLength={300}
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={detailsState.loading}
                            className="w-full mt-2 bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 disabled:bg-green-300 transition"
                        >
                            {detailsState.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save changes'}
                        </button>

                        {detailsState.error && <p className="text-red-600 text-sm">{detailsState.error}</p>}
                        {detailsState.saved && <p className="text-green-700 text-sm">Profile updated.</p>}
                    </form>
                ) : (
                    <form onSubmit={savePassword} className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600">Current password</label>
                            <input
                                type="password"
                                className={field}
                                value={pw.currentPassword}
                                onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">New password</label>
                            <input
                                type="password"
                                className={field}
                                value={pw.newPassword}
                                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Confirm new password</label>
                            <input
                                type="password"
                                className={field}
                                value={pw.confirm}
                                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                            />
                        </div>

                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            At least {MIN_PASSWORD_LENGTH} characters, including a letter and a number.
                        </p>

                        <button
                            type="submit"
                            disabled={pwState.loading || !pw.currentPassword}
                            className="w-full mt-2 bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 disabled:bg-green-300 transition"
                        >
                            {pwState.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Change password'}
                        </button>

                        {pwState.error && <p className="text-red-600 text-sm">{pwState.error}</p>}
                        {pwState.saved && <p className="text-green-700 text-sm">Password changed.</p>}
                    </form>
                )}
            </motion.div>
        </div>
    )
}

export default ProfileModal
