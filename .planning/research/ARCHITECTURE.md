# Architecture Patterns: Per-Vertex Heatmaps, Functional Networks, Arousal/Valence

**Domain:** Enhanced brain analytics integration into existing NeuroCut pipeline
**Researched:** 2026-04-10
**Overall confidence:** HIGH (based on direct codebase analysis + established Three.js/neuroscience patterns)

## Current Architecture Summary

The existing pipeline flows:

```
TRIBE v2 model
  -> raw predictions: np.ndarray (n_segments, 20484)
  -> postprocessor: aggregate 20,484 vertices into 4 region means
  -> JSON API response: per-segment { activation, arousal, valence, regions: {4 floats} }
  -> Frontend: 4 named GLB submeshes colored uniformly by region score
```

**Key insight:** The raw 20,484-vertex data already exists at the postprocessor stage. It is discarded during aggregation. The new features recover and transmit this data.

---

## Recommended Architecture

### Data Flow: Per-Vertex Heatmaps

```
Backend (postprocessor.py)
  |
  | predictions: (n_segments, 20484) float32
  |
  v
  robust_normalize(aligned) -- already happens
  |
  v
  NEW: Encode full vertex array per 2-second window
  |     average 2 consecutive 1s segments -> (20484,) float32
  |     quantize float32 -> uint8 (0-255) -- 80x size reduction
  |     base64 encode -> ~27KB string per window
  |
  v
  JSON response with vertex_data field per segment
  |
  v
Frontend (BrainViewer)
  |
  | Decode base64 -> Uint8Array -> Float32Array (0.0-1.0)
  |
  v
  Set as vertex color attribute on UNIFIED brain mesh
  |
  v
  Three.js renders per-vertex heatmap via vertexColors
```

### Why Send Vertex Data to Frontend (Not Pre-Rendered Textures)

**Decision: Send quantized vertex arrays. Do NOT pre-render on backend.**

Rationale:
1. The GLB mesh already has 20,484 vertices matching the TRIBE v2 output 1:1 (both use fsaverage5)
2. Three.js `BufferGeometry.setAttribute('color', ...)` maps vertex colors directly -- no UV mapping needed
3. Backend rendering would require headless GL context on RunPod (unnecessary complexity)
4. Quantized uint8 vertex data is ~27KB/segment gzipped to ~8-12KB -- acceptable for 30 segments (~300KB total)
5. Frontend can interpolate between segments, apply custom colormaps, and respond to user interaction

### Why Quantize to uint8

- Raw float32: 20,484 * 4 bytes = ~80KB per window
- uint8: 20,484 * 1 byte = ~20KB per window
- Base64 of uint8: ~27KB per window
- With gzip: ~8-12KB per window (float data compresses well)
- For 30 windows (60s video): ~300-360KB total -- well within API limits
- Perceptual difference between 256 levels of activation is negligible on a color gradient

---

## Component Boundaries

### Backend Changes

| Component | Change Type | Responsibility |
|-----------|-------------|----------------|
| `src/schema.py` | **MODIFY** | Add `vertex_data: Optional[str]` to `Segment`, add new region fields to `RegionScores`, add arousal/valence composite fields to `Summary` |
| `src/postprocessor.py` | **MODIFY** | Encode per-window vertex arrays as base64 uint8, compute new network scores, compute arousal/valence composites for summary |
| `src/region_mapping/regions.py` | **MODIFY** | Add 5 new network definitions (visual, auditory, language, default_mode, motion) |
| `src/region_mapping/constants.py` | **MODIFY** | Add new region names to `NEUROCUT_REGIONS` list |
| `data/region_masks.npz` | **REGENERATE** | Run `scripts/generate_masks.py` after updating region definitions |
| `scripts/export_brain_glb.py` | **NO CHANGE** | Heatmap uses a single unified mesh, not per-region submeshes |

### Frontend Changes

| Component | Change Type | Responsibility |
|-----------|-------------|----------------|
| `web/src/components/results/SegmentTable.tsx` | **MODIFY** | Extend `SegmentRegionScores` interface with 5 new regions |
| `web/src/components/results/brain-utils.ts` | **MODIFY** | Add colors for new regions, add vertex data decode utility |
| `web/src/components/results/BrainViewerCanvas.tsx` | **MAJOR REWRITE** | Replace per-region submesh rendering with single unified mesh + vertex color heatmap |
| `web/src/components/results/BrainRegionMesh.tsx` | **REPLACE** | Replace with `BrainHeatmapMesh.tsx` using vertex color buffer attribute |
| `web/src/components/results/BrainViewer.tsx` | **MODIFY** | Add heatmap/region toggle, update legend for 9 networks |
| `web/src/app/(app)/results/[id]/page.tsx` | **MODIFY** | Add arousal/valence display cards |
| `web/src/components/results/BrainHeatmapMesh.tsx` | **NEW** | Unified brain mesh with per-vertex color attribute |
| `web/src/components/results/ArousalValenceCard.tsx` | **NEW** | Display component for arousal/valence metrics |
| `web/src/components/results/NetworkLegend.tsx` | **NEW** | Expandable legend for 9 functional networks |
| `web/src/lib/vertex-codec.ts` | **NEW** | Base64 decode + uint8-to-float conversion + colormap application |

---

## Detailed Integration Points

### 1. Backend: Vertex Data Encoding (postprocessor.py)

The existing `postprocess()` function already computes 2-second windows by averaging consecutive 1s segments. The vertex encoding slots into the existing window loop.

```python
# In the existing window construction loop (postprocessor.py line ~118-143):

import base64

# After computing window_preds (already a (1-2, 20484) array):
vertex_mean = window_preds.mean(axis=0)  # (20484,) -- mean of 1-2 segments
# Quantize to uint8 (0-255), already normalized to 0-1 by robust_normalize
vertex_uint8 = (np.clip(vertex_mean, 0, 1) * 255).astype(np.uint8)
vertex_b64 = base64.b64encode(vertex_uint8.tobytes()).decode('ascii')

# Pass to Segment constructor:
seg = Segment(
    ...,
    vertex_data=vertex_b64,  # NEW field
)
```

**Integration risk: LOW.** This is additive -- existing fields unchanged.

### 2. Backend: New Functional Network Definitions (regions.py)

Add 5 new networks using Destrieux atlas parcels that are neuroanatomically validated:

```python
# NEW entries in REGION_DEFINITIONS dict:

"visual_processing": [
    # Primary and early visual cortex (V1, V2, V3)
    "S_calcarine",              # Calcarine sulcus (V1)
    "G_cuneus",                 # Cuneus (V2/V3)
    "G_occipital_sup",          # Superior occipital gyrus
    "S_oc_sup_and_transversal", # Superior occipital sulcus
    "G_and_S_occipital_inf",    # Inferior occipital gyrus
    "G_oc-temp_lat-fusifor",    # Fusiform gyrus (face/object processing)
    "Pole_occipital",           # Occipital pole
    "S_oc_middle_and_Lunatus",  # Lunate sulcus
],

"auditory_processing": [
    # Primary and secondary auditory cortex
    "G_temp_sup-G_T_transv",    # Transverse temporal gyrus (Heschl's - A1)
    "S_temporal_transverse",    # Transverse temporal sulcus
    "G_temp_sup-Plan_polar",    # Planum polare (already in emotional_processing)
    "G_temp_sup-Plan_tempo",    # Planum temporale (already in social_cognition)
    "G_temp_sup-Lateral",       # Lateral STG (already in social_cognition)
],

"language_narrative": [
    # Broca's + Wernicke's + supporting areas
    "G_front_inf-Triangul",     # Pars triangularis (Broca's area)
    "G_front_inf-Opercular",    # Pars opercularis (Broca's - already in attention)
    "S_temporal_sup",           # Superior temporal sulcus (already in social_cognition)
    "G_pariet_inf-Angular",     # Angular gyrus (already in social_cognition)
    "G_temp_sup-Lateral",       # Lateral STG / Wernicke's area
    "G_temp_sup-Plan_tempo",    # Planum temporale
],

"default_mode": [
    # Default mode network (Raichle 2001, Buckner 2008)
    "G_precuneus",              # Precuneus (already in social_cognition)
    "G_cingul-Post-ventral",    # Posterior cingulate (already in social_cognition)
    "G_cingul-Post-dorsal",     # Dorsal posterior cingulate (already in emotional)
    "G_front_sup",              # Medial prefrontal (already in social_cognition)
    "G_front_middle",           # Middle frontal (already in attention)
    "G_pariet_inf-Angular",     # Angular gyrus (already in social_cognition)
    "G_rectus",                 # Medial orbital (already in reward)
    "Pole_temporal",            # Temporal pole (already in emotional/social)
],

"motion_processing": [
    # MT/V5 complex + associated motion areas
    "G_temporal_middle",        # Middle temporal gyrus (MT/V5 area)
    "S_temporal_inf",           # Inferior temporal sulcus
    "G_occipital_middle",       # Middle occipital gyrus (V3A/V3B)
    "G_oc-temp_med-Lingual",    # Lingual gyrus (motion processing)
    "S_oc-temp_lat",            # Lateral occipito-temporal sulcus
],
```

**Integration risk: LOW.** Parcels can overlap across networks (already the case with existing regions). The `build_region_masks()` function handles this -- each network gets its own boolean mask. Shared parcels are neuroanatomically valid (brain areas serve multiple functions).

**Confidence: MEDIUM.** The Destrieux-to-functional-network mapping is approximate. The Destrieux atlas is anatomical, not functional. These mappings are based on well-established neuroscience literature but are population-level approximations. This is acceptable for NeuroCut's purpose (engagement visualization, not clinical diagnosis).

### 3. Backend: Schema Changes (schema.py)

```python
class RegionScores(BaseModel):
    # Existing (keep for backward compatibility)
    attention: float
    reward: float
    emotional_processing: float
    social_cognition: float
    # New networks
    visual_processing: float = 0.0      # default for backward compat
    auditory_processing: float = 0.0
    language_narrative: float = 0.0
    default_mode: float = 0.0
    motion_processing: float = 0.0

class Segment(BaseModel):
    start: float
    end: float
    activation_score: float
    arousal: float
    valence: float
    regions: RegionScores
    vertex_data: Optional[str] = None  # base64-encoded uint8 vertex activations
```

**Backward compatibility:** New fields have defaults. Existing consumers see the same 4 regions plus optional new ones.

### 4. Frontend: Unified Heatmap Mesh (BrainHeatmapMesh.tsx)

The current architecture splits the brain GLB into 5 named submeshes (4 regions + base). For per-vertex heatmaps, we need a SINGLE unified mesh where each vertex gets an individual color.

**Two approaches considered:**

| Approach | Pros | Cons |
|----------|------|------|
| A: Load original fsaverage5 mesh as single geometry | Perfect 1:1 vertex mapping to TRIBE data | Need a new GLB with unified mesh |
| B: Merge existing submeshes in frontend | No new GLB needed | Vertex order scrambled by trimesh export -- CANNOT map back to TRIBE indices |

**Decision: Approach A -- generate a new unified GLB.**

The existing `export_brain_glb.py` splits vertices into submeshes using `extract_submesh()`, which remaps vertex indices. This means `nodes.attention.geometry` vertex 0 is NOT TRIBE v2 vertex 0. Reconstructing the original ordering from split submeshes is fragile and error-prone.

Instead, export a second GLB (`brain-fsaverage5-unified.glb`) with a single mesh node containing all 20,484 vertices in their original order. The existing region-split GLB remains for the legacy region view.

```python
# Addition to export_brain_glb.py:
unified_mesh = trimesh.Trimesh(vertices=coords, faces=faces, process=False)
trimesh.repair.fix_normals(unified_mesh)
unified_scene = trimesh.Scene()
unified_scene.add_geometry(unified_mesh, node_name="brain", geom_name="brain")
unified_scene.export(UNIFIED_OUTPUT_PATH)
```

**Frontend component pattern:**

```tsx
// BrainHeatmapMesh.tsx
function BrainHeatmapMesh({ vertexData }: { vertexData: Float32Array }) {
  const { nodes } = useGLTF('/models/brain-fsaverage5-unified.glb');
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = nodes.brain.geometry;

  useEffect(() => {
    // Apply per-vertex colors from decoded activation data
    const colors = applyColormap(vertexData); // (20484 * 3) RGB float array
    geometry.setAttribute('color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
    geometry.attributes.color.needsUpdate = true;
  }, [vertexData, geometry]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial vertexColors roughness={0.6} metalness={0.3} />
    </mesh>
  );
}
```

### 5. Frontend: Dual View Mode (BrainViewer.tsx)

The BrainViewer should support two modes:

1. **Heatmap mode** (NEW, default): Shows per-vertex activation intensity on unified mesh
2. **Network mode** (EXISTING): Shows 4-9 functional networks as colored regions

```tsx
// BrainViewer.tsx additions:
const [viewMode, setViewMode] = useState<'heatmap' | 'networks'>('heatmap');

// In render:
{viewMode === 'heatmap' ? (
  <BrainHeatmapMesh vertexData={currentVertexData} />
) : (
  // Existing BrainRegionMesh components (4 or 9 networks)
  {REGION_NAMES.map(name => (
    <BrainRegionMesh key={name} ... />
  ))}
)}
```

### 6. Frontend: Vertex Data Decoding (vertex-codec.ts)

```typescript
// vertex-codec.ts
export function decodeVertexData(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  // Convert uint8 (0-255) back to float (0.0-1.0)
  const floats = new Float32Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    floats[i] = bytes[i] / 255;
  }
  return floats;
}

export function applyColormap(
  activations: Float32Array,
  colormap: 'plasma' | 'viridis' | 'hot' = 'plasma'
): Float32Array {
  // Returns (N * 3) float array of RGB values
  const colors = new Float32Array(activations.length * 3);
  for (let i = 0; i < activations.length; i++) {
    const [r, g, b] = colormapLookup(activations[i], colormap);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  return colors;
}
```

### 7. Frontend: Arousal/Valence Display (ArousalValenceCard.tsx)

Arousal and valence are already computed per-segment in the backend (postprocessor.py lines 146-147). They are simple composites:

- **Arousal** = (attention + emotional_processing) / 2
- **Valence** = (reward + social_cognition) / 2

The results page already has these values in the segment data. The new component displays them prominently:

**Placement:** Below the video player, above the Neural Timeline + Brain Viewer grid. A horizontal card with two gauges/meters showing current arousal and valence at the playback position, plus sparklines showing their trajectory over the video.

```
[ Video Player                                                      ]
[ Arousal: [=====>     ] 0.67  |  Valence: [========>  ] 0.82      ] <-- NEW
[ Neural Timeline (col-span-6) | Brain Viewer (col-span-6)         ]
```

**No backend changes needed** for basic arousal/valence display -- the data already exists in `Segment.arousal` and `Segment.valence`.

**For summary-level composites** (overall arousal/valence), add to `Summary` schema:

```python
class Summary(BaseModel):
    overall: float
    hook_score: float
    retention_score: float
    peak_second: float
    peak_score: float
    # NEW
    mean_arousal: float = 0.0
    mean_valence: float = 0.0
    peak_arousal: float = 0.0
    peak_valence: float = 0.0
```

---

## Patterns to Follow

### Pattern 1: Additive Schema Evolution
**What:** Add new fields with defaults rather than changing existing fields.
**When:** Any schema change that could break existing stored results.
**Why:** Jobs already stored in Supabase have the old schema. New fields with defaults ensure old results still render.

### Pattern 2: Lazy Decode on Frontend
**What:** Only decode vertex_data for the segment currently being viewed, not all segments at once.
**When:** User scrubs the timeline.
**Why:** Decoding 30 base64 strings of 27KB each on page load would create a 200ms+ jank spike. Decode on demand and cache the last 3-5 decoded frames.

### Pattern 3: GLB Separation
**What:** Keep two GLB files -- region-split (existing) and unified (new).
**When:** Supporting both heatmap and network view modes.
**Why:** The region-split GLB has scrambled vertex indices that cannot map to TRIBE data. The unified GLB preserves the original fsaverage5 vertex ordering.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Sending Raw Float32 Arrays in JSON
**What:** Serializing 20,484 float32 values as JSON numbers per segment.
**Why bad:** 20,484 floats * ~8 chars each = ~160KB per segment as JSON text. For 30 segments = ~4.8MB of just vertex data. Base64 uint8 is 27KB/segment, ~810KB total, gzips to ~300KB.
**Instead:** Quantize to uint8, base64 encode.

### Anti-Pattern 2: Reconstructing Vertex Order from Split Meshes
**What:** Trying to merge the 5 existing GLB submeshes back into a 20,484-vertex mesh and map vertices.
**Why bad:** `export_brain_glb.py` uses `extract_submesh()` which remaps vertex indices. The "base" mesh vertices also lose their original indices. Reconstruction is fragile and requires maintaining a vertex index mapping.
**Instead:** Export a unified GLB that preserves original vertex ordering.

### Anti-Pattern 3: Running Colormap on Backend
**What:** Computing RGB colors for each vertex on the backend and sending RGB triples.
**Why bad:** Triples the data size (3x). Prevents the user from switching colormaps without re-requesting. Couples display logic to the inference pipeline.
**Instead:** Send scalar activation values, apply colormap on frontend.

### Anti-Pattern 4: Modifying the Existing GLB
**What:** Changing `brain-fsaverage5.glb` to be unified instead of region-split.
**Why bad:** Breaks the existing network view mode, which is still useful and already working.
**Instead:** Add a second GLB file. Load the one needed based on view mode.

---

## Scalability Considerations

| Concern | Current (30 segments) | At 120 segments (2min video) | At 300 segments (5min video) |
|---------|----------------------|------------------------------|------------------------------|
| JSON payload size | ~300KB gzipped | ~1.2MB gzipped | ~3MB gzipped |
| Frontend memory (decoded) | ~2.4MB (30 * 80KB) | ~9.6MB | ~24MB |
| Decode latency | <5ms per frame | <5ms per frame | <5ms per frame |

For videos beyond 2 minutes, consider:
- Sending vertex data at reduced temporal resolution (every 2nd window)
- Making vertex_data an optional field requested via `include_vertex_data: true` input parameter
- Streaming vertex data separately from the main JSON response

---

## Suggested Build Order

Based on dependency analysis, the recommended implementation order is:

### Phase 1: New Functional Networks (Backend Only)
1. Update `regions.py` with 5 new network definitions
2. Update `constants.py` with new region names
3. Regenerate `data/region_masks.npz`
4. Update `schema.py` (RegionScores with new fields)
5. Update `postprocessor.py` to compute new network scores
6. Test: existing pipeline still works, new regions appear in output

**Why first:** Zero frontend risk. Pure additive. Validates neuroscience mappings.

### Phase 2: Vertex Data Pipeline (Backend)
1. Add vertex data encoding to `postprocessor.py`
2. Add `vertex_data` field to `Segment` schema
3. Add `include_vertex_data` option to `InputSchema` (default false for backward compat)
4. Test: vertex_data appears in output, correct size, decodable

**Why second:** Backend must produce data before frontend can consume it.

### Phase 3: Unified GLB Export
1. Modify `export_brain_glb.py` to also export unified mesh
2. Generate `brain-fsaverage5-unified.glb`
3. Verify vertex count matches N_VERTICES (20,484)

**Why third:** Frontend heatmap component needs this asset.

### Phase 4: Frontend Heatmap Viewer
1. Create `vertex-codec.ts` (decode + colormap)
2. Create `BrainHeatmapMesh.tsx` (unified mesh + vertex colors)
3. Update `BrainViewerCanvas.tsx` with dual mode support
4. Update `BrainViewer.tsx` with heatmap/network toggle
5. Test: vertex data renders as smooth heatmap on brain

**Why fourth:** Depends on unified GLB + backend vertex data.

### Phase 5: Arousal/Valence Display + Network Legend
1. Create `ArousalValenceCard.tsx`
2. Create `NetworkLegend.tsx` for 9 networks
3. Update results page layout
4. Update `brain-utils.ts` with new region colors
5. Update `SegmentTable.tsx` types

**Why last:** Pure UI, no data dependencies, can be done in parallel with Phase 4.

---

## Sources

- Codebase analysis: `src/postprocessor.py`, `src/schema.py`, `src/region_mapping/`, `scripts/export_brain_glb.py`, `web/src/components/results/`
- [Three.js BufferGeometry vertex colors](https://dustinpfister.github.io/2023/01/20/threejs-buffer-geometry-attributes-color/) -- pattern for per-vertex coloring
- [Three.js Custom Shader Materials](https://blog.cjgammon.com/threejs-custom-shader-material/) -- custom attributes in shaders
- [Destrieux Atlas - Nilearn](https://nilearn.github.io/dev/modules/description/destrieux_surface.html) -- atlas label reference
- [Destrieux et al. 2010 - Automatic parcellation of cortical gyri and sulci](https://pmc.ncbi.nlm.nih.gov/articles/PMC2937159/) -- anatomical parcellation reference
- [Default Mode Network regions from Destrieux atlas](https://www.researchgate.net/figure/The-25-default-mode-network-regions-and-seed-points-are-based-on-the-Destrieux-atlas-The_fig1_377579316) -- DMN-to-Destrieux mapping
- [JSON compression with gzip](https://zuplo.com/learning-center/implementing-data-compression-in-rest-apis-with-gzip-and-brotli) -- payload size optimization
- [React Three Fiber documentation](https://r3f.docs.pmnd.rs/getting-started/introduction) -- R3F patterns
