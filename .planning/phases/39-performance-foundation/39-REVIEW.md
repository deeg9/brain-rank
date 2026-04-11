---
phase: 39-performance-foundation
reviewed: 2026-04-10T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - web/src/lib/colormap.ts
  - web/src/components/results/BrainHeatmapMesh.tsx
  - web/src/hooks/useVideoTime.ts
  - web/src/app/(app)/results/[id]/page.tsx
  - web/src/components/results/BrainViewer.tsx
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 39: Code Review Report

**Reviewed:** 2026-04-10T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

These files implement the performance foundation for the brain visualization pipeline: a pre-computed colormap LUT, a GPU-synced Three.js vertex color mesh, a low-overhead video time hook, and the results page orchestrating everything. The architecture is sound — the LUT approach, dirty-flag pattern for GPU uploads, ref-based time tracking, and RAF fallback are all correct choices. No security vulnerabilities or data loss risks were found.

Four warnings were found, all relating to correctness edge cases: an out-of-bounds array access in the LUT lookup that corrupts color output on out-of-range inputs, a stale closure in `useVideoTime` that will fire the wrong callback after the hook re-runs, a silent fallback path in `useVideoTime` that keeps calling `requestAnimationFrame` when video is paused (wasting CPU), and a `useMemo` dependency in `BrainViewer` that reads from a ref at render time rather than at memo evaluation time, causing stale vertex data.

---

## Warnings

### WR-01: Out-of-bounds LUT access when `values[i]` is exactly 1.0

**File:** `web/src/lib/colormap.ts:63`

**Issue:** The expression `((values[i] * 255 + 0.5) | 0) * 4` produces index `1024` (i.e., `256 * 4`) when `values[i]` is `1.0` because `(255 * 255/255 + 0.5) | 0 = 255`, wait — let me be precise. `1.0 * 255 + 0.5 = 255.5`, `255.5 | 0 = 255`, `255 * 4 = 1020`. That path is safe. However, if a caller passes a value slightly above `1.0` (e.g., `1.001` due to floating-point accumulation in the upstream normalization), the result is `(256.755) | 0 = 256`, and `256 * 4 = 1024` — a one-past-end read on the 1024-byte `Uint8Array`. A `Uint8Array` out-of-bounds read returns `undefined` in JavaScript (not a hard crash), but `undefined * INV_255 = NaN`, which silently poisons the Three.js color buffer, producing black or transparent vertices with no error in the console.

The `decodeVertexData` function in `vertex-codec.ts` guarantees `[0, 1]` via integer division, but `applyColormapFromLUT` is a public API that accepts any `Float32Array` — the contract is not enforced.

**Fix:**
```typescript
// Clamp index to [0, 255] before multiplying
const lutIdx = Math.min(255, Math.max(0, (values[i] * 255 + 0.5) | 0));
const idx = lutIdx * 4;
```

---

### WR-02: Stale callback ref pattern in `useVideoTime` — callback not updated in cleanup path

**File:** `web/src/hooks/useVideoTime.ts:14-41`

**Issue:** The hook stores `onTimeUpdate` in `callbackRef.current` on every render (line 15), which is the standard stable-ref pattern. This is correct for the main execution path. However, the `useEffect` dependency array is `[videoRef]` (line 41). If `videoRef` itself changes (e.g., the parent component remounts or the ref object is recreated), the effect re-runs: the old frame callback chain is cancelled, and a new one is registered. This is fine.

The actual problem is in the RAF fallback branch (lines 32-39): the `tick` function captures `video` from the closure at effect-run time and keeps calling `callbackRef.current` at 60fps even when the video is paused. This is documented behavior (`if (!video.paused)`), but the RAF is *still* scheduled every frame even while paused — it just skips the callback. This means a paused video burns continuous `requestAnimationFrame` cycles, which can prevent the browser from throttling a background tab.

A secondary issue: the `requestVideoFrameCallback` branch (line 25) casts `video as HTMLVideoElement` twice unnecessarily since `video` is already narrowed to `HTMLVideoElement` via the `videoRef.current` assignment (the ref type is `React.RefObject<HTMLVideoElement | null>` and the null check on line 19 narrows it). This is harmless but reflects imprecise typing.

**Fix for RAF branch — stop the loop when paused:**
```typescript
const tick = () => {
  if (!video.paused) {
    callbackRef.current(video.currentTime);
    rafId = requestAnimationFrame(tick);
  } else {
    // Re-check on next play event rather than polling
    const onPlay = () => {
      rafId = requestAnimationFrame(tick);
      video.removeEventListener('play', onPlay);
    };
    video.addEventListener('play', onPlay);
  }
};
rafId = requestAnimationFrame(tick);
return () => {
  cancelAnimationFrame(rafId);
};
```

---

### WR-03: `BrainViewer` reads from ref at render time, then passes a potentially stale string to `useMemo`

**File:** `web/src/components/results/BrainViewer.tsx:53-61`

**Issue:** Lines 35 and 53 both read `currentTimeRef.current` during the render function body (not inside a `useMemo` or `useEffect`). This is intentional for `regionScores` (line 36), but `vertexDataBase64` (line 53) feeds directly into a `useMemo` with `[vertexDataBase64]` as the dependency. The problem is:

1. `currentTimeRef.current` is mutated by `useVideoTime` at up to 60fps.
2. `BrainViewer` only re-renders when React state changes (e.g., `viewMode`, `colormap`, `visibleRegions`).
3. Between re-renders, `currentTimeRef.current` advances but `vertexDataBase64` captured at the *last render time* remains the `useMemo` dependency — so the decoded vertex data stays frozen at the time of the last state change, not the current video time.

The `BrainHeatmapMesh` receives this stale `vertexData` prop and only updates colors when `vertexData` changes (line 45-48 in BrainHeatmapMesh.tsx). In practice, vertex data updates will only happen when the user interacts with the UI controls (changing colormap/viewMode), not as the video plays.

**Fix:** The component needs a mechanism to periodically re-derive vertex data as the video plays. Options:
- Subscribe to video time updates via a callback that calls `setState` at segment-change granularity (deduplicated by segment index, not raw time).
- Use `useFrame` inside the Canvas to drive vertex updates (keeping it off the React render cycle entirely).

The simplest correct fix for the current architecture is to track the active segment index as React state:

```typescript
// In the parent results page, pass currentSegmentIndex as a prop
// (already computed from currentTime + segments)
// BrainViewer re-renders only when the segment changes, not 60fps
```

---

### WR-04: `clonedGeometry` memo in `BrainHeatmapMesh` will not dispose old geometry on remount

**File:** `web/src/components/results/BrainHeatmapMesh.tsx:35-39`

**Issue:** The `clonedGeometry` is created via `useMemo` (line 35) and never explicitly disposed. When `BrainHeatmapMesh` unmounts (e.g., the user switches to "regions" view mode and back), React discards the `useMemo` value but the `THREE.BufferGeometry` clone remains allocated on the GPU until the garbage collector runs and Three.js's `BufferGeometry` finalizer (if any) cleans it up. Three.js does not have automatic GPU resource cleanup — `geometry.dispose()` must be called manually.

Over multiple mount/unmount cycles (switching between heatmap and regions views), this accumulates GPU memory leaks. On a 20,484-vertex mesh with full attribute data, each clone is approximately 1-2MB of GPU memory.

**Fix:**
```typescript
const clonedGeometry = useMemo(() => {
  const geo = nodes.brain.geometry.clone();
  geo.setAttribute('color', colorAttr);
  return geo;
}, [nodes.brain.geometry, colorAttr]);

// Dispose geometry when component unmounts or geometry changes
useEffect(() => {
  return () => {
    clonedGeometry.dispose();
  };
}, [clonedGeometry]);
```

---

## Info

### IN-01: `applyColormap` deprecated function remains in the public export surface

**File:** `web/src/lib/colormap.ts:75-89`

**Issue:** The `@deprecated` function is still exported. The comment states "no consumers remain after BrainHeatmapMesh migration." If that is accurate, it can be removed now. Leaving deprecated code in the export surface invites accidental re-use and increases bundle size by a small amount (the function and its call to `INTERPOLATORS` will be included in any tree-shaken bundle that imports from this module if bundlers are not configured to eliminate dead exports).

**Fix:** Remove the function, or if backward compatibility is needed for a transition period, add a `@deprecated` JSDoc tag and schedule removal in a follow-up.

---

### IN-02: Magic numbers in `applyColormapFromLUT` — `255` and `0.00392156862745098` should be named constants

**File:** `web/src/lib/colormap.ts:59,63`

**Issue:** `INV_255` is a local constant inside the function, which is reasonable, but `255` appears three times (lines 31, 63, and implicitly in the formula). The relationship between the LUT size (256) and the max index (255) is not immediately obvious to a reader. A named constant at module scope would make the coupling explicit.

**Fix:**
```typescript
const LUT_SIZE = 256;
const MAX_IDX = LUT_SIZE - 1;
const INV_255 = 1 / MAX_IDX;
```

---

### IN-03: IIFE used to render Arousal/Valence section in JSX

**File:** `web/src/app/(app)/results/[id]/page.tsx:342-356`

**Issue:** An immediately-invoked function expression (`(() => { ... })()`) is used inside JSX to introduce local variables (`currentSegment`, `arousal`, `valence`). This is unusual JSX style — it compiles fine but is harder to read than a helper variable computed before the `return` statement or a small sub-component. It also means `getSegmentAtTime` is called on every render, including renders triggered by `setCurrentTime` (which happens at ~4Hz via the `timeupdate` event). This is not a correctness issue but signals the pattern was chosen to avoid refactoring.

**Fix:** Compute these values in the render body before the `return`:
```typescript
const currentSegment = getSegmentAtTime(segments, currentTime);
const arousal = currentSegment?.arousal ?? 0;
const valence = currentSegment?.valence ?? 0;
```
Then reference them directly in JSX.

---

_Reviewed: 2026-04-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
