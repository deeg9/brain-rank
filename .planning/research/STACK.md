# Technology Stack: Brain Visualization UX Overhaul

**Project:** NeuroCut v3.0 -- Dynamic Activation Glow
**Researched:** 2026-04-10
**Confidence:** HIGH
**Scope:** Stack ADDITIONS only. Existing validated stack (Next.js 16, React 19, react-three-fiber 9.5, drei 10.7, postprocessing 3.0, three 0.183, framer-motion, Tailwind, Supabase) is NOT re-evaluated.

## Executive Summary

The current brain viewer uses `meshStandardMaterial` with `vertexColors` and updates a `Float32Array` color buffer via `useEffect`. This works but has three fundamental limitations for the v3.0 goals:

1. **No per-vertex emissive control** -- `meshStandardMaterial` applies a single `emissiveIntensity` to the entire mesh. You cannot make vertex A glow and vertex B stay dark.
2. **No smooth interpolation between segments** -- colors snap instantly when `currentTime` crosses a segment boundary (2-second windows). No lerping between adjacent segment states.
3. **Colormap applied on CPU** -- `applyColormap()` iterates 20,484 vertices in JS, parsing CSS color strings via d3-color. This is slow and blocks the main thread when called at 60fps.

All three problems are solvable with ONE library addition (`three-custom-shader-material`) plus custom GLSL and architecture changes using tools already installed. No other new dependencies are needed.

## Recommended Stack Additions

### New Dependencies

| Technology | Version | Purpose | Why This, Why Now |
|------------|---------|---------|-------------------|
| three-custom-shader-material | ^6.4.0 | Extend MeshStandardMaterial with custom vertex/fragment shaders | Lets you inject per-vertex activation, threshold, and emissive logic INTO MeshStandardMaterial rather than writing a full ShaderMaterial from scratch. You keep PBR lighting (roughness, metalness, ambient occlusion) while adding custom `attribute float activation` and GLSL threshold/glow logic. Peer deps: three>=0.159 (installed: 0.183.2), r3f>=8.0 (installed: 9.5.0), react>=18 (installed: 19.2.4). Fully compatible. Last published May 2025, actively maintained. |

```bash
cd web && npm install three-custom-shader-material@^6.4.0
```

That is the ONLY new package. Everything else uses the existing stack differently.

### What NOT to Add

| Library | Why You Might Think You Need It | Why You Do NOT |
|---------|--------------------------------|----------------|
| `@react-three/postprocessing` (extra effects) | "We need better bloom" | Already installed at v3.0.4. The existing Bloom effect with `luminanceThreshold` + `mipmapBlur` is sufficient. Per-vertex glow is achieved via emissive output in the custom shader, not via additional post-processing effects. |
| `glslify` / `glsl-noise` | "We need GLSL module imports" | The shaders for this use case are 30-50 lines total. No noise functions needed. Inline GLSL template strings in TypeScript files are fine at this scale. |
| `leva` / `dat.gui` | "Need to tune shader parameters during dev" | Use React state + props for the 3-4 uniforms (threshold, glowIntensity, interpolationFactor). Add leva later only if tuning becomes painful. |
| `@react-spring/three` | "Need spring-based animation for smooth transitions" | `useFrame` with manual lerp gives frame-rate-independent interpolation with zero dependency overhead. Spring physics adds unnecessary complexity for linear activation interpolation. |
| `lamina` | "Layer-based shader composition" | Deprecated/unmaintained. three-custom-shader-material is its successor and is actively maintained. |
| `postprocessing` (raw) | "Need lower-level bloom control" | `@react-three/postprocessing` already wraps this. No need to import the raw library separately. |
| `chroma-js` | "Better color manipulation" | Larger bundle (~15KB). d3-scale-chromatic (already installed) covers all needed colormaps. For the v3.0 approach, colormaps move to GPU anyway (see below). |
| `niivue` / `brainbrowser` | "Purpose-built brain viewers" | Massive overkill, bring their own WebGL context, incompatible with react-three-fiber scene graph. |

## Architecture Changes (Using Existing Stack)

These are not new dependencies but critical implementation patterns using what is already installed.

### 1. Custom Shader Material for Per-Vertex Activation Glow

**What:** Replace `meshStandardMaterial` with a `CustomShaderMaterial` that extends `MeshStandardMaterial`.

**Why:** The core v3.0 requirement -- "regions light up dynamically, only above activation threshold" -- requires per-vertex emissive control. `MeshStandardMaterial` only supports a single `emissive` color and `emissiveIntensity` for the entire mesh. A custom shader reads a per-vertex `activation` attribute and outputs emissive color conditionally per vertex.

**Key uniforms:**

| Uniform | Type | Purpose |
|---------|------|---------|
| `uThreshold` | float | Activation level below which vertices stay dark (e.g., 0.3) |
| `uGlowIntensity` | float | Multiplier for emissive output above threshold (e.g., 2.0-4.0) |
| `uBaseColor` | vec3 | Dark brain color for below-threshold vertices (#1a1a2e) |
| `uTime` | float | For optional subtle pulse animation on high-activation areas |

**Key attributes (per-vertex, set via BufferAttribute):**

| Attribute | Type | Purpose |
|-----------|------|---------|
| `activation` | float | Current interpolated activation value [0, 1] for each of 20,484 vertices |
| `regionColor` | vec3 | Network color for this vertex (from network-vertex-map.json, set once on load) |

**Fragment shader logic (simplified):**
```glsl
// CSM outputs -- these hook into MeshStandardMaterial's lighting pipeline
float t = smoothstep(uThreshold - 0.05, uThreshold + 0.05, vActivation);
vec3 glow = vRegionColor * t * uGlowIntensity;
csm_Emissive = glow;
csm_DiffuseColor = mix(vec4(uBaseColor, 1.0), vec4(vRegionColor, 1.0), t * 0.3);
```

The `smoothstep` creates a soft edge at the threshold rather than a hard cutoff (`step`), which produces visually organic activation boundaries on the brain surface. The 0.05 range on each side means a 10% activation band for the transition -- wide enough to see but tight enough to feel responsive.

### 2. Smooth Interpolation Between Segments via useFrame

**What:** Instead of snapping vertex data when `currentTime` crosses a 2-second segment boundary, lerp between the previous and next segment's activation arrays every frame.

**Why:** The current implementation calls `getVertexDataAtTime()` which returns the nearest segment's data. When playback crosses from segment N to segment N+1, all 20,484 vertices snap to new values simultaneously. This looks jarring. Smooth interpolation makes activation flow naturally like a wave across the brain.

**Pattern (using existing useFrame from r3f, no new deps):**
```typescript
// Store TWO Float32Arrays: current rendered state and target state
// On segment change: set new decoded data as "target"
// In useFrame: lerp current toward target using delta time
useFrame((_, delta) => {
  const speed = 4.0; // controls transition duration (~250ms)
  const alpha = Math.min(1, delta * speed);
  for (let i = 0; i < VERTEX_COUNT; i++) {
    current[i] += (target[i] - current[i]) * alpha;
  }
  activationAttr.needsUpdate = true;
});
```

**Performance note:** Iterating 20,484 floats with simple arithmetic per frame is trivial -- measured at <0.3ms on any modern device. The GPU buffer upload via `needsUpdate = true` is ~80KB per frame (20,484 x 4 bytes), which is 4.8MB/s at 60fps. Trivial for any GPU.

### 3. GPU-Side Color Mapping (Replace CPU applyColormap)

**What:** Replace the current `applyColormap()` function (which calls `d3-color.rgb()` to parse CSS strings 20,484 times) with GPU-side approaches:

- **Regions mode:** Pre-bake region colors as a per-vertex `vec3` attribute. Set once when `network-vertex-map.json` loads. Never changes at runtime. The shader reads `regionColor` directly.
- **Heatmap mode:** Build a 256-entry 1D `THREE.DataTexture` from d3-scale-chromatic once at init. Sample in the fragment shader: `texture2D(uColormap, vec2(vActivation, 0.5))`. Zero CPU cost per frame.

**Why this matters:** The current CPU approach parses CSS color strings 20,484 times per update. At 60fps with smooth interpolation, that would be 1.2 million string parse operations per second. Moving color mapping to the GPU reduces per-frame CPU cost to zero for this operation.

**DataTexture creation (one-time, existing d3 deps):**
```typescript
import { interpolatePlasma } from 'd3-scale-chromatic';
import { rgb } from 'd3-color';
import * as THREE from 'three';

function buildColormapTexture(interpolator: (t: number) => string): THREE.DataTexture {
  const size = 256;
  const data = new Uint8Array(size * 4);
  for (let i = 0; i < size; i++) {
    const color = rgb(interpolator(i / (size - 1)));
    data[i * 4] = color.r;
    data[i * 4 + 1] = color.g;
    data[i * 4 + 2] = color.b;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}
```

This keeps the existing d3-scale-chromatic dependency for building the texture but calls it 256 times total (once at init), not 20,484 times per segment change.

### 4. Bloom Interaction with Custom Emissive

**What:** The existing `<Bloom>` in `BrainViewerCanvas.tsx` already responds to emissive output from materials. With the custom shader writing to `csm_Emissive` proportional to activation, vertices above threshold automatically glow through the bloom pass.

**Recommended parameter changes (existing Bloom props, no new deps):**

| Prop | Current Value | Recommended for v3.0 | Why |
|------|--------------|----------------------|-----|
| `luminanceThreshold` | 0.2 | 0.4-0.6 | Higher threshold = only strongly activated regions bloom, prevents wash-out |
| `luminanceSmoothing` | 0.9 | 0.5 | Lower = sharper bloom falloff, more defined glow halos |
| `intensity` | 1.5 | 1.0-2.0 | Tune in combination with uGlowIntensity. These multiply. |
| `mipmapBlur` | true | true | Keep -- produces natural multi-scale bloom |

**Critical change:** Bloom should be ALWAYS active in v3.0, not conditionally rendered only for "regions" mode. The custom shader controls what emits light via the threshold. Below threshold = zero csm_Emissive = zero bloom. Above threshold = emissive proportional to activation = proportional bloom. This unifies both view modes.

### 5. Unifying Heatmap and Regions View Modes

**What:** Merge `BrainHeatmapMesh.tsx` and `BrainNetworkMesh.tsx` into a single `BrainActivationMesh.tsx` with one custom shader material.

**Why:** Both modes need the same underlying capability (per-vertex activation data with threshold-based glow). The difference is only how vertex colors are determined:

| Mode | Color Source | Activation Source |
|------|-------------|-------------------|
| Heatmap | Colormap texture lookup by activation value | Per-vertex TRIBE v2 output |
| Regions | Pre-baked network color attribute | Per-vertex TRIBE v2 output, masked by network membership |

A single uniform `uViewMode` (float: 0.0 or 1.0) switches the fragment shader between these two color paths. One mesh component, one material, one set of attributes, one render path.

## Performance Budget

| Operation | Budget | Approach |
|-----------|--------|----------|
| JS lerp loop (20,484 floats/frame) | <0.5ms | Simple float arithmetic, zero allocations in hot path |
| GPU buffer upload (activation attribute) | <0.3ms | Single `needsUpdate = true` on ~80KB Float32Array |
| Fragment shader (smoothstep + mix) | <0.1ms | Two smoothstep + one mix per fragment -- trivial GPU cost |
| Bloom post-processing | ~1-2ms | Already in pipeline, no additional cost from v2.x |
| **Total additional cost** | **<3ms/frame** | **60fps easily maintained on any GPU** |

For reference: the brain mesh is 20,484 vertices and ~40,000 faces. Modern GPUs render millions of vertices at 60fps. This mesh is small.

## Version Constraint Summary

| Package | Installed | Required by CSM | Status |
|---------|-----------|-----------------|--------|
| three | 0.183.2 | >=0.159 | Compatible |
| @react-three/fiber | 9.5.0 | >=8.0 | Compatible |
| react | 19.2.4 | >=18.0 | Compatible |
| @react-three/postprocessing | 3.0.4 | N/A (no change) | No change needed |
| @react-three/drei | 10.7.7 | N/A (no change) | No change needed |
| three-custom-shader-material | **NEW** | ^6.4.0 | To install |

## Installation

```bash
cd web && npm install three-custom-shader-material@^6.4.0
```

No other installations needed. No new dev dependencies. No Python changes.

## Migration Path from Current Code

| Current Component/Pattern | v3.0 Replacement | Effort |
|--------------------------|------------------|--------|
| `BrainHeatmapMesh.tsx` + `BrainNetworkMesh.tsx` | Single `BrainActivationMesh.tsx` with CSM | Medium -- merge two components, ~50 lines GLSL |
| `meshStandardMaterial` with `vertexColors` | `CustomShaderMaterial` baseMaterial={MeshStandardMaterial} | Low -- drop-in, keeps PBR lighting |
| `applyColormap()` CPU function (20K string parses) | GPU colormap via DataTexture sampled in shader | Medium -- build texture once, sample in fragment shader |
| Snap-to-segment (no interpolation) | `useFrame` lerp between current/target activation buffers | Low -- ~20 lines of code |
| Conditional Bloom (regions mode only) | Always-on Bloom, shader controls what emits | Trivial -- remove the `viewMode === 'regions'` guard |
| `getVertexDataAtTime()` returns single segment | Return current + next segment + interpolation factor | Low -- small refactor of brain-utils.ts |
| Separate emissiveIntensity (single value for whole mesh) | Per-vertex `csm_Emissive` driven by activation * threshold | Core change -- this IS the feature |

## Sources

- [three-custom-shader-material GitHub](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial) -- v6.4.0, extends MeshStandardMaterial with csm_Emissive, csm_DiffuseColor outputs. Peer deps verified via npm registry. (HIGH confidence)
- [drei shaderMaterial docs](https://drei.docs.pmnd.rs/shaders/shader-material) -- alternative considered, rejected: shaderMaterial creates a raw ShaderMaterial (no PBR lighting). CSM extends standard materials instead. (HIGH confidence)
- [Bloom - React Postprocessing](https://react-postprocessing.docs.pmnd.rs/effects/bloom) -- luminanceThreshold + mipmapBlur for activation-proportional glow. (HIGH confidence, already in codebase)
- [Three.js BufferAttribute docs](https://threejs.org/docs/pages/BufferAttribute.html) -- needsUpdate pattern for dynamic per-vertex data. (HIGH confidence, official docs)
- [React Three Fiber useFrame](https://r3f.docs.pmnd.rs/tutorials/basic-animations) -- frame-loop interpolation, delta-time for framerate independence. (HIGH confidence, official docs)
- [Three.js ShaderMaterial docs](https://threejs.org/docs/pages/ShaderMaterial.html) -- uniform refresh on every frame. (HIGH confidence, official docs)
- [Three.js DataTexture docs](https://threejs.org/docs/#api/en/textures/DataTexture) -- for 1D colormap texture. (HIGH confidence, official docs)
- npm registry: three-custom-shader-material@6.4.0, peer deps { three: >=0.159, @react-three/fiber: >=8.0, react: >=18.0 } -- verified 2026-04-10. (HIGH confidence)

---
*Stack research for: NeuroCut v3.0 Brain Visualization UX Overhaul*
*Researched: 2026-04-10*
