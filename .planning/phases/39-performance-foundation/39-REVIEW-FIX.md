---
phase: 39-performance-foundation
fixed_at: 2026-04-10T00:00:00Z
review_path: .planning/phases/39-performance-foundation/39-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 39: Code Review Fix Report

**Fixed at:** 2026-04-10T00:00:00Z
**Source review:** .planning/phases/39-performance-foundation/39-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: Out-of-bounds LUT access when `values[i]` is exactly 1.0

**Files modified:** `web/src/lib/colormap.ts`
**Commit:** d7388c4
**Applied fix:** Added `Math.min(255, Math.max(0, ...))` clamp around the LUT index calculation to prevent out-of-bounds reads when input values exceed the [0, 1] range due to floating-point accumulation. Without the clamp, values slightly above 1.0 produce index 256 (one past the end of the 256-entry LUT), causing `undefined` reads that poison the color buffer with NaN.

### WR-02: Stale callback ref pattern in `useVideoTime` -- RAF keeps running when paused

**Files modified:** `web/src/hooks/useVideoTime.ts`
**Commit:** 90a2401
**Applied fix:** Modified the RAF fallback branch in both `useVideoTime` and `setupVideoTimeSync` to stop the `requestAnimationFrame` loop when the video is paused. Instead of continuously scheduling RAF frames and skipping the callback, the loop now exits and registers a one-time `play` event listener to restart. The cleanup function also removes the play listener if the effect is torn down while paused. This prevents wasted CPU cycles and allows browser tab throttling.

### WR-03: BrainViewer reads from ref at render time, producing stale vertex data

**Files modified:** `web/src/components/results/BrainViewer.tsx`, `web/src/app/(app)/results/[id]/page.tsx`
**Commit:** 1da83e4
**Status:** fixed: requires human verification
**Applied fix:** Added `currentTime` (React state, ~4Hz from HTML `timeupdate`) as a new prop to `BrainViewer`. The vertex data lookup (`getVertexDataAtTime`) now uses this state-driven time instead of `currentTimeRef.current`, so the `useMemo` dependency actually changes when the active segment changes. Region scores still use the ref-based time for display. The parent results page now passes `currentTime={currentTime}` to `BrainViewer`. Renamed the local ref read from `currentTime` to `refTime` to avoid shadowing the new prop.

### WR-04: clonedGeometry memo in BrainHeatmapMesh will not dispose old geometry on remount

**Files modified:** `web/src/components/results/BrainHeatmapMesh.tsx`
**Commit:** 2bb0433
**Applied fix:** Added a `useEffect` cleanup that calls `clonedGeometry.dispose()` when the component unmounts or when `clonedGeometry` changes. This ensures GPU-allocated `THREE.BufferGeometry` resources are explicitly freed rather than relying on garbage collection, preventing memory leaks during view mode toggling.

---

_Fixed: 2026-04-10T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
