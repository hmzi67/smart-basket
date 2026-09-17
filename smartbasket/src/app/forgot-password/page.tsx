"use client"
import { ArrowLeft, ArrowRight, Check, Clock3, KeyRound, Leaf, Loader2, Mail, MailCheck } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const previousSent = useRef(sent)

  useEffect(() => {
    if (previousSent.current !== sent) {
      if (sent) headingRef.current?.focus()
      else emailRef.current?.focus()
      previousSent.current = sent
    }
  }, [sent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      await axios.post('/api/auth/forgot-password', { email: email.trim() })
      setSent(true)
    } catch (err: unknown) {
      setError(
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        'Could not send the reset email. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[#f6f9f5] px-4 py-10 text-slate-900 sm:px-6">
      <Link href="/" aria-label="SmartBasket home" className="mb-8 inline-flex items-center gap-2.5 rounded-lg text-xl font-bold tracking-tight text-green-900 outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-green-700 text-white">
          <Leaf aria-hidden="true" className="size-5" />
        </span>
        SmartBasket
      </Link>

      <section aria-labelledby="reset-heading" className="w-full max-w-md overflow-hidden rounded-3xl border border-green-950/10 bg-white shadow-[0_16px_60px_-24px_rgba(20,83,45,0.22)]">
        <div className="px-6 pb-7 pt-8 sm:px-9 sm:pt-10">
          <div className="relative mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-green-100 bg-green-50 text-green-700">
            {sent ? <MailCheck aria-hidden="true" className="size-8" strokeWidth={1.6} /> : <KeyRound aria-hidden="true" className="size-8" strokeWidth={1.6} />}
            {sent && (
              <span className="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border-[3px] border-white bg-green-700 text-white">
                <Check aria-hidden="true" className="size-3" strokeWidth={3} />
              </span>
            )}
          </div>

          <h1 id="reset-heading" ref={headingRef} tabIndex={-1} className="text-center text-3xl font-bold tracking-tight text-green-950 outline-none">
            {sent ? 'Check your inbox' : 'Forgot password?'}
          </h1>
          <p className="mt-3 text-center text-sm leading-6 text-slate-500">
            {sent ? 'You’re one step closer to getting back in.' : 'Enter your email and we’ll send you a link to reset your password.'}
          </p>

          {sent ? (
            <div className="mt-7">
              <div className="rounded-2xl border border-green-100 bg-green-50/80 p-5 text-center">
                <p className="text-sm leading-6 text-green-900">
                  If an account exists for <span className="font-semibold [overflow-wrap:anywhere]">{email.trim()}</span>, a password reset link is on its way.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 border-t border-green-200/70 pt-3 text-xs font-medium text-green-800">
                  <Clock3 aria-hidden="true" className="size-3.5 shrink-0" />
                  The link expires in 1 hour
                </div>
              </div>

              <div className="mt-6 text-center text-sm leading-6">
                <p className="font-semibold text-slate-700">Don’t see the email?</p>
                <p className="mt-1 text-slate-500">Check your spam or junk folder, or try again with another email address.</p>
              </div>

              <button type="button" onClick={() => setSent(false)} className="mt-6 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700">
                Try again or use another email
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7" aria-busy={loading}>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
              <div className="relative">
                <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-4 size-5 text-slate-400" />
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="min-h-13 w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-12 pr-4 text-base text-slate-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-3 focus:ring-green-100 disabled:opacity-60"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  disabled={loading}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'reset-error' : undefined}
                  required
                />
              </div>
              {error && <p id="reset-error" role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button type="submit" className="mt-5 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={!email.trim() || loading}>
                {loading ? <><Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />Sending reset link…</> : <>Send reset link<ArrowRight aria-hidden="true" className="size-4" /></>}
              </button>
            </form>
          )}

          <Link href="/login" className="mx-auto mt-5 flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:text-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to login
          </Link>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-5 text-center sm:px-9">
          <p className="text-xs leading-5 text-slate-500">
            <span className="font-medium text-slate-700">Signed up with Google?</span> You can also use this link to create a password for your existing account.
          </p>
        </div>
      </section>
    </main>
  )
}

export default ForgotPassword
