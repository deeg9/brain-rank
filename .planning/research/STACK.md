# Stack Research: v2.2 Enhanced Brain Analytics

**Domain:** Per-vertex cortical heatmaps, expanded functional networks, arousal/valence display
**Researched:** 2026-04-10
**Confidence:** HIGH

**Scope:** Only NEW stack additions for v2.2. Does NOT re-cover the existing validated stack (react-three-fiber, drei, postprocessing, Recharts, Next.js, Tailwind, Supabase, RunPod/TRIBE v2).

## Recommended Stack Additions

### Per-Vertex Color Mapping (Frontend)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| d3-scale-chromatic | 3.1.0 | Perceptually uniform color scales for heatmaps | Industry standard for scientific visualization. Provides `interpolateInferno`, `interpolatePlasma`, `interpolateViridis` -- all perceptually uniform sequential scales designed for continuous data. Tree-shakeable: import only the interpolator you need (~2KB). Already battle-tested in neuroimaging tools (Nilearn, MNE-Python use the same Matplotlib colormaps these derive from). |
| d3-color | 3.1.0 | RGB parsing/conversion from d3-scale-chromatic output | d3-scale-chromatic interpolators return CSS color strings like `"rgb(68, 1, 84)"`. d3-color parses these into {r, g, b} components needed to fill a Float32Array for Three.js BufferAttribute. Lightweight (~1.5KB). Peer dependency of d3-scale-chromatic. |
| d3-scale | 4.0.2 | `scaleSequential` to map activation values to [0, 1] domain | Provides `scaleSequential(interpolateInferno).domain([min, max])` -- the standard way to combine a data domain with a color interpolator. Handles clamping, inversion, and domain configuration. |

**Confidence:** HIGH -- d3-scale-chromatic is the de facto standard for scientific color mapping in JavaScript. Versions verified via npm registry.

**Why NOT a custom color ramp:** Custom linear interpolation between two colors (e.g., blue-to-red) creates perceptual non-uniformity -- middle values look muddy, equal data differences don't produce equal visual differences. Inferno/Plasma/Viridis solve this with years of color science research. Using d3 also gives users the option to switch between scales (accessibility: some users need colorblind-safe scales like Viridis).

**Why NOT colormap npm package:** The `colormap` package is unmaintained (last publish 2020), has fewer scale options, and produces arrays of hex strings rather than the continuous interpolation d3 provides.

### No New Three.js Dependencies Needed

Per-vertex coloring uses **built-in Three.js APIs** already available in the project's `three@^0.183.2`:

| API | What It Does | How We Use It |
|-----|-------------|---------------|
| `BufferAttribute` | Stores per-vertex data in GPU buffer | `new THREE.Float32BufferAttribute(colorArray, 3)` with 3 floats (RGB) per vertex |
| `geometry.setAttribute('color', ...)` | Attaches color attribute to geometry | Called once to add the color buffer to the brain mesh geometry |
| `attribute.needsUpdate = true` | Flags GPU buffer for re-upload | Set after updating color values when active time segment changes |
| `MeshStandardMaterial({ vertexColors: true })` | Tells material to read per-vertex colors | Replaces current emissive-only approach with vertex-colored rendering |

**Critical:** The current `BrainRegionMesh` component uses separate submeshes per region. Per-vertex heatmaps require a SINGLE unified mesh with a color attribute. This is an architecture change, not a library addition.

### Arousal/Valence Display

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| (no new deps) | -- | Arousal/valence gauges and charts | Recharts 3.8.1 (already installed) handles all needed chart types: `RadialBarChart` for circular gauges, `AreaChart` for temporal arousal/valence traces. No additional charting library needed. |

**Confidence:** HIGH -- Recharts already supports radial bar charts and area charts which cover all arousal/valence display patterns.

### Expanded Functional Networks (Backend -- Python)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| (no new deps) | -- | 5 additional network definitions | Nilearn's `fetch_atlas_surf_destrieux()` (already used in `atlas.py`) provides all 76 Destrieux parcels needed. The 5 new networks (visual, auditory, language, default mode, motion) map to existing Destrieux labels -- only `regions.py` needs new entries, no new Python packages. |

**Confidence:** HIGH -- the existing `build_region_masks()` function in `atlas.py` accepts arbitrary region definitions. Adding networks is a data change in `regions.py`, not a code/dependency change.

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| d3-scale-chromatic | 3.1.0 | Color interpolators | Every render of brain heatmap -- maps activation float to RGB |
| d3-color | 3.1.0 | Parse interpolator output to RGB components | Used inside the color mapping utility to extract r/g/b for BufferAttribute |
| d3-scale | 4.0.2 | Map data domain to interpolator input | Used to create the scale function that maps [VALUE_RANGE_MIN, VALUE_RANGE_MAX] to [0, 1] |

## Installation

```bash
# New frontend dependencies (from web/ directory)
npm install d3-scale-chromatic@3.1.0 d3-color@3.1.0 d3-scale@4.0.2

# TypeScript type definitions
npm install -D @types/d3-scale-chromatic@3 @types/d3-color@3 @types/d3-scale@4
```

```bash
# Backend -- NO new Python packages needed
# Just add new region definitions to src/region_mapping/regions.py
```

## Integration Points

### 1. Per-Vertex Heatmap Data Flow

```
TRIBE v2 output: (n_segments, 20484) float32 array
  |
  v  [RunPod handler -- already has this data, currently discards it]
API response: include raw vertex activations per segment
  |
  v  [Frontend receives vertex array]
d3-scale: scaleSequential(interpolateInferno).domain([-1.48, 1.80])
  |
  v  [Maps each of 20,484 floats to RGB]
d3-color: parse "rgb(r, g, b)" string to {r, g, b} components
  |
  v  [Pack into Float32Array of length 20484 * 3]
Three.js: geometry.setAttribute('color', new Float32BufferAttribute(array, 3))
  |
  v  [MeshStandardMaterial with vertexColors: true renders it]
```

### 2. GLB Mesh Change

The current `brain-fsaverage5.glb` contains 5 submeshes (attention, reward, emotional_processing, social_cognition, base). For per-vertex heatmaps, export a **single unified mesh** with all 20,484 vertices. The export script (`scripts/export_brain_glb.py`) needs modification:

- Export one mesh instead of 5 submeshes
- Preserve vertex ordering (must match TRIBE v2's fsaverage5 vertex indices exactly)
- Keep the submesh GLB as a fallback for the region-blob view mode

### 3. Expanded Networks -- New Destrieux Parcel Mappings

Add to `REGION_DEFINITIONS` in `src/region_mapping/regions.py`:

| Network | Key Destrieux Parcels | Neuroscience Basis |
|---------|----------------------|-------------------|
| visual_processing | G_occipital_sup, G_occipital_middle, S_calcarine, G_cuneus, S_oc_sup_and_transversal, Pole_occipital, G_oc-temp_lat-fusifor | Primary visual cortex (V1/V2) + ventral/dorsal streams |
| auditory_processing | G_temp_sup-G_T_transv (Heschl's gyrus), G_temp_sup-Plan_tempo, S_temporal_transverse | Primary auditory cortex (A1) + belt areas |
| language_narrative | G_front_inf-Triangular (Broca's), G_temp_sup-Lateral (Wernicke's), G_front_inf-Opercular, S_temporal_sup | Broca-Wernicke language circuit |
| default_mode | G_precuneus, G_cingul-Post-ventral, G_front_sup, G_temp_sup-Lateral, G_pariet_inf-Angular | Raichle (2001) default mode network |
| motion_processing | G_oc-temp_lat-fusifor, G_oc-temp_med-Parahip, S_oc-temp_lat, G_temporal_middle | MT/V5 + motion-sensitive temporal areas |

**Note:** Some parcels overlap with existing networks (e.g., `G_precuneus` in both social_cognition and default_mode, `G_front_inf-Opercular` in both attention and language). This is neuroanatomically valid -- the current codebase already documents this pattern.

### 4. Arousal/Valence Integration

The RunPod API response schema already includes `arousal` and `valence` fields per segment (documented in PROJECT.md). No backend changes needed. Frontend needs:
- Two `RadialBarChart` gauges (one for arousal, one for valence) showing current-segment values
- One `AreaChart` showing arousal and valence traces over time, synced to the current playback position

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| d3-scale-chromatic (interpolateInferno) | Custom 2-color gradient (blue-red) | Perceptually non-uniform. Middle values indistinguishable. Colorblind-unfriendly. |
| d3-scale-chromatic (interpolateInferno) | GPU shader-based color ramp | Unnecessary complexity. 20,484 vertices is trivial for CPU-side coloring (~1ms). Shader approach only justified at 100K+ vertices. |
| Single unified mesh | Keep 5 submeshes + overlay colors | Cannot color arbitrary vertices across region boundaries. Vertex indices must match TRIBE v2 output 1:1. |
| d3-color for RGB parsing | Manual regex on "rgb(r,g,b)" strings | Fragile. d3-color handles edge cases (clamping, alpha, color spaces). |
| Recharts RadialBarChart | Custom SVG gauge component | Already have Recharts. RadialBarChart does exactly what's needed. No reason to hand-roll. |
| Recharts AreaChart | Separate sparkline library | Same reasoning. One charting library, not two. |

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| colormap (npm) | Unmaintained since 2020, array-based output | d3-scale-chromatic |
| chroma-js | Larger bundle (~15KB), overlapping functionality with d3-scale-chromatic | d3-scale-chromatic + d3-color |
| @react-three/rapier or cannon | Physics engine -- not needed for heatmap visualization | Built-in Three.js vertex colors |
| niivue or brainbrowser | Full neuroimaging viewers -- massive overkill, bring own WebGL context | react-three-fiber + per-vertex colors |
| vtk.js | Volume rendering framework -- wrong tool for surface mesh coloring | Three.js BufferAttribute |
| deck.gl | Geospatial visualization -- wrong domain entirely | Three.js |
| Any new Python packages | All 9 networks use existing Destrieux atlas parcels | Just add entries to REGION_DEFINITIONS dict |

## Performance Considerations

### Vertex Color Updates (20,484 vertices)

- **Array size:** 20,484 vertices x 3 floats (RGB) x 4 bytes = **245 KB** per color buffer
- **Update frequency:** Only when user scrubs to a new 2-second segment (not every frame)
- **CPU cost:** d3 interpolation of 20,484 values takes ~1-2ms (measured in similar visualization projects)
- **GPU upload:** `needsUpdate = true` triggers a single `bufferSubData` call -- negligible for 245KB
- **Verdict:** CPU-side coloring is fine. No need for GPU shaders or web workers.

### Data Transfer (API to Frontend)

- **Per-segment vertex data:** 20,484 floats x 4 bytes = **80 KB per segment** (float32)
- **60-second video:** ~30 segments x 80KB = **2.4 MB total** (gzipped: ~800KB-1.2MB)
- **Recommendation:** Send as a flat Float32Array binary blob, not JSON. JSON encoding of 20,484 floats per segment would balloon to ~8MB+ for a 60s video. Use `ArrayBuffer` transfer or base64-encode the float32 data.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| d3-scale-chromatic@3.1.0 | d3-color@3.1.0, d3-interpolate@3.0.1 | Same major version family (D3 v7+). Peer deps satisfied. |
| d3-scale@4.0.2 | d3-scale-chromatic@3.1.0 | scaleSequential accepts any interpolator function. |
| three@0.183.2 | BufferAttribute vertex colors | Stable API since Three.js r130+. vertexColors on Material is a boolean (changed from enum in r136). Current version fully supports this. |
| react@19.2.4 | d3-scale-chromatic@3.1.0 | No React dependency in d3. Pure functions. |

## Sources

- [Three.js BufferGeometry docs](https://threejs.org/docs/#api/en/core/BufferGeometry) -- vertex color attribute API
- [Three.js Material.vertexColors](https://threejs.org/docs/#api/en/materials/Material.vertexColors) -- boolean property for vertex coloring
- [d3-scale-chromatic GitHub](https://github.com/d3/d3-scale-chromatic) -- v3.1.0, sequential/diverging color schemes
- [d3-scale-chromatic official docs](https://d3js.org/d3-scale-chromatic) -- interpolator API reference
- [D3 sequential schemes](https://d3js.org/d3-scale-chromatic/sequential) -- Inferno, Plasma, Viridis details
- [Nilearn Destrieux surface atlas](https://nilearn.github.io/dev/modules/description/destrieux_surface.html) -- 76 parcel labels
- [R3F scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) -- buffer update patterns
- npm registry: d3-scale-chromatic@3.1.0, d3-color@3.1.0, d3-scale@4.0.2 (verified 2026-04-10)

---
*Stack research for: NeuroCut v2.2 Enhanced Brain Analytics*
*Researched: 2026-04-10*
