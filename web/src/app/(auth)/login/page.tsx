'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import { login } from './actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prevState: { error: string } | null, formData: FormData) => {
      return await login(formData)
    },
    null
  )

  return (
    <div className="bg-surface-container-high rounded-xl p-8 ghost-border ambient-glow flex flex-col gap-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="font-headline font-bold text-4xl text-on-surface tracking-tight">
          Welcome back
        </h1>
        <p className="text-on-surface-variant font-body text-sm">
          Sign in to your account to continue
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

        {/* Password with Forgot Password link */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant ml-1">
              Password
            </label>
            <span className="text-xs font-semibold text-primary hover:text-primary-dim transition-colors cursor-pointer">
              Forgot password?
            </span>
          </div>
          <Input
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="pt-2">
          <Button variant="primary" size="lg" type="submit" loading={pending}>
            <span>Sign In</span>
            <span className="material-symbols-outlined text-xl">
              arrow_forward
            </span>
          </Button>
        </div>
      </form>

      {/* Footer */}
      <footer className="text-center">
        <p className="text-on-surface-variant text-sm">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-primary font-bold hover:underline transition-all"
          >
            Sign up
          </Link>
        </p>
      </footer>
    </div>
  )
}
