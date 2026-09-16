"use client"
import { EyeIcon, EyeOff, Leaf, Loader2, Lock } from 'lucide-react'
import React, { Suspense, useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { MIN_PASSWORD_LENGTH, validatePassword } from '@/lib/password'

function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // same rule the API enforces, checked here for immediate feedback
    const strengthError = validatePassword(password)
    if (strengthError) return setError(strengthError)
    if (password !== confirm) return setError('The two passwords do not match')

    setLoading(true)
    setError('')
    try {
      await axios.post('/api/auth/reset-password', { token, password })
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not reset your password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center">
        <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          This reset link is missing its token. Please request a new one.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-block text-green-600 font-medium">
          Request a new link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="w-full max-w-sm text-center">
        <p className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm">
          Password updated. Taking you to the login page…
        </p>
      </div>
    )
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col gap-4 w-full max-w-sm"
    >
      <div className="relative">
        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="New password"
          className="w-full pr-10 py-3 pl-10 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
        {showPassword ? (
          <EyeOff className="absolute right-3 top-3.5 w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setShowPassword(false)} />
        ) : (
          <EyeIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setShowPassword(true)} />
        )}
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm new password"
          className="w-full pr-4 py-3 pl-10 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          onChange={(e) => setConfirm(e.target.value)}
          value={confirm}
        />
      </div>

      <p className="text-xs text-gray-500">
        At least {MIN_PASSWORD_LENGTH} characters, including a letter and a number.
      </p>

      <button
        type="submit"
        className="w-full rounded-xl bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
        disabled={!password || !confirm || loading}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Set new password'}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </motion.form>
  )
}

function ResetPassword() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 bg-white">
      <motion.h1
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-extrabold text-green-700 mb-2 text-center"
      >
        Choose a New Password
      </motion.h1>

      <p className="text-gray-800 mb-8 flex items-center gap-1">
        Almost there <Leaf className="w-5 h-5 text-green-500" />
      </p>

      {/* useSearchParams needs a Suspense boundary */}
      <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-green-600" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}

export default ResetPassword
