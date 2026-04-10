'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import { forgotPassword } from './actions'

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    async (
      _prevState: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      return await forgotPassword(formData)
    },
    null
  )

  return (
    <div className="bg-surface-container-high rounded-xl p-8 ghost-border ambient-glow flex flex-col gap-8">
      {state?.success ? (
        <>
          {/* Success State */}
          <div className="flex flex-col items-center gap-4 py-4">
            <span className="material-symbols-outlined text-5xl text-primary">
              check_circle
            </span>
            <header className="space-y-2 text-center">
              <h1 className="font-headline font-bold text-4xl text-on-surface tracking-tight">
                Check your email
              </h1>
              <p className="text-on-surface-variant font-body text-sm">
                We&apos;ve sent a password reset link to your email address.
              </p>
            </header>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-2 text-primary font-bold hover:underline transition-all"
            >
              <span className="material-symbols-outlined text-xl">
                arrow_back
              </span>
              Back to Sign In
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <header className="space-y-2">
            <h1 className="font-headline font-bold text-4xl text-on-surface tracking-tight">
              Reset your password
            </h1>
            <p className="text-on-surface-variant font-body text-sm">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </header>

          {/* Form */}
          <form action={formAction} className="space-y-6">
            {state?.error && (
              <p className="text-error text-sm text-center">{state.error}</p>
            )}

            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="name@company.com"
              required
            />

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                type="submit"
                loading={pending}
              >
                <span>Send Reset Link</span>
                <span className="material-symbols-outlined text-xl">mail</span>
              </Button>
            </div>
          </form>

          {/* Footer */}
          <footer className="text-center">
            <p className="text-on-surface-variant text-sm">
              Remember your password?{' '}
              <Link
                href="/login"
                className="text-primary font-bold hover:underline transition-all"
              >
                Sign in
              </Link>
            </p>
          </footer>
        </>
      )}
    </div>
  )
}
