---
phase: 65-landing-page-foundation-hero
plan: 01
subsystem: landing-page
tags: [design-system, routing, brutalist, css-tokens, button-variant]
dependency_graph:
  requires: []
  provides: [data-landing-tokens, landing-button-variant, auth-gated-root-route]
  affects: [web/src/app/globals.css, web/src/components/ui/Button.tsx, web/src/app/page.tsx]
tech_stack:
  added: []
  patterns: [data-attribute-scoped-css-tokens, server-side-auth-redirect]
key_files:
  created: []
  modified:
    - web/src/app/globals.css
    - web/src/components/ui/Button.tsx
    - web/src/app/page.tsx
decisions:
  - "[data-landing] attribute selector placed after .dark blocks for CSS specificity cascade"
  - "Landing button variant uses hardcoded white colors (not token-based) for brutalist consistency"
metrics:
  duration: 43s
  completed: "2026-04-15T19:09:23Z"
---

# Phase 65 Plan 01: Foundation & Design Tokens Summary

Brutalist grayscale design token overrides via [data-landing] CSS scope, landing button variant, and auth-gated root route rendering HeroOdyssey on pure black background.

## What Was Done

### Task 1: Add [data-landing] CSS token overrides and landing button variant
- **Commit:** a0e0d3b
- **Files:** `web/src/app/globals.css`, `web/src/components/ui/Button.tsx`
- Added `[data-landing]` block to globals.css after the second `.dark` block, overriding all design tokens to grayscale values (surface #000000, on-surface #ffffff, primary #ffffff, etc.)
- Added `"landing"` variant to Button component: ghost/outline style with white border, transparent fill, hover invert to white fill + black text, active scale-down, focus outline for accessibility

### Task 2: Rewire root route to render landing page with auth redirect
- **Commit:** 83ae954
- **Files:** `web/src/app/page.tsx`
- Replaced unconditional `redirect("/dashboard")` with async server component
- Server-side Supabase auth check: authenticated users redirect to /dashboard, unauthenticated users see the landing page
- Landing page wrapped in `<div data-landing>` to activate grayscale token overrides

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all code is fully wired and functional.

## Self-Check: PASSED
