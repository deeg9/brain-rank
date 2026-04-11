---
phase: 39-performance-foundation
verified: 2026-04-10T00:11:00Z
status: human_needed
score: 7/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Confirm 60fps is maintained during video playback with all 20,484 vertices updating per segment change"
    expected: "Chrome DevTools Performance panel shows consistent 60fps frame delivery while video plays and brain viewer cycles through segments — no frame drops or jank"
    why_human: "Frame rate can only be verified at runtime in a browser with GPU rendering active. The code paths (DynamicDrawUsage + useFrame dirty flag) are correctly wired but actual GPU throughput cannot be measured programmatically."
---

# Phase 39: Performance Foundation Verification Report

**Phase Goal:** The brain viewer renders per-vertex activation colors at 60fps using GPU-side computation instead of CPU string parsing
**Verified:** 2026-04-10T00:11:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Brain viewer colors are computed via a 256-entry LUT array lookup, not d3-color CSS string parsing | VERIFIED | `applyColormapFromLUT` in colormap.ts uses only array index lookups; d3-color import is confined to `buildColormapLUT` (one-time build) |
| 2 | Color buffer attribute uses DynamicDrawUsage for frequent GPU uploads | VERIFIED | `attr.setUsage(THREE.DynamicDrawUsage)` on line 30 of BrainHeatmapMesh.tsx |
| 3 | Color buffer needsUpdate is set inside useFrame render loop, not useEffect | VERIFIED | `useFrame(() => { if (needsColorUpdate.current && colorAttr) { colorAttr.needsUpdate = true; ... } })` on lines 58-63 of BrainHeatmapMesh.tsx |
| 4 | Video-to-brain sync uses requestVideoFrameCallback (or rAF fallback) instead of HTML onTimeUpdate event | VERIFIED | `useVideoTime` hook feature-detects `'requestVideoFrameCallback' in video` and falls back to rAF; wired in page.tsx |
| 5 | Brain viewer reads currentTime from a ref, not React state, avoiding 60fps re-renders | VERIFIED | BrainViewer accepts `currentTimeRef: React.RefObject<number>` and reads `currentTimeRef.current`; ref updated in `useVideoTime` callback |
| 6 | Timeline and UI controls still update via React state at lower frequency for display purposes | VERIFIED | `handleTimeUpdate` still calls `setCurrentTime` on HTML `timeupdate` event; NeuralTimeline and VideoPlayer receive React state `currentTime` |
| 7 | Brain viewer maintains 60fps during video playback with all 20,484 vertices updating per segment change | ? HUMAN | Code paths are correctly wired (DynamicDrawUsage + useFrame + LUT); actual frame rate requires runtime browser profiling |
| 8 | No d3-color CSS string parsing occurs per frame | VERIFIED | `applyColormapFromLUT` body contains no `rgb(` or d3-color calls — only array index arithmetic; confirmed by code review |

**Score:** 7/8 truths verified (1 requires human testing)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `web/src/lib/colormap.ts` | buildColormapLUT and applyColormapFromLUT functions | VERIFIED | Both functions present; exports ColormapName, COLORMAP_OPTIONS, buildColormapLUT, applyColormapFromLUT, applyColormap (deprecated) |
| `web/src/lib/colormap.test.ts` | Unit tests for LUT functions | VERIFIED | 6 tests: 3 for buildColormapLUT, 3 for applyColormapFromLUT including regression test; all pass |
| `web/src/components/results/BrainHeatmapMesh.tsx` | Optimized brain mesh with DynamicDrawUsage and useFrame | VERIFIED | DynamicDrawUsage on line 30, useFrame on line 58, LUT imports on line 8 |
| `web/src/hooks/useVideoTime.ts` | useVideoTime hook with rVFC + rAF fallback | VERIFIED | Feature detection, rVFC path with mediaTime, rAF fallback with pause handling, setupVideoTimeSync exported |
| `web/src/hooks/useVideoTime.test.ts` | Unit tests for useVideoTime hook | VERIFIED | 5 tests covering rVFC path, rAF fallback, cleanup for both paths, mediaTime callback; all pass |
| `web/src/types/video-frame-callback.d.ts` | TypeScript type augmentation for requestVideoFrameCallback | VERIFIED | VideoFrameCallbackMetadata interface, requestVideoFrameCallback and cancelVideoFrameCallback method augmentations |
| `web/src/components/results/BrainViewer.tsx` | BrainViewer accepting currentTimeRef instead of currentTime number | VERIFIED | Props interface has `currentTimeRef: React.RefObject<number>` on line 16; reads ref on line 36 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| BrainHeatmapMesh.tsx | colormap.ts | `import { buildColormapLUT, applyColormapFromLUT }` | WIRED | Import on line 8; buildColormapLUT used in useMemo line 22; applyColormapFromLUT used in useEffect line 53 |
| results/[id]/page.tsx | hooks/useVideoTime.ts | `import { useVideoTime }` | WIRED | Import on line 11; hook called on lines 103-105 with videoRef and ref-update callback |
| results/[id]/page.tsx | BrainViewer.tsx | `currentTimeRef` prop | WIRED | `currentTimeRef={currentTimeRef}` on line 302; BrainViewer reads `currentTimeRef.current` on line 36 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| BrainHeatmapMesh.tsx | colorBuffer (Float32Array) | applyColormapFromLUT called with vertexData (from parent prop) | Yes — written in useEffect, uploaded to GPU in useFrame | FLOWING |
| useVideoTime.ts | mediaTime / currentTime | rVFC metadata.mediaTime or video.currentTime from browser | Yes — browser-provided real-time values | FLOWING |
| BrainViewer.tsx | vertexData | getVertexDataAtTime(segments, currentTime) decoded via decodeVertexData | Yes — real segment data from API results | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| colormap LUT tests pass | `npx vitest run src/lib/colormap.test.ts --reporter=verbose` | 6/6 tests pass | PASS |
| useVideoTime tests pass | `npx vitest run src/hooks/useVideoTime.test.ts --reporter=verbose` | 5/5 tests pass | PASS |
| Full test suite passes (no regressions) | `npx vitest run --reporter=verbose` | 54/54 tests pass across 6 files | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PERF-01 | 39-01-PLAN.md | Brain viewer renders per-vertex activation colors using GPU-side LUT instead of CPU d3-color parsing | SATISFIED | buildColormapLUT + applyColormapFromLUT replaces per-vertex d3-color calls; DynamicDrawUsage + useFrame sync to GPU |
| PERF-03 | 39-02-PLAN.md | Video-to-brain sync polls currentTime at 60fps via requestVideoFrameCallback | SATISFIED | useVideoTime hook with rVFC feature detection + rAF fallback wired into results page; currentTimeRef passed to BrainViewer |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| colormap.ts | 2 | `import { rgb } from 'd3-color'` | Info | Expected — d3-color is confined to `buildColormapLUT` (one-time LUT build at colormap change). Not in per-vertex render path. |

No blockers or warnings found. The single d3-color import in colormap.ts is intentional and correct — it appears only in the one-time LUT builder, not in the per-vertex `applyColormapFromLUT` function.

### Human Verification Required

#### 1. 60fps Frame Rate During Video Playback

**Test:** Open the results page for a completed analysis in Chrome. Open DevTools Performance panel. Start recording, play the video for 10-15 seconds while watching the brain viewer cycle through multiple segment boundaries.
**Expected:** Frame delivery stays at 60fps (16ms frame budget). The brain viewer should update smoothly without visible frame drops as segments change. In the Performance panel, look for consistent ~16ms frame spacing with no long tasks blocking the main thread during vertex color updates.
**Why human:** Actual GPU frame delivery cannot be measured programmatically in this environment. The code architecture (DynamicDrawUsage + useFrame dirty flag + LUT lookup) is designed to stay within the 60fps budget, but actual throughput depends on the browser's GPU scheduler, the machine's GPU capabilities, and Three.js internals that cannot be inspected at the source level.

## Gaps Summary

No structural gaps identified. All artifacts exist, are substantive, and are correctly wired. All 11 tests pass (6 colormap LUT tests + 5 useVideoTime tests). Full suite of 54 tests passes with zero regressions.

The one pending item is a runtime performance verification: the architecture is correct for 60fps (LUT reduces 20,484 d3-color string parses to array index lookups; DynamicDrawUsage marks the buffer for efficient GPU re-upload; useFrame syncs the dirty flag inside the Three.js render loop; ref-based time avoids React re-renders at 60fps). Actual frame rate confirmation requires browser profiling.

---

_Verified: 2026-04-10T00:11:00Z_
_Verifier: Claude (gsd-verifier)_
