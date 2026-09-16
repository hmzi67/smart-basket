import { ArrowLeft, EyeIcon, EyeOff, Leaf, Loader2, Lock, LogIn, Mail, User } from 'lucide-react'
import React, { useState } from 'react'
import { useRouter } from "next/navigation";
import { motion } from 'motion/react'
import GoogleSignInButton from './GoogleSignInButton'
import axios from 'axios'
import Link from 'next/link'

type propType = {
  previousStep?: (s: number) => void
}

function RegisterForm({ previousStep }: propType) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter();
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post('/api/auth/register', {
        name,
        email,
        password,
      })
      router.push("/login")
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
      setError('Registration failed. Please try again.')
    }
  }
  const formValidation = name !== '' && email !== '' && password !== ''

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 bg-white relative">
      <div
        className="absolute top-6 left-6 flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors cursor-pointer"
        onClick={() => previousStep?.(1)}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back</span>
      </div>

      <motion.h1
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-extrabold text-green-700 mb-2"
      >
        Create Account
      </motion.h1>

      <p className="text-gray-800 mb-8 flex items-center gap-1">
        Join SmartBasket today <Leaf className="w-5 h-5 text-green-500" />
      </p>

      <motion.form
      onSubmit={handleRegister}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <div className="relative">
          <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Your Name"
            className="w-full pr-4 py-3 pl-10 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
        </div>

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

        <button
          type="submit"
          className="w-full rounded-xl bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
          disabled={!formValidation || loading}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Register'}
        </button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-gray-300" />
          <span className="relative bg-white px-3 text-sm font-medium text-gray-400">OR</span>
        </div>

      </motion.form>
      <GoogleSignInButton />
      <p className=" cursor-pointer mt-6 text-gray-600 text-sm flex items-center gap-1">
        Already have an account?
        <LogIn className="w-4 h-4" /> 
       <Link href="/login" className="text-green-600 hover:underline">Sign in</Link>
      </p>
    </div>
  )
}

export default RegisterForm