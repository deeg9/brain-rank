---
phase: 17-authentication-flow
plan: 02
subsystem: auth-middleware-onboarding
tags: [middleware, route-protection, onboarding, welcome-page]
dependency_graph:
  requires: [16-01]
  provides: [route-protection, onboarding-welcome]
  affects: [web/middleware.ts, web/src/lib/supabase/middleware.ts, web/src/app/welcome/page.tsx]
tech_stack:
  added: []
  patterns: [supabase-getUser-validation, route-redirect-middleware]
key_files:
  created:
    - web/src/app/welcome/page.tsx
  modified:
    - web/src/lib/supabase/middleware.ts
    - web/src/app/(auth)/welcome/page.tsx
decisions:
  - Moved welcome page out of (auth) group to avoid AuthLayout narrow constraint
  - Used getUser() instead of getSession() for server-side session validation (T-17-05)
  - Gradient placeholder in hero area instead of external image URL
metrics:
  duration: 79s
  completed: 2026-04-09T22:32:30Z
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 17 Plan 02: Route Protection & Onboarding Welcome Summary

Middleware route protection with getUser() validation and full-width onboarding welcome page matching Stitch reference.

## What Was Done

### Task 1: Add route protection redirects to middleware
- Updated `web/src/lib/supabase/middleware.ts` to add redirect logic after `getUser()` call
- Unauthenticated users on protected routes redirect to `/login`
- Authenticated users on `/login` or `/signup` redirect to `/dashboard`
- `/welcome` protected from unauthenticated access (redirects to `/login`)
- Uses `getUser()` for server-side validation per threat model T-17-05
- **Commit:** `ccdfd58`

### Task 2: Build onboarding welcome page from Stitch reference
- Created standalone `web/src/app/welcome/page.tsx` outside `(auth)` group for full-width layout (max-w-4xl)
- Hero area with gradient background, play_circle icon overlay, glass-surface panel with "Neural Processing Active"
- Headline: "Welcome to NeuroCut" with subtitle about predicting viral engagement
- CTA: Button with upload icon linking to `/upload`
- Step indicator: 4 dots (first active at w-8, rest inactive at w-1.5)
- Skip link in header linking to `/dashboard`
- Footer with version info and security icons
- Decorative background blur blobs matching neural theme
- Old `(auth)/welcome/page.tsx` now redirects to `/welcome`
- **Commit:** `bd754f6`

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Welcome page location:** Moved to `web/src/app/welcome/page.tsx` (outside auth group) to avoid AuthLayout's max-w-[420px] constraint. The welcome page needs max-w-4xl for the hero area.
2. **Hero image:** Used gradient placeholder (`bg-gradient-to-br from-primary/10 via-surface-container to-secondary/10`) instead of external Google image URL from Stitch reference.
3. **Session validation:** Used `getUser()` (server-side, verifies with Supabase) instead of `getSession()` (trusts JWT without verification) per threat model requirement T-17-05.

## Verification

- TypeScript compiles with no new errors (pre-existing @supabase/ssr type errors from missing local install are unchanged)
- Middleware contains `publicRoutes`, `NextResponse.redirect`, `/login`, `/dashboard`, `getUser` references
- Welcome page exists at `web/src/app/welcome/page.tsx` with all Stitch elements
- Old `(auth)/welcome` redirects to new `/welcome` path

## Self-Check: PASSED
