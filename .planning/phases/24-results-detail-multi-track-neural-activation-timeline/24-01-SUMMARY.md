---
phase: 24-results-detail-multi-track-neural-activation-timeline
plan: 01
subsystem: results-detail
tags: [recharts, visualization, timeline, neural-activation]
dependency_graph:
  requires: []
  provides: [NeuralTimeline-component, video-placeholder]
  affects: [results-detail-page]
tech_stack:
  added: [recharts]
  patterns: [syncId-cross-chart-sync, svg-gradient-fill, dynamic-import-ssr-false]
key_files:
  created:
    - web/src/components/results/NeuralTimeline.tsx
  modified:
    - web/package.json
    - web/package-lock.json
    - web/src/app/(app)/results/[id]/page.tsx
decisions:
  - Used ReactElement content prop pattern for Recharts Tooltip (passes lookup map via JSX element props instead of closure-based ComponentType)
  - Built lookup Map once in parent, passed to each SingleTrack to avoid recreating per-track
metrics:
  duration: 352s
  completed: "2026-04-10T03:58:17Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 4
---

# Phase 24 Plan 01: Multi-Track Neural Activation Timeline Summary

Recharts-based 4-track neural activation timeline with synchronized crosshair, gradient fills, video placeholder, and reordered Results Detail page layout.

## What Was Built

### NeuralTimeline Component (`web/src/components/results/NeuralTimeline.tsx`)

- 4 separate `<AreaChart>` instances stacked vertically (Attention, Reward, Emotional Processing, Social Cognition)
- Each track renders its designated color with SVG `<linearGradient>` fading to transparent at bottom
- Unique gradient IDs per track (`gradient-attention`, `gradient-reward`, `gradient-emotional`, `gradient-social`) to avoid SVG ID collisions
- `syncId="neural-timeline"` with `syncMethod="value"` on all 4 charts for shared crosshair
- Custom tooltip on first chart only showing all 4 region values + formatted timestamp; other 3 charts show cursor line but no popup
- Only bottom chart shows XAxis time labels via `hide={!isLast}`
- Track labels on left side in designated colors, chart area on right (~80px height per track)
- `isAnimationActive={false}` to prevent flash on mount

### Video Player Placeholder

- 16:9 aspect ratio dark placeholder (`surface-container-lowest`) with centered play icon and duration display
- Positioned above the neural timeline in the page layout

### Results Detail Page Layout Update

- Dynamic import with `ssr: false` for NeuralTimeline (prevents ResponsiveContainer hydration mismatch)
- New layout order: Back nav + filename + export -> Video Placeholder -> Neural Timeline -> Metric Cards -> Region Breakdown + Segment Table
- Updated loading skeleton to include placeholder sections for video and timeline

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Recharts Tooltip ContentType compatibility**
- **Found during:** Task 1
- **Issue:** Recharts `<Tooltip content>` prop expects `ReactElement | ((props: TooltipContentProps) => ReactNode)` but the plan's `makeTooltipContent` factory returned a `ComponentType` that didn't match. TypeScript rejected the assignment.
- **Fix:** Changed approach to pass a `<CustomTooltipContent>` JSX element with a `lookup` Map prop instead of a closure-based component factory. The lookup map is built once in the parent and passed down.
- **Files modified:** `web/src/components/results/NeuralTimeline.tsx`
- **Commit:** b029844

## Decisions Made

1. **Tooltip pattern:** Used JSX element content prop (`<CustomTooltipContent lookup={lookup} />`) instead of closure-based factory. Recharts merges `active` and `label` props into the element at render time, making this the type-safe approach.
2. **Lookup map:** Built once per render in the parent `NeuralTimeline` component and passed to `SingleTrack` as a prop, avoiding per-track reconstruction.

## Verification

- TypeScript: Zero errors in modified/created files (29 pre-existing Supabase type errors in unrelated files)
- Next.js build: Compiles successfully (Turbopack); build exits with pre-existing type error in `upload/actions.ts` unrelated to this plan
- ActivationTimeline component: Verified untouched (no git diff)

## Self-Check: PASSED

- [x] `web/src/components/results/NeuralTimeline.tsx` exists (FOUND)
- [x] `web/src/app/(app)/results/[id]/page.tsx` modified (FOUND)
- [x] Commit b029844 exists (FOUND)
- [x] Commit 1fa7d6b exists (FOUND)
- [x] recharts in web/package.json (FOUND)
