---
phase: quick
plan: 260409-sfh
type: execute
wave: 1
depends_on: []
files_modified:
  - web/src/app/(auth)/forgot-password/page.tsx
  - web/src/app/(auth)/forgot-password/actions.ts
  - web/src/app/(auth)/login/page.tsx
autonomous: true
requirements: []
---

<objective>
Create Forgot Password page with Supabase resetPasswordForEmail and wire Login page's "Forgot password?" link.
</objective>

<context>
Pattern source: web/src/app/(auth)/login/page.tsx and login/actions.ts
Auth layout: web/src/app/(auth)/layout.tsx wraps with AuthLayout (centered card container)
Supabase client: @/lib/supabase/server createClient()
UI components: @/components/ui Button, Input
Design: ghost-border, ambient-glow, surface-container-high card, neural-gradient CTA
Stitch reference screen ID: e25ffb9796d7444ba30d2966e81fb6c9
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create forgot-password server action</name>
  <files>web/src/app/(auth)/forgot-password/actions.ts</files>
  <action>
Create web/src/app/(auth)/forgot-password/actions.ts:
- 'use server'
- Import createClient from @/lib/supabase/server
- Export async function forgotPassword(formData: FormData)
- Extract email from formData
- Call supabase.auth.resetPasswordForEmail(email)
- On error: return { error: error.message }
- On success: return { success: true }
- Do NOT redirect — the page shows a success message inline
  </action>
  <verify>File exists with correct Supabase call</verify>
  <done>Server action created</done>
</task>

<task type="auto">
  <name>Task 2: Create forgot-password page</name>
  <files>web/src/app/(auth)/forgot-password/page.tsx</files>
  <action>
Create web/src/app/(auth)/forgot-password/page.tsx following Login page pattern:
- 'use client'
- useActionState hook wrapping forgotPassword action
- Same card styling: bg-surface-container-high rounded-xl p-8 ghost-border ambient-glow
- Header: "Reset your password" (h1), "Enter your email and we'll send you a reset link" (p)
- Form with single Email input (same Input component as Login)
- "Send Reset Link" Button with neural-gradient, mail icon
- Error state: show state.error inline (same pattern as Login)
- Success state: when state.success is true, show confirmation card with:
  - check_circle icon (material symbols)
  - "Check your email" heading
  - "We've sent a password reset link to your email address" description
  - "Back to Sign In" link
- Footer: "Remember your password?" + Link to /login
- Below form: Link to /login with arrow_back icon + "Back to Sign In"
  </action>
  <verify>Page renders, matches auth layout pattern</verify>
  <done>Forgot password page created with both form and success states</done>
</task>

<task type="auto">
  <name>Task 3: Wire Login page "Forgot password?" link</name>
  <files>web/src/app/(auth)/login/page.tsx</files>
  <action>
In web/src/app/(auth)/login/page.tsx:
- Change the span "Forgot password?" (line ~48-49) to a Link component
- Import Link from next/link (already imported)
- href="/forgot-password"
- Keep same styling classes
  </action>
  <verify>"Forgot password?" is now a clickable Link pointing to /forgot-password</verify>
  <done>Login page wired to forgot password</done>
</task>

</tasks>
