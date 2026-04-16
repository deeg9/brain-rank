'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { signup } from './actions'

function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const
  const colors = [
    '',
    'bg-error',
    'bg-[#f59e0b]',
    'bg-[#eab308]',
    'bg-tertiary-container',
  ] as const
  const textColors = [
    '',
    'text-error',
    'text-[#b45309]',
    'text-[#a16207]',
    'text-[#15803d]',
  ] as const

  return { score, label: labels[score], color: colors[score], textColor: textColors[score] }
}

export default function SignupPage() {
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [state, formAction, pending] = useActionState(
    async (_prevState: { error: string } | null, formData: FormData) => {
      const pw = formData.get('password') as string
      const confirm = formData.get('confirm-password') as string
      if (pw !== confirm) {
        return { error: 'Passwords do not match' }
      }
      return await signup(formData)
    },
    null
  )

  const strength = getPasswordStrength(password)

  return (
    <div className="bg-surface-container-high rounded-xl p-10 ambient-glow">
      <div className="mb-8 text-center">
        <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-2">
          Create your account
        </h1>
        <p className="text-on-surface-variant text-sm">
          Join the next generation of neural content editors.
        </p>
      </div>

      {/* Google OAuth */}
      <GoogleSignInButton />

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-outline-variant/20" />
        <span className="text-xs text-on-surface-variant uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-outline-variant/20" />
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

        <div>
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password.length > 0 && (
            <div className="mt-2 ml-1">
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i < strength.score
                        ? strength.color
                        : 'bg-surface-container-lowest'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs mt-1 ${strength.textColor}`}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          name="confirm-password"
          placeholder="••••••••"
          required
        />

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-5 w-5 rounded bg-surface-container-lowest peer-checked:bg-black transition-colors duration-200 flex items-center justify-center">
              {termsAccepted && (
                <svg
                  className="h-3.5 w-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-on-surface-variant leading-snug">
            I agree to the{' '}
            <Link href="/terms" className="text-on-surface font-semibold hover:text-on-surface/70 transition-colors underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-on-surface font-semibold hover:text-on-surface/70 transition-colors underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        <Button
          variant="primary"
          size="lg"
          type="submit"
          loading={pending}
          disabled={!termsAccepted}
          className={!termsAccepted ? 'opacity-50 cursor-not-allowed' : ''}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-8 pt-8 border-t border-outline-variant/10 text-center">
        <p className="text-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-on-surface font-semibold hover:text-on-surface/70 transition-colors underline ml-1"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
