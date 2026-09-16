"use client"
import { Leaf, Loader2, Mail } from 'lucide-react'
import React, { useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import axios from 'axios'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await axios.post('/api/auth/forgot-password', { email })
      setSent(true)
      setError('')
      return result
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not send the reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 bg-white">
      <motion.h1
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-extrabold text-green-700 mb-2 text-center"
      >
        Forgot Password
      </motion.h1>

      <p className="text-gray-800 mb-8 flex items-center gap-1 text-center">
        We will email you a reset link <Leaf className="w-5 h-5 text-green-500" />
      </p>

      {sent ? (
        <div className="w-full max-w-sm text-center">
          <p className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm">
            If that email has an account, a reset link is on its way. The link expires in one hour.
          </p>
          <p className="mt-3 text-sm text-gray-600">Check your inbox and spam folder. If you signed up with Google, this link lets you create a password for your existing account.</p>
          <button type="button" onClick={() => setSent(false)} className="mt-4 text-sm font-medium text-green-700">Try again or use another email</button>
          <Link href="/login" className="mt-6 inline-block text-green-600 font-medium">
            Back to login
          </Link>
        </div>
      ) : (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 w-full max-w-sm"
        >
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Your Email"
              className="w-full pr-4 py-3 pl-10 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
            disabled={!email || loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send reset link'}
          </button>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Link href="/login" className="text-center text-sm text-gray-600 mt-2">
            Back to login
          </Link>
        </motion.form>
      )}
    </div>
  )
}

export default ForgotPassword
