# Project Research Summary

**Project:** NeuroCut v3.0 -- Brain Visualization UX Overhaul (Dynamic Activation Glow)
**Domain:** Real-time 3D brain activation visualization with WebGL/react-three-fiber
**Researched:** 2026-04-10
**Confidence:** HIGH

## Executive Summary

NeuroCut's brain viewer has the right technical foundation -- 20,484-vertex mesh, per-segment activation data, react-three-fiber rendering, time-synced playback -- but the wrong UX layer. The current interface exposes 16 interactive controls (mode toggle, colormap dropdown, 4 view-angle buttons, 9 region filter toggles) when Meta's own TRIBE v2 demo uses zero toggles. The research is unanimous: this overhaul is about subtraction, not addition. The brain should simply glow as the video plays, with activation above a threshold lighting up regions dynamically while everything else stays dark. One new dependency (`three-custom-shader-material@^6.4.0`) enables per-vertex emissive control within the existing PBR lighting pipeline. Everything else uses the installed stack differently.

The recommended approach merges two existing mesh components (`BrainHeatmapMesh` and `BrainNetworkMesh`) into a single `BrainGlowMesh` with a custom shader material. Vertex activation drives emissive output via `smoothstep` thresholding, bloom post-processing creates the glow halo, and `useFrame`-based lerping produces smooth transitions between 2-second segments. The colormap computation moves entirely to the GPU via a DataTexture lookup, eliminating the current CPU bottleneck of 20,484 CSS string parses per update. All control UI is removed and replaced with a static network color legend.

The primary risks are performance-related: CPU-side colormap computation at 60fps will immediately break frame budget (Pitfall 1), bloom post-processing can halve frame rate on integrated GPUs (Pitfall 4), and missing `DynamicDrawUsage` on buffer attributes wastes GPU time on every frame (Pitfall 3). These must be addressed in the first phase before any visual work begins. A secondary risk is visual quality -- threshold popping artifacts (Pitfall 7) and emissive color washout (Pitfall 8) require smoothstep and careful intensity capping during the visual tuning phase.

## Key Findings

### Recommended Stack

Only one new dependency is needed. The entire overhaul uses the existing react-three-fiber, drei, postprocessing, and Three.js stack with architectural changes rather than library additions.

**Core technologies:**
- `three-custom-shader-material@^6.4.0`: Extends MeshStandardMaterial with custom GLSL -- enables per-vertex emissive control (the core feature) while preserving PBR lighting. Verified compatible with three@0.183, r3f@9.5, react@19.
- `THREE.DataTexture` (existing): 256-entry 1D colormap texture sampled in the fragment shader. Replaces the CPU-side d3 colormap that parses 20,484 CSS strings per update.
- `useFrame` (existing r3f): Frame-loop interpolation for smooth vertex activation transitions. Replaces the current `useEffect`-based snap-to-segment pattern.

**What NOT to add:** glslify, leva, @react-spring/three, lamina, chroma-js, niivue. All rejected with clear rationale in STACK.md.

### Expected Features

**Must have (table stakes):**
- Threshold-based display -- only vertices above activation cutoff glow; rest stays dark gray. This is the single most impactful change, directly from Meta's approach.
- Remove all toggle controls -- delete mode toggle, colormap dropdown, view-angle buttons, and 9 region filter buttons. The brain surface IS the interface.
- Continuous colorbar legend -- replace interactive toggles with a static display-only color legend.
- Single committed colormap -- pick one (inferno/hot), remove the dropdown.

**Should have (differentiators):**
- Dynamic bloom on activation -- regions above threshold emit soft glow via bloom post-processing. The "wow" factor.
- Activation timeline sparkline -- thin bar below the brain showing activation intensity over video duration with playhead.
- Peak moment markers -- auto-mark top 3-5 activation peaks. "Your video's brain moments."

**Defer (v2+):**
- Comparison/contrast mode (multi-video A/B)
- Segment annotations (requires transcript/scene detection pipeline)
- Regions mode as separate toggle (reintroduce later as "explore" panel if needed)

### Architecture Approach

The architecture collapses from a multi-mode component tree with 5 state variables and 16 controls to a zero-state wrapper that simply passes `regionScores` to a single glow mesh. `BrainViewer.tsx` drops from ~184 lines to ~50 lines. Two mesh components merge into one. The data flow simplifies from dual paths (vertex data + region scores) to a single path: `segments + currentTime -> getRegionsAtTime() -> 9 region scores -> BrainGlowMesh -> per-vertex color via network-vertex-map.json -> threshold gating -> glow`.

**Major components:**
1. `BrainViewer.tsx` (simplified) -- thin wrapper, title + canvas + static legend, zero state
2. `BrainGlowScene.tsx` (replaces BrainViewerCanvas) -- R3F scene with always-on bloom, auto-rotate OrbitControls, no mode branching
3. `BrainGlowMesh.tsx` (replaces both mesh components) -- custom shader material with per-vertex activation, threshold gating, emissive glow
4. `NetworkLegend.tsx` (new) -- static, non-interactive color legend showing all 9 networks

### Critical Pitfalls

1. **CPU colormap kills 60fps** -- Current `applyColormap()` does 20,484 CSS string parses per update. At 60fps with smooth interpolation, this creates 30-50ms/frame CPU work (budget is 16ms). Fix: move to GPU via DataTexture or pre-bake a 256-entry LUT. Must fix first.
2. **useEffect for animation fights React** -- Current vertex color updates run in `useEffect`. For 60fps animation, this must move to `useFrame` with `useRef` state. Never `setState` in `useFrame`.
3. **Missing DynamicDrawUsage** -- Buffer attributes default to `StaticDrawUsage`, causing 2-5ms GPU stalls per frame on integrated GPUs. One-line fix: `colorAttr.setUsage(THREE.DynamicDrawUsage)`.
4. **Bloom always-on doubles render cost** -- EffectComposer adds full-screen render passes. On integrated GPUs this can halve frame rate. Mitigation: prototype emissive-only first, add bloom only if needed, cap DPR to 1.0 when bloom active.
5. **Threshold popping artifacts** -- Hard cutoff causes flickering at activation boundaries. Fix: use `smoothstep` with margin, add hysteresis, apply temporal smoothing.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Performance Foundation and Animation Architecture

**Rationale:** Every subsequent phase depends on fast per-frame rendering. The current CPU colormap and useEffect patterns will break immediately when 60fps animation is attempted. Fix the foundation before building on it.
**Delivers:** Performant per-frame vertex color updates at 60fps, proper buffer usage hints, geometry dispose cleanup, useFrame-based animation loop.
**Addresses:** Table stakes performance for smooth visualization.
**Avoids:** Pitfall 1 (CPU colormap), Pitfall 2 (useEffect vs useFrame), Pitfall 3 (DynamicDrawUsage), Pitfall 9 (geometry clone leak), Pitfall 12 (object allocation in useFrame).

### Phase 2: UI Subtraction and Component Consolidation

**Rationale:** Removing controls and merging components is lower risk than adding visual features, and it establishes the simplified architecture that all subsequent phases build on. The component tree must be simplified before adding new visual behaviors.
**Delivers:** Single BrainGlowMesh replacing two mesh components, BrainGlowScene replacing BrainViewerCanvas, simplified BrainViewer with zero state, NetworkLegend component, all toggle/dropdown/button UI removed.
**Addresses:** All anti-features from FEATURES.md (remove toggles, dropdowns, preset views). Architecture consolidation from ARCHITECTURE.md.
**Avoids:** Pitfall 14 (removed user agency) -- keep legend subtly clickable for region isolation.

### Phase 3: Threshold Gating and Dynamic Glow

**Rationale:** With the performance foundation and simplified architecture in place, the core visual feature can be implemented. This is the hero feature -- the brain lights up dynamically.
**Delivers:** Per-vertex threshold-based activation display via CustomShaderMaterial, smoothstep soft edges, emissive output proportional to activation, bloom integration tuning.
**Addresses:** Primary differentiator (dynamic glow above threshold), table stakes (threshold-based display, single colormap).
**Avoids:** Pitfall 7 (popping artifacts via smoothstep + hysteresis), Pitfall 8 (emissive washout via intensity capping), Pitfall 4 (bloom cost via emissive-first approach).

### Phase 4: Smooth Transitions and Video Sync

**Rationale:** Once the static glow looks right, add temporal smoothness. Segment-to-segment lerping and tight video sync make the visualization feel alive.
**Delivers:** Smooth interpolation between 2-second segments, video-brain sync via useFrame polling or requestVideoFrameCallback, animation settling logic.
**Addresses:** Differentiator (smooth brain "breathing" transitions), video-brain sync playback.
**Avoids:** Pitfall 5 (timeupdate drift -- poll currentTime in useFrame), Pitfall 6 (lerp asymptotic creep -- snap-to-target epsilon).

### Phase 5: Timeline and Peak Markers

**Rationale:** With the brain visualization complete, add the complementary UI elements that help creators interpret the data. These are additive features on a stable base.
**Delivers:** Activation timeline sparkline below brain, playhead indicator, top 3-5 peak moment markers.
**Addresses:** Differentiators (activation timeline sparkline, peak moment markers).

### Phase Ordering Rationale

- Performance MUST come first because smooth animation is foundational -- every visual feature depends on 60fps rendering.
- UI subtraction before visual addition because the component tree must be simplified before the custom shader material is integrated. Building new glow logic on the old dual-mesh architecture would mean doing the work twice.
- Threshold/glow before interpolation because static glow (per-segment, no lerping) is testable and shippable on its own. Interpolation is a polish layer.
- Timeline last because it is independent of the 3D viewer internals and can be built in parallel once the core viewer stabilizes.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Needs research on exact `three-custom-shader-material` API for `csm_Emissive` and `csm_DiffuseColor` outputs, DataTexture creation pattern for colormap.
- **Phase 3:** Needs research on bloom parameter tuning with custom emissive materials. The interaction between CSM emissive output and postprocessing bloom is not well-documented. Expect empirical tuning.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Pure refactoring/deletion of existing React components. Well-understood patterns.
- **Phase 4:** useFrame lerp patterns are thoroughly documented in r3f docs. requestVideoFrameCallback is a standard web API.
- **Phase 5:** Standard React UI component work, no 3D complexity.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only one new dependency, peer deps verified against installed versions, all alternatives evaluated with clear rationale |
| Features | MEDIUM | Meta's interactive demo could not be directly inspected (Gradio app). Findings synthesized from blog posts, notebook code, and third-party descriptions. Feature priorities are opinionated but well-reasoned |
| Architecture | HIGH | Based on direct codebase analysis with line-number references. Component disposition is concrete and verified against existing code |
| Pitfalls | HIGH | Based on direct code review (exact line numbers cited), official Three.js/R3F documentation, and measured performance characteristics |

**Overall confidence:** HIGH

### Gaps to Address

- **Meta's exact colormap choice:** Blog says "hot" but the Gradio demo could not be inspected. "Inferno" is the closest d3 equivalent -- validate visually during Phase 3.
- **Bloom vs emissive-only visual quality:** The research recommends trying emissive-only first (cheaper), but the final visual may require bloom. This is an empirical decision that can only be made during Phase 3 implementation.
- **Region score distribution:** The 0.15 threshold assumes most resting-state activations are below this value. Validate against real TRIBE v2 output data before committing to a threshold. Consider making it a tunable uniform.
- **Top-N region suppression vs show-all:** Pitfall 13 warns that all 9 regions at full intensity creates visual chaos. The solution (show only top 2-3) conflicts with the "no toggles" philosophy. Needs UX testing during Phase 3.
- **Inflated vs pial mesh:** Current GLB is "unified" but it is unclear whether it uses the inflated surface (which Meta uses to expose sulci). Verify before Phase 2.

## Sources

### Primary (HIGH confidence)
- [three-custom-shader-material GitHub](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial) -- v6.4.0, CSM API, peer deps
- [Three.js BufferAttribute docs](https://threejs.org/docs/pages/BufferAttribute.html) -- needsUpdate, setUsage, DynamicDrawUsage
- [React Three Fiber Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls) -- useFrame vs useState, object allocation
- [React Postprocessing Bloom](https://react-postprocessing.docs.pmnd.rs/effects/bloom) -- luminance threshold, mipmapBlur
- Direct codebase analysis -- BrainHeatmapMesh.tsx, BrainNetworkMesh.tsx, BrainViewerCanvas.tsx, BrainViewer.tsx, colormap.ts, brain-utils.ts

### Secondary (MEDIUM confidence)
- [Meta AI Blog: TRIBE v2](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) -- visualization approach, demo description
- [TRIBE v2 Demo Notebook](https://github.com/facebookresearch/tribev2/blob/main/tribe_demo.ipynb) -- PlotBrain class, fsaverage5 mesh, narrative pattern
- [nilearn.plotting.view_surf docs](https://nilearn.github.io/dev/modules/generated/nilearn.plotting.view_surf.html) -- threshold parameter, hot colormap, sulcal depth
- [The Decoder: Meta's TRIBE v2](https://the-decoder.com/metas-new-ai-model-predicts-how-your-brain-reacts-to-images-sounds-and-speech/) -- three-panel layout

### Tertiary (LOW confidence)
- [HF Daily Briefer](https://www.hfdailybriefer.com/post/1618) -- Gradio demo uses nilearn+Plotly (single source, needs validation)

---
*Research completed: 2026-04-10*
*Ready for roadmap: yes*
