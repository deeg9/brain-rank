'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import { signup } from './actions'

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(
    async (_prevState: { error: string } | null, formData: FormData) => {
      const password = formData.get('password') as string
      const confirm = formData.get('confirm-password') as string
      if (password !== confirm) {
        return { error: 'Passwords do not match' }
      }
      return await signup(formData)
    },
    null
  )

  return (
    <div className="bg-surface-container-high rounded-xl p-10 ambient-glow">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-2">
          Create your account
        </h1>
        <p className="text-on-surface-variant text-sm">
          Join the next generation of neural content editors.
        </p>
      </div>

      <form action={formAction} className="space-y-8">
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

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirm-password"
          placeholder="••••••••"
          required
        />

        <Button variant="primary" size="lg" type="submit" loading={pending}>
          Create Account
        </Button>
      </form>

      <div className="mt-8 pt-8 border-t border-outline-variant/10 text-center">
        <p className="text-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary font-semibold hover:text-primary-fixed transition-colors ml-1"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
