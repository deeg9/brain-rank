# Domain Pitfalls: Brain Visualization UX Overhaul (v3.0)

**Domain:** Real-time dynamic glow/activation effects on 3D brain mesh in react-three-fiber
**Researched:** 2026-04-10
**Context:** Redesigning brain viewer so activation lights up dynamically as video plays, synced to playback, with 20,484-vertex mesh requiring smooth color transitions at 60fps
**Confidence:** HIGH (based on direct codebase analysis, Three.js/R3F official docs, ecosystem research)

---

## Critical Pitfalls

Mistakes that cause visible jank, GPU stalls, or broken UX. Must fix before shipping.

### Pitfall 1: CPU-Side Colormap Per Frame Kills Performance

**What goes wrong:** The current `applyColormap()` in `colormap.ts` calls `interpolatePlasma(value)` then `rgb(cssString)` for each of 20,484 vertices. That is 20,484 string allocations + 20,484 CSS color parses (d3's `rgb()` runs regex matching internally) per colormap application. Currently this runs only on segment transitions (every 2 seconds) which is tolerable. When this runs every frame for smooth interpolation between segments, it creates ~30-50ms of CPU work per frame -- blowing the 16ms frame budget at 60fps and causing visible stutter.

**Why it happens:** d3-scale-chromatic's interpolation functions return CSS color strings like `"rgb(128, 0, 255)"` which must be parsed back into floats. This string-to-number round-trip is the bottleneck, not the mathematical interpolation.

**Consequences:** Dropped frames, the brain appears to "jump" between activation states instead of smoothly transitioning. On integrated GPUs (most laptop users), this alone can drop the viewer to 15-20fps.

**Prevention:**
1. **Pre-bake a 256-entry lookup table (LUT)** at initialization: sample the colormap at 256 evenly-spaced points, store as `Float32Array[256 * 3]`. At render time, quantize each vertex value to an 8-bit index and look up RGB directly. Reduces per-vertex work from string parsing to a single array index -- roughly 100x faster.
2. **Move coloring to the GPU entirely** (best long-term approach): upload activation values as a vertex attribute (`float`), upload a 256x1 RGB DataTexture as a uniform, and sample the colormap in the fragment shader with `texture2D(colormapTex, vec2(activation, 0.5))`. The GPU does the interpolation for free across all 20,484 vertices in parallel. Cost: ~0.1ms vs ~40ms on CPU.
3. **Intermediate fix:** Replace d3's CSS-string interpolators with direct numeric interpolation functions. Pre-compute polynomial approximations of the plasma colormap that return `[r, g, b]` floats directly, avoiding all string allocation.

**Detection:** Chrome DevTools Performance tab. Look for `applyColormap` or `rgb` taking >5ms per call. Use `r3f-perf` overlay to monitor JS frame time.

**Phase:** Must be addressed in the FIRST phase. Everything else (smooth animation, video sync) depends on fast color computation.

---

### Pitfall 2: Using useEffect Instead of useFrame for Per-Frame Animation

**What goes wrong:** The current `BrainHeatmapMesh.tsx` (line 38-44) updates vertex colors in a `useEffect` that fires when `vertexData` or `colormap` props change. This works for discrete segment transitions. For smooth interpolation (the v3.0 goal -- brain glows dynamically as video plays), developers instinctively add animation logic inside `useEffect` with `requestAnimationFrame` or timers, or worse, call `setState` at 60fps to trigger re-renders. Both approaches fight React's render cycle.

**Why it happens:** React mental model says "when data changes, re-render." But R3F's `useFrame` runs every GPU frame OUTSIDE React's reconciliation. Mixing React state updates with per-frame GPU animation creates two competing update cycles: React re-rendering the component tree + R3F rendering the 3D scene.

**Consequences:** The R3F docs explicitly state: "don't setState in useFrame." If you do, React re-renders `BrainHeatmapMesh` 60x/second, causing unnecessary reconciliation, GC pressure from recreated closures and objects, and potential layout thrashing in the surrounding HTML UI (the region legend, colormap selector, etc.).

**Prevention:**
1. **Use `useFrame` for ALL per-frame visual updates.** Store interpolation state in `useRef`, never in `useState`.
2. **Refactor pattern:** `vertexData` prop change triggers a `useEffect` that copies TARGET activation values into a ref (`targetRef.current = newVertexData`). A `useFrame` callback then lerps CURRENT vertex colors toward the target each frame, writing directly to the pre-allocated `colorBuffer`, then sets `needsUpdate = true` on the BufferAttribute.
3. **Decouple video time from React state.** Store the video element ref in a module-level variable or Zustand store. `useFrame` reads `videoRef.current.currentTime` directly each frame without React knowing.

**Detection:** React DevTools Profiler showing `BrainHeatmapMesh` re-rendering more than once per segment transition (every 2 seconds). If it re-renders 60x/second, this pitfall is active.

**Phase:** Must be refactored in the first phase alongside the colormap fix. The animation architecture depends on this.

---

### Pitfall 3: Missing DynamicDrawUsage on Frequently Updated BufferAttributes

**What goes wrong:** The current `BrainHeatmapMesh.tsx` (line 30-35) creates a `BufferAttribute` for vertex colors but never calls `setUsage(THREE.DynamicDrawUsage)`. Three.js defaults to `StaticDrawUsage`, which tells the GPU driver the buffer will not change. When you then set `needsUpdate = true` every frame (required for smooth animation), the driver must use a slow re-upload path (buffer orphaning + full copy) instead of a fast streaming update.

**Why it happens:** Three.js defaults to static usage because most geometry never changes. The `setUsage()` API is poorly documented and rarely mentioned in tutorials. It works "fine" without it -- just slower.

**Consequences:** On Intel integrated GPUs (common in laptops), the wrong usage hint causes 2-5ms of GPU-side stall per frame. On discrete GPUs the impact is ~0.5-1ms. At 60fps with a 16ms budget, 2-5ms is 12-31% of the frame budget wasted on a one-line fix.

**Prevention:**
```typescript
const colorAttr = new THREE.BufferAttribute(colorBuffer, 3);
colorAttr.setUsage(THREE.DynamicDrawUsage);
clonedGeometry.setAttribute('color', colorAttr);
```

Additionally, use `addUpdateRange(offset, count)` if only a subset of vertices change per frame (e.g., only the 3,000 vertices in a transitioning region). This avoids re-uploading the entire 61,452-float buffer when most values haven't changed.

**Detection:** `r3f-perf` showing GPU frame time spikes that do not correlate with JavaScript work. Chrome `chrome://gpu` page may show buffer upload warnings.

**Phase:** Simple one-line fix. Apply in the first phase alongside Pitfall 2 refactor.

---

### Pitfall 4: Bloom Post-Processing Always-On Doubles Render Cost

**What goes wrong:** The current `BrainViewerCanvas.tsx` (line 93-103) conditionally renders `<EffectComposer>` with `<Bloom>` only in regions mode. The v3.0 overhaul unifies heatmap and regions into a single dynamic view, meaning bloom will likely be always-on. EffectComposer adds a full-screen render pass: render scene to offscreen framebuffer, apply bloom (2+ Gaussian blur passes at multiple mipmap levels with `mipmapBlur`), then composite. On a 1080p canvas at DPR 1.5 (the current `dpr={[1, 1.5]}` setting), this processes ~3.1M fragments per blur pass.

**Why it happens:** Bloom looks spectacular in isolation. Developers see the visual improvement and ship it without profiling on lower-end hardware.

**Consequences:** Frame rate drops from 60fps to 30-40fps on integrated GPUs. Mobile browsers drop to 15-20fps. The brain viewer becomes the performance bottleneck of the entire results page, affecting scrolling and interaction of surrounding UI.

**Prevention:**
1. **Use emissive intensity on the material** instead of post-process bloom for the "glow" effect. The current `BrainNetworkMesh` already does this: `emissiveIntensity={maxScore * 2.0}` (line 129). Extend this pattern to the unified view. Set `emissive` to a tinted version of the vertex color and modulate `emissiveIntensity` by activation. This gives a soft glow appearance with ZERO post-processing cost.
2. **If bloom is essential for the desired visual**, reduce aggressively: lower `intensity` from 1.5 to 0.3-0.5, raise `luminanceThreshold` to 0.5+ (only bloom the very brightest vertices), and cap canvas DPR to 1.0 when bloom is active. The current `dpr={[1, 1.5]}` means bloom runs at up to 2.25x the fragment cost for marginal quality improvement.
3. **Add a performance escape hatch**: monitor frame delta in `useFrame`. If frames consistently exceed 20ms for 30+ frames, automatically disable bloom and log a console warning.
4. **Never use SelectiveBloom** (which renders the scene twice with a selection mask) -- it is 2-3x more expensive than regular Bloom.

**Detection:** Toggle `<EffectComposer>` off and compare frame times with `r3f-perf`. If removing it gains >5ms per frame, bloom is too expensive for the target hardware.

**Phase:** Decision must be made early in visual design phase. Emissive-only vs bloom affects the entire visual language of the overhaul.

---

## Moderate Pitfalls

### Pitfall 5: Video-to-Brain Sync Drift (timeupdate is 4fps, Brain is 60fps)

**What goes wrong:** The `currentTime` prop in `BrainViewer.tsx` (line 17) comes from the parent component, likely sourced from an HTML `<video>` element's `timeupdate` event. This event fires approximately every 250ms (browser-dependent, often irregular) -- effectively 4fps. If the brain animation runs at 60fps interpolating between segment targets, but receives new time references at 4fps, the brain can lead or lag the video by up to 250ms. Users perceive desynchronization, especially at segment boundaries where the brain should change exactly as the video transitions.

**Why it happens:** `timeupdate` is a coarse, fire-and-forget DOM event. Browsers (especially Chrome) do not guarantee consistent firing rate. Safari may fire it more frequently but with different timing characteristics.

**Prevention:**
1. **Poll `video.currentTime` directly in `useFrame`** instead of relying on events. Store a ref to the video DOM element. In the `useFrame` callback, read `videoRef.current.currentTime` every frame. This gives sub-frame time accuracy (~16ms resolution at 60fps instead of ~250ms).
2. **Use `requestVideoFrameCallback`** (Chrome 83+, Firefox 98+, Safari 15.4+) which fires exactly once per decoded video frame with precise presentation timestamps. This is the gold standard for video-to-animation sync.
3. **Decouple video time from React props entirely.** Pass the video element ref into the R3F scene (via Zustand store or module-level variable), not the current time as a React prop. This avoids React re-renders on time changes.

**Detection:** Play a video with rapid scene changes and watch if the brain activation trails behind by a perceivable delay. Pause the video -- the brain should stop immediately with no lingering animation drift.

**Phase:** Address in the video sync integration phase. Must be designed before implementing the interpolation system.

---

### Pitfall 6: Lerp Asymptotic Creep -- Animation Never Settles

**What goes wrong:** When interpolating vertex colors between segments, the standard approach is `current = lerp(current, target, 0.1)` in each `useFrame`. Lerp approaches the target asymptotically -- it mathematically never reaches it. After a segment transition, vertices "almost" reach their target color but keep changing by sub-pixel amounts indefinitely. `needsUpdate = true` is set every frame even when the brain should be visually static, wasting ~1-3ms of GPU upload time per frame for invisible changes.

**Why it happens:** Standard lerp behavior. At alpha=0.1, the remaining distance halves every ~7 frames, but it takes 70+ frames (over a second) to get within 0.001 of the target. During that time, every frame triggers a full BufferAttribute re-upload.

**Consequences:** Wasted GPU bandwidth. On battery-powered devices, this prevents the GPU from entering low-power idle state, draining battery even when the video is paused. It also means `addUpdateRange` optimizations (Pitfall 3) never kick in because the system thinks "everything is still changing."

**Prevention:**
1. **Snap to target when close.** After lerping, check `if (Math.abs(current - target) < 0.005)` and set `current = target`. The threshold 0.005 is below the perceptible color difference for 8-bit displays.
2. **Track a global "is animating" flag** using a ref. When ALL vertices have snapped to their targets, set `isAnimating.current = false` and skip the `needsUpdate = true` assignment. Resume when a new segment target arrives.
3. **Use `THREE.MathUtils.damp(current, target, lambda, delta)`** instead of raw lerp. This is frame-rate independent (accounts for variable frame duration) and reaches the target faster than equivalent lerp.

**Detection:** Pause the video for 5+ seconds. Check (via console log in `useFrame`) whether `needsUpdate` is still being set to `true`. If so, the animation never settled.

**Phase:** Address alongside the animation system (Pitfall 2 refactor).

---

### Pitfall 7: Threshold-Based Activation Creates Popping Artifacts

**What goes wrong:** The v3.0 goal says "regions light up only above activation threshold (maybe 50%)." If implemented as a hard cutoff (`if (activation > 0.5) { showGlow() } else { dark() }`), vertices near the boundary flicker rapidly between visible and invisible as activation values oscillate around the threshold between adjacent 2-second segments. This "popping" looks like a rendering bug.

**Why it happens:** Neural activation data from TRIBE v2 has natural variance. Values near any threshold will cross it repeatedly. With 2-second segments, a value might be 0.48 in one segment and 0.52 in the next.

**Consequences:** Brain regions flash on and off distractingly at their edges. Users focus on the flickering instead of the activation pattern. The visualization feels unstable and untrustworthy.

**Prevention:**
1. **Soft threshold with smoothstep.** Map activation to intensity using `smoothstep(threshold - margin, threshold + margin, activation)` where margin = 0.05-0.1. This creates a gradual fade zone instead of a hard edge. In GLSL (if using a shader): `intensity = smoothstep(0.4, 0.6, activation)`. In JavaScript: `intensity = clamp((activation - 0.4) / 0.2, 0, 1)` then square it for a smooth curve.
2. **Hysteresis.** Once a region activates (crosses 0.55 going up), it stays active until it drops below 0.45 going down. Prevents rapid toggling at the boundary.
3. **Temporal smoothing.** Apply exponential moving average to activation values before thresholding: `displayValue = displayValue * 0.7 + rawValue * 0.3`. This dampens inter-segment noise.

**Detection:** Fabricate test data with values oscillating around the threshold (0.48, 0.52, 0.49, 0.51, 0.48) and verify no visible flickering when playing through segments.

**Phase:** Implement during the threshold/activation visual phase. Must be designed before user testing.

---

### Pitfall 8: Emissive Color Washes Out Region Color Differentiation

**What goes wrong:** When adding dynamic glow via `emissiveIntensity` proportional to activation, high emissive values push all color channels toward 1.0 (white). If attention (blue, `#60a5fa`) and reward (purple, `#a78bfa`) regions both have activation > 0.8, their emissive contribution makes them look nearly identical -- washed-out bright areas that lose their color-coding distinction.

**Why it happens:** MeshStandardMaterial computes `finalColor = diffuse + emissive * emissiveIntensity`. When emissive is bright and intensity is high (the current code uses `maxScore * 2.0`), emissive dominates and the diffuse vertex color contribution becomes negligible.

**Prevention:**
1. **Cap emissive intensity** to 0.3-0.8 range. The glow "impression" comes more from contrast with dark surroundings than from raw brightness.
2. **Use vertex color as emissive color** scaled down: `emissive = vertexColor * 0.3`. This preserves hue while adding glow. Requires a custom shader or `onBeforeCompile` callback since `meshStandardMaterial` only supports a single `emissive` color, not per-vertex emissive.
3. **If using bloom, let bloom create the glow** rather than cranking emissive. Bloom preserves hue better because it works in screen-space and blurs existing colors rather than adding flat emissive contribution.
4. **Test with multiple high-activation regions visible simultaneously.** The worst case is when 3+ regions are all above 0.8 -- they should remain visually distinct by color.

**Detection:** Take a screenshot with multiple high-activation regions. If you cannot tell which region is which without reading the legend, emissive is too high.

**Phase:** Address during visual tuning, after the basic glow system is working.

---

### Pitfall 9: Geometry Clone Leak on Component Remount

**What goes wrong:** Both `BrainHeatmapMesh.tsx` (line 21-24) and `BrainNetworkMesh.tsx` (line 46-48) create `clonedGeometry` in `useMemo` but never dispose it on unmount. Each clone holds GPU-side vertex buffer objects (VBOs). If the component unmounts and remounts (e.g., switching view modes, navigating away and back), the old GPU buffers leak.

**Why it happens:** Three.js GPU resources require explicit `.dispose()` calls. JavaScript's garbage collector handles the JS-side objects but cannot reach the GPU memory. React's `useMemo` has no cleanup callback -- only `useEffect` does.

**Consequences:** Each mount/unmount leaks ~480KB of GPU memory (20,484 vertices x 3 components x 4 bytes x 2 attributes: position + color). Over a session with frequent mode toggles, this accumulates and can cause WebGL context loss on memory-constrained devices.

**Prevention:**
```typescript
useEffect(() => {
  return () => {
    clonedGeometry.dispose();
  };
}, [clonedGeometry]);
```

**Phase:** Quick fix, apply during any refactoring phase.

---

## Minor Pitfalls

### Pitfall 10: Color Space Mismatch (sRGB vs Linear)

**What goes wrong:** d3 colormaps output colors in sRGB space. Three.js (r152+, which R3F uses) defaults to `outputColorSpace = SRGBColorSpace` and performs sRGB encoding in the shader. If vertex colors are already in sRGB and the renderer encodes them again, midtones appear washed out (gamma applied twice). Conversely, if you linearize the colors but the renderer does not re-encode, colors appear too dark.

**Prevention:** When building the LUT (Pitfall 1 fix), convert sRGB values to linear: `linear = Math.pow(srgb, 2.2)`. Or set `colorAttribute.colorSpace = THREE.SRGBColorSpace` to tell Three.js the colors are already in sRGB and should be used as-is. Verify by comparing a test frame against the d3 colormap reference.

### Pitfall 11: OrbitControls Damping Fights Auto-View Transitions

**What goes wrong:** The current `enableDamping` with `dampingFactor={0.08}` creates smooth manual orbiting. If the overhaul adds auto-rotation or auto-view-switching (e.g., rotate to show the most active hemisphere), damping makes programmatic camera changes feel sluggish and "floaty." Calling `setAzimuthalAngle()` while damping is active creates a fight between the target position and the damping interpolation.

**Prevention:** Do not auto-rotate based on activation. If programmatic view transitions are needed, temporarily disable damping, animate with spring-based interpolation (react-spring `useSpring` targeting camera position), then re-enable damping.

### Pitfall 12: Object Allocation Inside useFrame

**What goes wrong:** Inside a `useFrame` callback, allocating `new THREE.Color()`, `new THREE.Vector3()`, or even using spread operators (`{...obj}`) creates garbage every frame. At 60fps, even small allocations accumulate and trigger GC pauses that appear as periodic stutter every 2-5 seconds.

**Prevention:** Pre-allocate ALL reusable objects (temp colors, vectors) at module scope or component scope (outside `useFrame`). Call `.set()` or `.copy()` to mutate them in place. Never use `Array.map()`, `Array.filter()`, spread operators, or `new` inside `useFrame`.

---

## UX Pitfalls

### Pitfall 13: All 9 Regions Simultaneously = Visual Chaos

**What goes wrong:** The overhaul removes toggle filters and shows dynamic glow. If all 9 brain regions display at full intensity simultaneously, the brain becomes an unintelligible multicolor light show. Users cannot extract meaning -- it looks "cool" but communicates nothing.

**Prevention:**
1. **Show only the top 2-3 regions by activation score** at any given moment. Fade others to the dark base color. Creates a clear visual narrative: "attention and reward are driving engagement in this segment."
2. **Use a dominant-region approach:** highest-scoring region gets full intensity, second gets 50%, third gets 25%, rest suppressed. Creates visual hierarchy.
3. **The static color legend should highlight the currently-dominant region** (bold, pulse, or increased opacity on the legend item matching the brightest region). Gives users a text anchor for what they see.

### Pitfall 14: "Simplified" UI That Removes User Agency

**What goes wrong:** The overhaul goal says "remove toggle filter buttons, replace with static legend." While simplification is correct, completely removing the ability to focus on a single region removes a valuable analytical tool. Power users (the content creators who care about specific metrics) lose the ability to say "show me JUST the emotional processing activation."

**Prevention:** Keep the legend interactive but subtle. Clicking a legend item could isolate that region (dim everything else). Double-click or "show all" returns to the multi-region view. This preserves simplicity (no cluttered button bar) while maintaining analytical depth for users who want it.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Performance foundation (do first) | Pitfall 1 (CPU colormap), Pitfall 3 (DynamicDrawUsage), Pitfall 9 (geometry leak) | Build LUT, set usage hint, add dispose cleanup. These are prerequisites for everything else. |
| Animation system | Pitfall 2 (useEffect vs useFrame), Pitfall 6 (lerp creep), Pitfall 12 (object allocation) | Refactor to useFrame + useRef pattern; add snap-to-target epsilon; pre-allocate temp objects. |
| Visual design (glow/bloom) | Pitfall 4 (EffectComposer cost), Pitfall 8 (emissive bleaching), Pitfall 10 (color space) | Prototype emissive-only first; only add bloom if emissive alone is insufficient. Verify color space. |
| Threshold activation | Pitfall 7 (popping artifacts) | Implement smoothstep + hysteresis before testing with real data. |
| Video sync | Pitfall 5 (timeupdate drift) | Poll currentTime in useFrame or use requestVideoFrameCallback. |
| UX simplification | Pitfall 13 (visual chaos), Pitfall 14 (removed user agency) | Design top-N-regions rule; keep legend subtly interactive. |
| Camera/interaction | Pitfall 11 (damping fights transitions) | Do not auto-rotate; use spring animations for programmatic camera moves. |

---

## "Looks Done But Isn't" Checklist

- [ ] **Frame budget verified:** Brain viewer maintains 60fps with smooth animation on a device with integrated GPU (test on a non-gaming laptop or use Chrome GPU throttling)
- [ ] **Animation settles:** After pausing video for 5 seconds, `needsUpdate` is no longer being set (Pitfall 6)
- [ ] **Color accuracy:** Screenshot of brain with known activation values matches expected colormap output (no double-gamma, no sRGB mismatch)
- [ ] **Threshold stability:** Test data with values oscillating around threshold shows no flickering (Pitfall 7)
- [ ] **Region distinction:** With 3+ regions at high activation, colors remain visually distinguishable (not washed out white)
- [ ] **Video sync:** Scrub video rapidly, brain tracks immediately. Pause, brain stops immediately. No perceptible lag.
- [ ] **Memory stability:** Toggle views 20 times, no increasing GPU memory (WebGL context stays healthy)
- [ ] **Bloom off comparison:** Verified that the visualization still communicates clearly with bloom disabled (graceful degradation)
- [ ] **Legend readability:** Non-technical user can look at the legend and identify which brain region is glowing brightest

---

## Sources

- [React Three Fiber: Performance Pitfalls (official)](https://r3f.docs.pmnd.rs/advanced/pitfalls) -- HIGH confidence. "Don't setState in useFrame" warning, object re-creation guidance.
- [React Three Fiber: Scaling Performance (official)](https://r3f.docs.pmnd.rs/advanced/scaling-performance) -- HIGH confidence. DPR, draw call, LOD guidance.
- [Three.js BufferAttribute docs](https://threejs.org/docs/pages/BufferAttribute.html) -- HIGH confidence. `needsUpdate`, `setUsage`, `addUpdateRange` API.
- [Three.js BufferAttribute Usage Constants](https://threejs.org/docs/api/en/constants/BufferAttributeUsage.html) -- HIGH confidence. DynamicDrawUsage specification.
- [Three.js forum: Buffer attribute update performance](https://discourse.threejs.org/t/updating-buffer-attribute-performance-is-incredibly-slow/36415) -- MEDIUM confidence. Community-reported performance numbers for dynamic updates.
- [React Postprocessing: Bloom docs](https://react-postprocessing.docs.pmnd.rs/effects/bloom) -- HIGH confidence. Bloom configuration, selective bloom cost.
- [pmndrs/react-postprocessing GitHub](https://github.com/pmndrs/react-postprocessing) -- HIGH confidence. EffectComposer merging behavior.
- [Codrops: Building Efficient Three.js Scenes (2025)](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/) -- MEDIUM confidence. General performance patterns.
- [Maxime Heckel: Shaders with R3F](https://blog.maximeheckel.com/posts/the-study-of-shaders-with-react-three-fiber/) -- MEDIUM confidence. Custom shader patterns in R3F.
- Codebase analysis: `BrainHeatmapMesh.tsx`, `BrainNetworkMesh.tsx`, `BrainViewerCanvas.tsx`, `BrainViewer.tsx`, `colormap.ts`, `brain-utils.ts` -- HIGH confidence (direct code review identifying exact line numbers of current issues).

---
*Pitfalls research for: NeuroCut v3.0 Brain Visualization UX Overhaul -- dynamic glow, 60fps animation, video sync*
*Researched: 2026-04-10*
