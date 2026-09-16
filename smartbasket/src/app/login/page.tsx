"use client"
import { EyeIcon, EyeOff, Leaf, Loader2, Lock, LogIn, Mail } from 'lucide-react'
import React, { useState } from 'react'
import { motion } from 'motion/react'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [error, setError] = useState('')
  useSession()

  const handleLogin = async (e:React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Login failed. Please check your credentials.')
      } else {
        setError('')
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const formValidation = email !== '' && password !== ''

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 bg-white relative">
      <motion.h1
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-extrabold text-green-700 mb-2"
      >
        Welcome Back
      </motion.h1>

      <p className="text-gray-800 mb-8 flex items-center gap-1">
        Login to SmartBasket <Leaf className="w-5 h-5 text-green-500" />
      </p>

      <motion.form
        onSubmit={handleLogin}
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
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Your Password"
            className="w-full pr-4 py-3 pl-10 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
          {showPassword ? (
            <EyeOff
              className="absolute right-3 top-3.5 w-5 h-5 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <EyeIcon
              className="absolute right-3 top-3.5 w-5 h-5 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(true)}
            />
          )}
        </div>



        <div className="flex justify-end -mt-2">
          <Link href="/forgot-password" className="text-sm text-green-700 hover:text-green-800 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300" 
          disabled={!formValidation || loading}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Login'}
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-gray-300" />
          <span className="relative bg-white px-3 text-sm font-medium text-gray-400">OR</span>
        </div>

        <GoogleSignInButton />
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </motion.form>

      <p className="cursor-pointer mt-6 text-gray-600 text-sm flex items-center gap-1" onClick={() => router.push('/register')}>
        Do not have an account?
        <LogIn className="w-4 h-4" />
        <span className="text-green-600">Sign Up</span>
      </p>
    </div>
  )
}

export default Login
