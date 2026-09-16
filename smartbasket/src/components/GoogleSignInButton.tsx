'use client'

import { Suspense, useRef, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import googleIcon from '@/assets/google.png'

const messages: Record<string, string> = {
  AccessDenied: 'Sign-in was not allowed. Try again or contact support if your account is disabled.',
  OAuthAccountNotLinked: 'This email already has an account. Sign in using your original method.',
  Configuration: 'Google sign-in is unavailable because of a server configuration problem. Please contact support.',
  MissingCSRF: 'Your sign-in request expired. Refresh this page and try again.',
  OAuthCallbackError: 'Google sign-in could not be completed. Please try again.',
  OAuthSignInError: 'Could not connect to Google. Please try again.',
  CallbackRouteError: 'Could not finish setting up your account. Please try again.',
}

function GoogleSignInContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  const returnedError = searchParams.get('error')
  const message = error || (returnedError
    ? messages[returnedError] || 'Sign-in could not be completed. Please try again.'
    : '')

  async function handleSignIn() {
    if (pending.current) return
    pending.current = true
    setLoading(true)
    setError('')
    try {
      // Use a fixed destination: the default is the current login/register page.
      const result = await signIn('google', { redirect: false, redirectTo: '/' })
      if (!result?.ok || result.error || !result.url) {
        setError(messages[result?.error ?? ''] || 'Could not start Google sign-in. Please try again.')
        pending.current = false
        setLoading(false)
        return
      }
      window.location.assign(result.url)
    } catch {
      setError('Could not connect to Google sign-in. Check your connection and try again.')
      pending.current = false
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <button type="button" onClick={handleSignIn} disabled={loading} aria-busy={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 disabled:cursor-wait disabled:opacity-70">
        {loading ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <Image src={googleIcon} width={20} height={20} alt="" className="h-5 w-5 object-contain" />}
        {loading ? 'Connecting to Google…' : 'Continue with Google'}
      </button>
      {message && <p role="alert" className="mt-3 text-sm text-red-600">{message}</p>}
    </div>
  )
}

export default function GoogleSignInButton() {
  return (
    <Suspense fallback={<button type="button" disabled className="w-full max-w-sm rounded-xl border border-gray-300 px-4 py-3 text-gray-500">Loading Google sign-in…</button>}>
      <GoogleSignInContent />
    </Suspense>
  )
}
