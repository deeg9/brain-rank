---
phase: 39-performance-foundation
plan: "02"
subsystem: video-sync
tags: [performance, requestVideoFrameCallback, react-hooks, ref-based-rendering]
dependency_graph:
  requires: []
  provides: [useVideoTime-hook, ref-based-brain-sync]
  affects: [results-page, brain-viewer]
tech_stack:
  added: []
  patterns: [requestVideoFrameCallback, ref-over-state, dual-frequency-sync]
key_files:
  created:
    - web/src/hooks/useVideoTime.ts
    - web/src/hooks/useVideoTime.test.ts
    - web/src/types/video-frame-callback.d.ts
  modified:
    - web/src/app/(app)/results/[id]/page.tsx
    - web/src/components/results/BrainViewer.tsx
decisions:
  - "Used dual-frequency pattern: ref at display refresh rate for BrainViewer, React state at ~4Hz for timeline/UI"
  - "Exported setupVideoTimeSync helper for testability since @testing-library/react not available"
metrics:
  duration: 220s
  completed: "2026-04-11T07:00:04Z"
  tasks_completed: 2
  tasks_total: 2
  test_count: 48
  test_pass: 48
---

# Phase 39 Plan 02: requestVideoFrameCallback Video Sync Summary

Replaced HTML onTimeUpdate (~4Hz) with requestVideoFrameCallback for frame-locked video-to-brain sync, using ref-based time flow to avoid 60fps React re-renders in BrainViewer.

## What Was Built

### useVideoTime Hook (`web/src/hooks/useVideoTime.ts`)
- Feature-detects `requestVideoFrameCallback` on the video element
- Falls back to `requestAnimationFrame` for unsupported browsers
- Calls a callback with `metadata.mediaTime` (rVFC) or `video.currentTime` (rAF)
- Uses `useRef` for the callback to avoid re-registering on every render
- Exports `setupVideoTimeSync` for unit testing without React rendering

### TypeScript Types (`web/src/types/video-frame-callback.d.ts`)
- Augments `HTMLVideoElement` with `requestVideoFrameCallback` and `cancelVideoFrameCallback`
- Declares `VideoFrameCallbackMetadata` interface with all standard fields

### Dual-Frequency Sync Pattern
- **High frequency (display refresh rate):** `useVideoTime` updates `currentTimeRef` -- BrainViewer reads from this ref
- **Low frequency (~4Hz):** HTML `onTimeUpdate` still fires, updating React state `currentTime` for NeuralTimeline, progress bar, arousal/valence display

### BrainViewer Ref Integration
- Changed props from `currentTime: number` to `currentTimeRef: React.RefObject<number>`
- Component reads `currentTimeRef.current` internally for region scores and vertex data lookup
- No 60fps re-renders -- BrainViewer only re-renders when parent re-renders from ~4Hz state updates

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create useVideoTime hook with TypeScript types and unit tests | f9d21c1 | useVideoTime.ts, useVideoTime.test.ts, video-frame-callback.d.ts |
| 2 | Wire useVideoTime into results page and update BrainViewer | d77cf85 | page.tsx, BrainViewer.tsx |

## Test Results

- 5 test files, 48 tests, all passing
- 5 new tests for useVideoTime (rVFC path, rAF fallback, cleanup for both paths, mediaTime callback)
- 43 existing tests unaffected

## Deviations from Plan

None -- plan executed exactly as written.

## Threat Flags

None found. All changes are client-side timing optimizations with no new network endpoints, auth paths, or trust boundaries.

## Known Stubs

None. All code paths are fully wired.

## Self-Check: PASSED

- All 5 created/modified files verified present
- Both commit hashes (f9d21c1, d77cf85) verified in git log
