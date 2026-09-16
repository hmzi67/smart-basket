'use client'

import { Suspense, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

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
        {loading ? <Loader2 size={24} className="shrink-0 animate-spin" aria-hidden="true" /> : (
          <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6 shrink-0" aria-hidden="true" focusable="false">
            <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.8-1.76-5.59-4.13H3.07v2.59A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z" />
            <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.71 9.4 5.95 12 5.95Z" />
          </svg>
        )}
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
