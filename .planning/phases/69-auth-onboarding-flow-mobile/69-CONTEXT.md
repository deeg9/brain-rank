# Phase 69: Auth & Onboarding Flow Mobile — Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Mode:** Auto-generated (minimal discuss)

<domain>
## Phase Boundary

First-touch pages for mobile signups — `(auth)/login`, `(auth)/signup`, `(auth)/signup/check-email`, `(auth)/forgot-password`, `/welcome`, `/onboarding` — render cleanly on iPhone 15 without horizontal scroll, cramped gutters, or unreachable CTAs.
</domain>

<decisions>
### Strategy
- AuthLayout already uses `max-w-[420px]` centered with `p-6` outer gutters and animated bg logo — already responsive, no changes required
- Only minor gutter tuning on `/onboarding` (outer `p-6` → `p-4 md:p-6`, card `p-8` → `p-6 md:p-8`) to give breathing room on 390px viewport
- `/welcome` uses `HeroOdyssey` which already uses `px-6 md:px-8` — already responsive, no changes required
- No new components introduced

### Claude's Discretion
- All other layout decisions at Claude's discretion per auto-context.
</decisions>

<code_context>
### Reusable assets
- `web/src/components/layout/AuthLayout.tsx` — centered card with max-w-[420px], already mobile-friendly
- `web/src/components/ui/Input`, `Button`, `GoogleSignInButton` — already full-width
- `web/src/components/hero/HeroOdyssey.tsx` — already uses `px-6 md:px-8`

### Verified mobile-clean (screenshot evidence)
- `/login` at 390×844 — clean
- `/signup` at 390×844 — clean
- `/signup/check-email` at 390×844 — clean
- `/forgot-password` at 390×844 — clean
- `/welcome` at 390×844 — clean (some NextJS dev overlay noise ignored)
</code_context>

<specifics>
- Minimal intervention needed — most auth pages already responsive thanks to centered-card design with max-width constraints.
</specifics>

<deferred>
None.
</deferred>
