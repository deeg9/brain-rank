---
phase: 43-timeline-peak-markers
plan: 01
subsystem: web-frontend
tags: [peak-detection, neural-timeline, ux]
dependency_graph:
  requires: [SegmentData, NeuralTimeline, results-page]
  provides: [findPeaks, PeakMarker, REGION_LABELS, peak-markers-ui]
  affects: [results-page, neural-timeline]
tech_stack:
  added: []
  patterns: [pure-utility-with-tests, css-only-tooltips, pointer-events-layering]
key_files:
  created:
    - web/src/lib/peak-detection.ts
    - web/src/lib/peak-detection.test.ts
  modified:
    - web/src/components/results/NeuralTimeline.tsx
    - web/src/app/(app)/results/[id]/page.tsx
decisions:
  - "Used DEFAULT_THRESHOLD=0.3 defined locally instead of importing from colormap.ts (file does not exist in codebase)"
  - "REGION_LABELS covers 4 regions matching actual SegmentRegionScores interface (not 9 as plan suggested)"
metrics:
  duration: ~3min
  completed: "2026-04-11T08:12:00Z"
  tasks: 2/2
  files_created: 2
  files_modified: 2
  tests: 11 passed
---

# Phase 43 Plan 01: Timeline Peak Markers Summary

Peak detection utility identifies top 3-5 activation peaks from segment data using threshold filtering, descending sort, and adjacent-index deduplication; amber diamond markers render on NeuralTimeline with CSS-only hover tooltips showing timestamp, activation percentage, and dominant brain region.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Peak detection utility with tests (TDD) | 2aabddf | peak-detection.ts, peak-detection.test.ts |
| 2 | Render peak markers on NeuralTimeline and wire from results page | 12958c6 | NeuralTimeline.tsx, page.tsx |

## Implementation Details

### Task 1: Peak Detection Utility (TDD)

- Created `findPeaks(segments, options?)` -- pure function that filters by threshold (default 0.3), sorts descending, deduplicates adjacent array indices, returns top N `PeakMarker` objects
- Each `PeakMarker` contains: `time` (segment midpoint), `activationScore`, `rank` (1-based), `dominantRegion` (human-readable label of highest region score)
- Exported `REGION_LABELS` constant mapping region keys to display names
- 11 vitest tests covering: empty input, below-threshold, max peaks limit, midpoint calculation, rank ordering, dominant region detection, adjacent merging, custom threshold, custom maxPeaks

### Task 2: Timeline UI + Wiring

- Added `peakMarkers?: PeakMarker[]` prop to `NeuralTimelineProps`
- Peak markers row renders between header and track charts with matching layout (w-20 left spacer)
- Each marker: 10px amber diamond (rotated 45deg div) with glow shadow
- Hover tooltip (CSS-only via group/group-hover): shows formatted timestamp, activation percentage, dominant region name
- `pointer-events-none` on container + `pointer-events-auto` on individual markers preserves timeline scrubbing
- Results page computes `findPeaks(segments)` and passes result as prop

## Deviations from Plan

### Adjustments

**1. [Rule 3 - Blocking] colormap.ts does not exist in codebase**
- Plan specified importing THRESHOLD from `@/lib/colormap.ts`
- File does not exist in this codebase
- Defined `DEFAULT_THRESHOLD = 0.3` directly in peak-detection.ts

**2. [Rule 3 - Blocking] SegmentRegionScores has 4 regions, not 9**
- Plan referenced 9 region labels (attention, reward, emotional_processing, social_cognition, visual_processing, auditory_processing, language_narrative, default_mode, motion_processing)
- Actual `SegmentRegionScores` interface only has 4 keys
- REGION_LABELS covers the 4 actual regions

**3. [Rule 3 - Blocking] NeuralTimeline had no zones/iconMarkers props**
- Plan referenced existing `zones` and `iconMarkers` patterns in the component
- Component only had `segments`, `duration`, `currentTime`, `onSeek` props
- Peak markers row added as new pattern (no existing icon markers row to follow)

## Known Stubs

None -- all data is wired from real segment data through findPeaks.

## Verification

- 11/11 vitest tests pass
- TypeScript: no new errors introduced (pre-existing errors from missing node_modules only)
- All acceptance criteria grep checks pass

## Self-Check: PASSED
