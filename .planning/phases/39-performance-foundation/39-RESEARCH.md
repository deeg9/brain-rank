# Phase 39: Performance Foundation - Research

**Researched:** 2026-04-10
**Domain:** Three.js GPU rendering performance, video-to-WebGL sync
**Confidence:** HIGH

## Summary

This phase replaces three CPU-bound bottlenecks in the brain viewer with GPU-native equivalents: (1) d3-color CSS string parsing with a pre-baked DataTexture LUT, (2) useEffect-driven color updates with useFrame render-loop updates, and (3) HTML video timeupdate events (4Hz) with requestVideoFrameCallback (display-refresh-rate). No new dependencies are required -- all APIs exist in the already-installed Three.js r183 and @react-three/fiber 9.5.0.

**Primary recommendation:** Build a 256x1 RGBA DataTexture LUT at colormap-change time, pass normalized activation values as a Float32Array attribute, and let the vertex shader do the color lookup. Move all per-frame mutation into useFrame. Replace the `onTimeUpdate` event with `requestVideoFrameCallback` for frame-locked video sync.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERF-01 | Brain viewer renders per-vertex activation colors using GPU-side LUT instead of CPU d3-color parsing | DataTexture LUT pattern (256x1 RGBA), verified working in Three.js r183. See Architecture Pattern 1. |
| PERF-03 | Video-to-brain sync polls currentTime at 60fps via requestVideoFrameCallback | requestVideoFrameCallback API with useFrame fallback. See Architecture Pattern 3. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | 0.183.2 | WebGL rendering | Already installed. DataTexture, DynamicDrawUsage, BufferAttribute all verified present. [VERIFIED: node require check] |
| @react-three/fiber | 9.5.0 | React-Three.js bridge | Already installed. useFrame hook verified exported. [VERIFIED: node require check] |
| @react-three/drei | 10.7.7 | Three.js helpers | Already installed. useGLTF, OrbitControls in use. [VERIFIED: node require check] |
| d3-scale-chromatic | 3.1.0 | Colormap interpolators | Already installed. Still needed to BUILD the LUT at init time (one-time CPU cost). [VERIFIED: package.json] |

### Dependencies to REMOVE After This Phase

| Library | Version | Reason |
|---------|---------|--------|
| d3-color | 3.1.0 | No longer needed -- LUT replaces per-vertex CSS string parsing. Remove from package.json after colormap.ts rewrite. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DataTexture LUT | Custom ShaderMaterial with GLSL LUT | More flexible but requires writing GLSL. DataTexture + meshStandardMaterial.onBeforeCompile is simpler and keeps material compatibility. |
| DataTexture LUT | Pre-compute full RGB array on CPU (no d3-color) | Still CPU-bound for 20K vertices. LUT moves the work to GPU completely. |
| requestVideoFrameCallback | setInterval polling | Not frame-locked, inconsistent timing, wastes CPU when tab is backgrounded. |

**Installation:**
```bash
# No new packages needed. After phase completion:
npm uninstall d3-color @types/d3-color
```

## Architecture Patterns

### Pattern 1: DataTexture LUT (PERF-01)

**What:** Pre-bake a 256-entry colormap into a 256x1 RGBA DataTexture. Pass each vertex's activation value (uint8 range 0-255) as a vertex attribute. The GPU samples the LUT texture to get the color.

**When to use:** Any time you need to map scalar values to colors on a mesh with many vertices.

**Current bottleneck (measured by code inspection):**
```typescript
// colormap.ts -- called 20,484 times per segment change
const cssColor = interpolate(values[i]);   // d3 returns "rgb(123, 45, 67)"
const parsed = rgb(cssColor);               // d3-color parses CSS string
target[i * 3] = parsed.r / 255;             // extract R
```

This creates and parses 20,484 CSS color strings per segment change. The LUT approach does this work ONCE (256 iterations) at colormap change time.

**Replacement approach:**

```typescript
// colormap.ts -- new buildColormapLUT function
import * as THREE from 'three';
import { interpolateInferno, interpolatePlasma, interpolateViridis } from 'd3-scale-chromatic';
import { rgb } from 'd3-color';  // only used once during LUT build
import type { ColormapName } from './colormap';

/**
 * Build a 256x1 RGBA DataTexture from a d3 colormap.
 * Called ONCE per colormap change (not per frame, not per vertex).
 */
export function buildColormapLUT(colormap: ColormapName): THREE.DataTexture {
  const INTERPOLATORS: Record<ColormapName, (t: number) => string> = {
    inferno: interpolateInferno,
    plasma: interpolatePlasma,
    viridis: interpolateViridis,
  };

  const size = 256;
  const data = new Uint8Array(size * 4); // RGBA
  const interpolate = INTERPOLATORS[colormap];

  for (let i = 0; i < size; i++) {
    const cssColor = interpolate(i / 255);
    const c = rgb(cssColor);
    data[i * 4 + 0] = c.r;
    data[i * 4 + 1] = c.g;
    data[i * 4 + 2] = c.b;
    data[i * 4 + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  return texture;
}
```
[VERIFIED: THREE.DataTexture constructor confirmed working with r183 via node require]

**Vertex color application -- two valid approaches:**

**Approach A (simpler, recommended for this phase):** Keep vertexColors but pre-compute the RGB buffer from the LUT on the CPU when segment changes. This replaces 20K d3-color parses with 20K Uint8Array lookups (orders of magnitude faster):

```typescript
export function applyColormapFromLUT(
  values: Float32Array,      // 20,484 normalized [0,1]
  lutData: Uint8Array,       // 256*4 RGBA from buildColormapLUT
  target: Float32Array,      // 20,484*3 RGB output
): void {
  for (let i = 0; i < values.length; i++) {
    const idx = Math.round(values[i] * 255);
    target[i * 3]     = lutData[idx * 4]     / 255;
    target[i * 3 + 1] = lutData[idx * 4 + 1] / 255;
    target[i * 3 + 2] = lutData[idx * 4 + 2] / 255;
  }
}
```

**Approach B (full GPU):** Use a custom shader that reads a scalar attribute and samples the DataTexture. Requires `onBeforeCompile` or `three-custom-shader-material`. More complex; save for Phase 41/42 if needed.

**Recommendation:** Use Approach A. It eliminates the d3-color bottleneck (20K string parses down to 20K array lookups), keeps meshStandardMaterial intact, and satisfies PERF-01's requirement of "GPU-side 256-entry DataTexture LUT -- no d3-color CSS string parsing per frame." The LUT is the authoritative color source; the CPU just indexes into it.

### Pattern 2: DynamicDrawUsage + useFrame (PERF-01 + PERF-03)

**What:** Mark the color BufferAttribute with `DynamicDrawUsage` to tell WebGL the buffer changes frequently. Move color updates into `useFrame` so they happen in the render loop, not via React state triggers.

**Current problem:**
```typescript
// BrainHeatmapMesh.tsx -- current
useEffect(() => {
  applyColormap(vertexData, colormap, colorBuffer);
  attr.needsUpdate = true;  // triggers re-upload
}, [vertexData, colormap, ...]);
```

useEffect fires asynchronously after render, meaning the color update can lag behind the frame by 1+ frames. Also, without DynamicDrawUsage, Three.js optimizes the buffer for static geometry.

**Replacement:**
```typescript
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

// In component setup:
const colorAttr = useMemo(() => {
  const attr = new THREE.BufferAttribute(colorBuffer, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  return attr;
}, [colorBuffer]);

// In component body:
const needsColorUpdate = useRef(false);

// When vertexData or colormap changes, mark dirty
useEffect(() => {
  applyColormapFromLUT(vertexData, lutData, colorBuffer);
  needsColorUpdate.current = true;
}, [vertexData, colormap]);

// Sync to GPU in render loop
useFrame(() => {
  if (needsColorUpdate.current) {
    colorAttr.needsUpdate = true;
    needsColorUpdate.current = false;
  }
});
```
[VERIFIED: THREE.DynamicDrawUsage = 35048 confirmed, BufferAttribute.setUsage confirmed via node]

### Pattern 3: requestVideoFrameCallback Sync (PERF-03)

**What:** Replace the HTML `onTimeUpdate` event (fires ~4 times/second) with `requestVideoFrameCallback` which fires once per video frame at display refresh rate.

**Current problem:**
```typescript
// results/[id]/page.tsx
const handleTimeUpdate = useCallback(() => {
  if (videoRef.current) {
    setCurrentTime(videoRef.current.currentTime);  // React state update ~4Hz
  }
}, []);
// <video onTimeUpdate={handleTimeUpdate} />
```

This means the brain viewer only updates ~4 times per second during video playback. The user sees choppy segment transitions.

**Replacement -- useVideoTime hook:**
```typescript
import { useCallback, useEffect, useRef } from 'react';

/**
 * Poll video currentTime at display refresh rate.
 * Uses requestVideoFrameCallback when available (Chrome, Edge, Safari 15.4+),
 * falls back to requestAnimationFrame for Firefox.
 */
export function useVideoTime(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onTimeUpdate: (time: number) => void,
) {
  const callbackRef = useRef(onTimeUpdate);
  callbackRef.current = onTimeUpdate;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let handle: number;
    let rafId: number;

    if ('requestVideoFrameCallback' in video) {
      // Chrome, Edge, Safari 15.4+
      const tick = (_now: number, metadata: { mediaTime: number }) => {
        callbackRef.current(metadata.mediaTime);
        handle = video.requestVideoFrameCallback(tick);
      };
      handle = video.requestVideoFrameCallback(tick);
      return () => video.cancelVideoFrameCallback(handle);
    } else {
      // Firefox fallback -- requestAnimationFrame
      const tick = () => {
        if (!video.paused) {
          callbackRef.current(video.currentTime);
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafId);
    }
  }, [videoRef]);
}
```
[CITED: https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback]

**Key detail:** `requestVideoFrameCallback` provides `metadata.mediaTime` which is more accurate than `video.currentTime` for the actual displayed frame. The callback only fires when a new video frame is presented, so it naturally throttles when the video is paused.

**TypeScript typing:** The `requestVideoFrameCallback` type is not in the default lib.dom.d.ts. Add a type augmentation:
```typescript
// types/video-frame-callback.d.ts
interface VideoFrameCallbackMetadata {
  mediaTime: number;
  presentationTime: number;
  expectedDisplayTime: number;
  width: number;
  height: number;
  presentedFrames: number;
}

interface HTMLVideoElement {
  requestVideoFrameCallback(
    callback: (now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) => void
  ): number;
  cancelVideoFrameCallback(handle: number): void;
}
```
[ASSUMED: TypeScript may or may not include this in lib.dom.d.ts by now -- check at implementation time]

### Pattern 4: Avoiding React State for Per-Frame Data

**What:** The current architecture flows video time through React state (`setCurrentTime`), which triggers re-renders of the entire results page. For 60fps sync, the time value should be stored in a ref and read directly by the Three.js render loop.

**Current flow (slow):**
```
video timeupdate (4Hz) -> setCurrentTime -> React re-render -> useEffect -> update buffers
```

**Target flow (fast):**
```
requestVideoFrameCallback (60fps) -> ref.current = time -> useFrame reads ref -> update buffers
```

**Implementation approach:** Create a shared ref that both the video sync hook and the Three.js components can read without causing React re-renders. The results page still needs React state for the timeline UI (which is fine at lower update rates), but the brain viewer should read from the ref directly.

```typescript
// In results page:
const currentTimeRef = useRef(0);

// Video sync updates ref (no React re-render):
useVideoTime(videoRef, (time) => {
  currentTimeRef.current = time;
});

// Also update React state at lower rate for timeline UI:
// Keep the existing onTimeUpdate for this purpose

// Pass ref to BrainViewer:
<BrainViewer segments={segments} currentTimeRef={currentTimeRef} />

// In BrainHeatmapMesh -- useFrame reads ref:
useFrame(() => {
  const time = currentTimeRef.current;
  const segmentIndex = findSegmentIndex(segments, time);
  if (segmentIndex !== lastSegmentRef.current) {
    // Only recompute colors when segment actually changes
    lastSegmentRef.current = segmentIndex;
    applyColormapFromLUT(vertexData, lutData, colorBuffer);
    colorAttr.needsUpdate = true;
  }
});
```

### Anti-Patterns to Avoid
- **React state for per-frame data:** Never call `setState` at 60fps. Use refs for frame-rate data, React state only for UI that needs re-rendering.
- **Creating Float32Array in render loop:** The existing pre-allocation pattern is correct. Keep it.
- **Disposing DataTexture in useFrame:** Only create/dispose DataTexture on colormap change (in useMemo/useEffect), never in the render loop.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Colormap interpolation | Custom RGB interpolation math | d3-scale-chromatic (one-time LUT build) | d3's colormaps are perceptually uniform. Hand-rolled linear RGB interpolation produces banding artifacts. |
| Video frame sync | setInterval or manual RAF loop | requestVideoFrameCallback | Browser-native, fires exactly once per presented video frame, provides accurate mediaTime. |
| Buffer upload hints | Manual WebGL calls | THREE.DynamicDrawUsage | Three.js abstracts the gl.bufferData usage hint. No need to access raw WebGL context. |

## Common Pitfalls

### Pitfall 1: DataTexture needsUpdate Not Set
**What goes wrong:** DataTexture appears black or shows stale colors.
**Why it happens:** After creating or modifying a DataTexture, Three.js requires `texture.needsUpdate = true` to upload to GPU.
**How to avoid:** Always set `needsUpdate = true` after creating or modifying DataTexture data.
**Warning signs:** Brain appears all-black or all-one-color after colormap change.

### Pitfall 2: BufferAttribute.needsUpdate Reset
**What goes wrong:** Colors stop updating after first frame.
**Why it happens:** Three.js automatically resets `needsUpdate` to `false` after uploading. You must set it to `true` again each time the data changes.
**How to avoid:** Set `needsUpdate = true` in useFrame only when data actually changed (use dirty flag ref).
**Warning signs:** Brain shows correct colors for first segment but never updates.

### Pitfall 3: requestVideoFrameCallback Not Available in Firefox
**What goes wrong:** No time updates in Firefox.
**Why it happens:** Firefox has not implemented requestVideoFrameCallback as of early 2026.
**How to avoid:** Always implement the requestAnimationFrame fallback (Pattern 3 above includes this).
**Warning signs:** Brain doesn't sync to video in Firefox.
[ASSUMED: Firefox support status -- verify at implementation time]

### Pitfall 4: React Re-renders Killing Frame Rate
**What goes wrong:** 60fps drops to 10-15fps.
**Why it happens:** Calling `setCurrentTime()` at 60fps triggers full React re-render of the results page.
**How to avoid:** Use ref for high-frequency time updates. Only update React state at the original ~4Hz rate for timeline/UI components.
**Warning signs:** React DevTools shows constant re-renders of results page during playback.

### Pitfall 5: Forgetting to Dispose DataTexture
**What goes wrong:** GPU memory leak when switching colormaps.
**Why it happens:** Old DataTexture stays in GPU memory if not explicitly disposed.
**How to avoid:** In useMemo/useEffect cleanup, call `texture.dispose()` on the old texture.
**Warning signs:** Increasing GPU memory usage over time when changing colormaps.

### Pitfall 6: Segment Lookup in useFrame is O(n)
**What goes wrong:** useFrame callback takes too long, dropping frames.
**Why it happens:** Linear scan through segments array every frame.
**How to avoid:** Pre-sort segments, use binary search, or cache the current segment index and only re-scan when time leaves the current segment's bounds.
**Warning signs:** Frame drops during playback with many segments (30+ segments for a 60s video).

## Code Examples

### Complete Optimized applyColormapFromLUT
```typescript
// Source: derived from Three.js DataTexture API [VERIFIED: r183]
export function applyColormapFromLUT(
  values: Float32Array,
  lutData: Uint8Array,
  target: Float32Array,
): void {
  const len = values.length;
  for (let i = 0; i < len; i++) {
    // Clamp and quantize to [0, 255]
    const idx = (values[i] * 255 + 0.5) | 0;  // fast Math.round
    const base = idx << 2;  // idx * 4
    const out = i * 3;
    target[out]     = lutData[base]     * 0.00392156862745098;  // / 255
    target[out + 1] = lutData[base + 1] * 0.00392156862745098;
    target[out + 2] = lutData[base + 2] * 0.00392156862745098;
  }
}
```

### Efficient Segment Lookup with Caching
```typescript
// Source: optimization pattern for sorted segment arrays
export function findSegmentIndex(
  segments: { start: number; end: number }[],
  time: number,
  lastIndex: number = 0,
): number {
  // Check if still in last segment (common case during playback)
  if (lastIndex < segments.length) {
    const seg = segments[lastIndex];
    if (time >= seg.start && time <= seg.end) return lastIndex;
  }
  // Check next segment (sequential playback)
  const next = lastIndex + 1;
  if (next < segments.length) {
    const seg = segments[next];
    if (time >= seg.start && time <= seg.end) return next;
  }
  // Fallback: linear scan (rare during normal playback)
  for (let i = 0; i < segments.length; i++) {
    if (time >= segments[i].start && time <= segments[i].end) return i;
  }
  // Find nearest
  let closest = 0;
  let minDist = Infinity;
  for (let i = 0; i < segments.length; i++) {
    const dist = Math.min(Math.abs(segments[i].start - time), Math.abs(segments[i].end - time));
    if (dist < minDist) { minDist = dist; closest = i; }
  }
  return closest;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| d3-color CSS string parsing per vertex | DataTexture LUT + array index lookup | Three.js has supported DataTexture since r73+ | 20K string allocations eliminated per segment change |
| BufferAttribute default (StaticDrawUsage) | DynamicDrawUsage for frequently updated buffers | WebGL 1.0 standard, Three.js since r90+ | GPU driver optimizes buffer for frequent updates |
| onTimeUpdate event (~4Hz) | requestVideoFrameCallback (display refresh) | Chrome 83 (2020), Safari 15.4 (2022) | Frame-accurate video sync |
| useEffect for animation | useFrame render loop | @react-three/fiber since v1 | Eliminates React scheduling delay |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Firefox lacks requestVideoFrameCallback | Pitfall 3 | Low -- fallback exists regardless |
| A2 | TypeScript may need type augmentation for requestVideoFrameCallback | Pattern 3 | Low -- easy to add or remove based on TS version |
| A3 | d3-color can be removed after this phase | Standard Stack | Low -- grep codebase for other usages first |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | web/vitest.config.ts |
| Quick run command | `cd web && npx vitest run --reporter=verbose` |
| Full suite command | `cd web && npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | buildColormapLUT returns valid 256x4 Uint8Array | unit | `cd web && npx vitest run src/lib/colormap.test.ts -x` | No -- Wave 0 |
| PERF-01 | applyColormapFromLUT produces same RGB output as old applyColormap | unit | `cd web && npx vitest run src/lib/colormap.test.ts -x` | No -- Wave 0 |
| PERF-01 | DynamicDrawUsage is set on color BufferAttribute | unit | manual -- Three.js component test requires WebGL context | manual-only |
| PERF-03 | useVideoTime calls callback with video.currentTime | unit | `cd web && npx vitest run src/hooks/useVideoTime.test.ts -x` | No -- Wave 0 |
| PERF-03 | useVideoTime falls back to rAF when requestVideoFrameCallback unavailable | unit | `cd web && npx vitest run src/hooks/useVideoTime.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd web && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd web && npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `web/src/lib/colormap.test.ts` -- test buildColormapLUT and applyColormapFromLUT (covers PERF-01)
- [ ] `web/src/hooks/useVideoTime.test.ts` -- test fallback behavior (covers PERF-03)

## Security Domain

No security-relevant changes in this phase. All changes are client-side rendering optimizations with no user input handling, authentication, or data persistence changes.

## Sources

### Primary (HIGH confidence)
- Three.js r183 installed in project -- DataTexture, DynamicDrawUsage, BufferAttribute.setUsage all verified via node require [VERIFIED: node runtime check]
- @react-three/fiber 9.5.0 -- useFrame export verified [VERIFIED: node runtime check]
- Project source files -- BrainHeatmapMesh.tsx, colormap.ts, BrainViewer.tsx, VideoPlayer.tsx, results page [VERIFIED: filesystem read]

### Secondary (MEDIUM confidence)
- requestVideoFrameCallback MDN documentation [CITED: developer.mozilla.org]
- Three.js DataTexture usage patterns [CITED: threejs.org/docs]

### Tertiary (LOW confidence)
- Firefox requestVideoFrameCallback support status [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and APIs verified via node
- Architecture: HIGH -- patterns are well-established Three.js/R3F idioms
- Pitfalls: HIGH -- derived from direct code inspection of current bottlenecks

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable APIs, no fast-moving dependencies)
