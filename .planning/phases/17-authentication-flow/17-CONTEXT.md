# Phase 17: Authentication Flow - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped — autonomous mode)

<domain>
## Phase Boundary

Implement the auth screens (login, signup, onboarding welcome) and wire them to Supabase Auth. Add route protection middleware and session persistence. Screens must match Stitch HTML reference.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Use Stitch HTML as pixel-perfect reference.

Key technical decisions:
- Supabase Auth with email/password (already set up in Phase 16)
- Server actions for auth forms (Next.js App Router pattern)
- Middleware protects (app) routes, redirects to /login
- After signup → redirect to /welcome (onboarding)
- After login → redirect to /dashboard

Stitch reference screens:
- /Users/deeg/Downloads/stitch_neurocut_ui_brief2/login/code.html
- /Users/deeg/Downloads/stitch_neurocut_ui_brief2/sign_up/code.html
- /Users/deeg/Downloads/stitch_neurocut_ui_brief2/welcome_onboarding/code.html

</decisions>

<code_context>
## Existing Code Insights

- web/src/app/(auth)/login/page.tsx — stub exists
- web/src/app/(auth)/signup/page.tsx — stub exists
- web/src/app/(auth)/welcome/page.tsx — stub exists
- web/src/components/layout/AuthLayout.tsx — full-screen centered layout wrapper
- web/src/lib/supabase/ — client.ts, server.ts, middleware.ts
- web/middleware.ts — session refresh middleware
- web/src/components/ui/ — Button, Input, Card components ready

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond matching Stitch screens and using Supabase Auth.

</specifics>

<deferred>
## Deferred Ideas

- OAuth (Google, GitHub) — email/password only for v2.0
- Forgot password flow — deferred

</deferred>
