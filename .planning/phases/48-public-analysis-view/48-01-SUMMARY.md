---
phase: 48-public-analysis-view
plan: 01
subsystem: web-frontend
tags: [public-view, brain-viewer, seo, server-component]
dependency_graph:
  requires: [profiles-table, is_public-flag, jobs-table]
  provides: [public-analysis-page, /analysis/[id]-route]
  affects: [discovery-feed, public-profile]
tech_stack:
  added: []
  patterns: [server-component-data-fetching, dynamic-imports, generateMetadata]
key_files:
  created:
    - web/src/app/analysis/[id]/page.tsx
    - web/src/app/analysis/[id]/PublicAnalysisClient.tsx
  modified:
    - web/src/lib/database.types.ts
    - web/src/components/results/MetricInfo.tsx
decisions:
  - Used type casting for Supabase query results rather than modifying all existing API routes
  - Removed CircumplexChart inline prop (not available in worktree branch version)
metrics:
  duration: 330s
  completed: "2026-04-11"
  tasks: 2
  files: 4
---

# Phase 48 Plan 01: Public Analysis View Summary

Public analysis page at /analysis/[id] with server-side data fetching, SEO metadata, and interactive brain viewer with metrics -- accessible without authentication.

## What Was Built

### Task 1: Server Component with Data Fetching and SEO Metadata
- **Commit:** bc322f6
- Created `web/src/app/analysis/[id]/page.tsx` as async server component
- `generateMetadata` function returns dynamic title and description with overall activation score
- Queries `jobs` table with `is_public=true` AND `status=completed` (defense-in-depth per T-48-01)
- Fetches creator profile and renders `by @{username}` linked to `/u/{username}`
- Calls `notFound()` for private, incomplete, or non-existent jobs (T-48-04)
- Computes benchmark zones, icon markers, and peak markers for timeline
- Updated `database.types.ts` to include `title`, `is_public`, `Profile`, and `profiles` table types

### Task 2: Client Component with Brain Viewer, Timeline, and Metrics
- **Commit:** eeedff8
- Created `web/src/app/analysis/[id]/PublicAnalysisClient.tsx` as `"use client"` component
- Dynamic imports for BrainViewer, NeuralTimeline, CircumplexChart (SSR disabled)
- Timeline scrubbing updates brain viewer activation via `currentTimeRef`
- Full insights summary card with Hook Strength, Retention, Peak Moment, Arousal, Valence
- MetricInfo tooltip popups for each metric
- Staggered grid layout matching results page design
- Read-only mode: no video player, no export button, no visibility toggle

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated database.types.ts in worktree**
- **Found during:** Task 1
- **Issue:** Worktree branch was based on older commit missing `title`, `is_public` fields on Job, `Profile` interface, and `profiles` table in Database type
- **Fix:** Copied updated database.types.ts from main repo
- **Files modified:** web/src/lib/database.types.ts

**2. [Rule 3 - Blocking] Added MetricInfo component to worktree**
- **Found during:** Task 2
- **Issue:** MetricInfo.tsx didn't exist in worktree branch (added in later commit on main)
- **Fix:** Copied from main repo and fixed useRef initialization for TypeScript compatibility
- **Files modified:** web/src/components/results/MetricInfo.tsx

**3. [Rule 1 - Bug] Removed inline prop from CircumplexChart**
- **Found during:** Task 2
- **Issue:** CircumplexChart in worktree doesn't have `inline` prop (added in later main commit)
- **Fix:** Removed `inline` prop usage -- component renders correctly without it
- **Files modified:** web/src/app/analysis/[id]/PublicAnalysisClient.tsx

## Threat Model Compliance

| Threat ID | Status | Implementation |
|-----------|--------|----------------|
| T-48-01 | Mitigated | Server query filters `is_public=true` AND `status=completed` |
| T-48-02 | Accepted | video_url in results data (user opted into public) |
| T-48-03 | Accepted | Client-side 3D rendering only |
| T-48-04 | Mitigated | `notFound()` for non-existent/non-public IDs, no existence leakage |

## Known Stubs

None -- all data is wired from server-side Supabase queries through to client component props.

## Self-Check: PASSED
