'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleResend() {
    if (!email || resending) return
    setResending(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (error) throw error
      setResent(true)
      setTimeout(() => setResent(false), 60000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <img
          src="/illustrations/logo-icon.png"
          alt=""
          className="w-[80vmin] h-[80vmin] object-contain opacity-[0.04]"
        />
      </div>
      <main className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant">
            mail
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Check your email
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            We sent a confirmation link to{' '}
            <strong className="text-on-surface">{email}</strong>.
            Click the link to verify your account and get started.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <button
            onClick={handleResend}
            disabled={resending || resent}
            className="w-full py-3 rounded-xl font-semibold text-sm border border-outline-variant/30 text-on-surface hover:bg-surface-container-lowest disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {resending ? 'Sending...' : resent ? 'Email resent' : 'Resend confirmation email'}
          </button>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <Link
            href="/signup"
            className="block text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Use a different email
          </Link>
        </div>
        </div>
      </main>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={null}>
      <CheckEmailContent />
    </Suspense>
  )
}
