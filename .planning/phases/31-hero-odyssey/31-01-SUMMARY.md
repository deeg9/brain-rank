---
phase: 31-hero-odyssey
plan: 01
subsystem: web-frontend
tags: [webgl, shader, hero, animation, framer-motion]
dependency_graph:
  requires: []
  provides: [lightning-shader, hero-odyssey, welcome-page-redesign]
  affects: [web/src/app/welcome/page.tsx]
tech_stack:
  added: [WebGL2 fragment shader, framer-motion animations]
  patterns: [FBM lightning shader, WebGL fallback detection, auth-aware CTA routing]
key_files:
  created:
    - web/src/components/hero/LightningShader.tsx
    - web/src/components/hero/HeroOdyssey.tsx
  modified:
    - web/src/app/welcome/page.tsx
decisions:
  - Used WebGL2 with automatic fallback to static gradient for unsupported browsers
  - Capped devicePixelRatio at 2 to prevent GPU strain on high-DPI displays
  - Default CTA to /signup while auth state loads (safe fallback)
metrics:
  duration: 137s
  completed: 2026-04-10T16:37:29Z
  tasks: 2/2
  files_created: 2
  files_modified: 1
---

# Phase 31 Plan 01: WebGL Lightning Shader Hero Section Summary

WebGL2 FBM lightning shader with purple/cyan NeuroCut palette, composited under Framer Motion staggered hero content with auth-aware CTA routing.

## Task Results

### Task 1: Create LightningShader WebGL component
- **Commit:** 530c753
- **Files:** web/src/components/hero/LightningShader.tsx (286 lines)
- **Result:** Full-screen WebGL2 canvas rendering fractal Brownian motion lightning with 6-octave FBM noise, three lightning bolt paths, HSV-to-RGB coloring at purple hue (0.75) with cyan accent. Includes ResizeObserver for responsive canvas sizing, devicePixelRatio capped at 2, and proper cleanup (cancel RAF, delete GL resources, lose context). Static radial gradient fallback when WebGL is unavailable.

### Task 2: Create HeroOdyssey section and integrate into welcome page
- **Commit:** cf5f14c
- **Files:** web/src/components/hero/HeroOdyssey.tsx (140 lines), web/src/app/welcome/page.tsx (5 lines)
- **Result:** HeroOdyssey composes LightningShader as absolute-positioned background with gradient overlay for text readability. Content overlay includes NeuroCut logo + Login link header, "See What Brains See" headline, value proposition subheadline, "Analyze Your Video" CTA with purple glow shadow, and four feature pills. Framer Motion fade-up animations staggered at 0.0/0.2/0.4/0.6s delays. CTA checks Supabase auth state on mount: routes to /upload if authenticated, /signup if not. Welcome page simplified to single HeroOdyssey render.

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all components are fully wired with real data sources (Supabase auth for CTA routing, WebGL for shader).

## Verification

- TypeScript compilation: No errors in LightningShader.tsx, HeroOdyssey.tsx, or welcome/page.tsx (pre-existing errors in unrelated files only)
- LightningShader exports client component with WebGL canvas + fallback
- HeroOdyssey imports LightningShader, uses Framer Motion, checks auth state
- Welcome page imports and renders HeroOdyssey as sole content

## Self-Check: PASSED

- All 3 created/modified files exist on disk
- Both task commits (530c753, cf5f14c) found in git log
