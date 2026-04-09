---
phase: 15-project-scaffold-design-system
plan: 02
subsystem: web-frontend
tags: [layout, components, sidebar, topbar, appshell, auth-layout]
dependency_graph:
  requires: [15-01]
  provides: [AppShell, AuthLayout, Sidebar, TopBar]
  affects: [15-03]
tech_stack:
  added: []
  patterns: [client-components, barrel-exports, usePathname-active-detection]
key_files:
  created:
    - web/src/components/layout/Sidebar.tsx
    - web/src/components/layout/TopBar.tsx
    - web/src/components/layout/AppShell.tsx
    - web/src/components/layout/AuthLayout.tsx
    - web/src/components/layout/index.ts
  modified: []
decisions:
  - Used usePathname() for active route detection with optional activeRoute prop override
  - Placeholder avatar circle instead of image for user profile (no auth system yet)
  - Credits display hardcoded to "1,240" matching Stitch reference (will be dynamic later)
metrics:
  duration: 145s
  completed: 2026-04-09T22:09:40Z
  tasks: 2
  files: 5
---

# Phase 15 Plan 02: Layout Components Summary

Four layout components (Sidebar, TopBar, AppShell, AuthLayout) matching Stitch HTML reference screens, providing the two layout wrappers needed by all routes in Plan 15-03.

## What Was Built

### Task 1: Sidebar and TopBar
- **Sidebar** (`web/src/components/layout/Sidebar.tsx`): Fixed w-64 sidebar with NeuroCut branding, 5 nav items (Dashboard, Upload, Processing, Results, Settings) with active state detection via `usePathname()`, neural-gradient "New Analysis" CTA, and user profile placeholder.
- **TopBar** (`web/src/components/layout/TopBar.tsx`): Fixed h-16 header spanning `calc(100% - 16rem)`, with configurable left side (search input, back arrow, or title), credits badge, notification/help icons, upgrade button, and avatar placeholder.
- Commit: `fcb133c`

### Task 2: AppShell, AuthLayout, and Barrel Export
- **AppShell** (`web/src/components/layout/AppShell.tsx`): Wraps authenticated pages with Sidebar + TopBar. Main content at `ml-64 pt-16` with `max-w-7xl` constraint.
- **AuthLayout** (`web/src/components/layout/AuthLayout.tsx`): Full-screen centered layout with decorative neural gradient blobs, NeuroCut branding anchor (psychology icon + title), configurable max-width (default 420px).
- **Barrel export** (`web/src/components/layout/index.ts`): Exports all 4 components.
- Commit: `f7110c1`

## Verification

- `npm run build` completes successfully with zero TypeScript errors
- All layout dimensions match Stitch reference (w-64 sidebar, h-16 topbar, ml-64 pt-16 content)
- Neural gradient blobs, glass surfaces, and ambient glow utilities from Plan 15-01 are used correctly

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **usePathname for active detection**: Sidebar uses Next.js `usePathname()` hook as primary active route detection, with optional `activeRoute` prop as override for flexibility.
2. **Placeholder avatar**: User profile shows a solid circle instead of an image since auth is not yet implemented.
3. **Static credits**: TopBar credits badge shows "1,240" matching the Stitch reference; will be made dynamic when backend is wired.

## Self-Check: PASSED

- All 5 created files verified present on disk
- Both task commits (fcb133c, f7110c1) verified in git log
- `npm run build` passes with zero errors
