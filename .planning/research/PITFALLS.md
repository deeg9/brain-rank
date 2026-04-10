# Pitfalls Research

**Domain:** Per-vertex brain heatmaps, functional network expansion, arousal/valence display -- added to existing NeuroCut Three.js brain viewer
**Researched:** 2026-04-10
**Confidence:** HIGH (based on codebase analysis, Three.js ecosystem knowledge, neuroscience domain patterns)

## Critical Pitfalls

### Pitfall 1: Sending 20,484 Floats Per Segment as JSON

**What goes wrong:**
The current system sends 4 region averages per segment (~28 segments x 4 floats = 112 floats total). Per-vertex heatmaps would need 20,484 floats per segment. For 28 segments, that is ~573K floats. As JSON, each float like `-0.4827` takes 7-13 bytes of text encoding, ballooning the payload to 4-7 MB of JSON text. JSON parsing of this volume blocks the main thread for 50-200ms, causing visible UI jank during segment transitions.

**Why it happens:**
The existing API returns JSON with region scores. The naive approach is to add a `vertex_activations` array to the same JSON response. Developers think "it's just numbers" without calculating the actual payload size or parse cost.

**How to avoid:**
- Transfer vertex data as binary: Float32Array via ArrayBuffer, served as a separate binary endpoint or embedded as base64 in the response
- Use a separate endpoint that returns raw binary (`application/octet-stream`) with a known layout: `n_segments * 20484 * 4 bytes` = ~2.3 MB as raw Float32
- Alternative: quantize to Uint8 (0-255 range) if full float precision is unnecessary for visualization -- reduces to ~573 KB
- Keep the existing JSON response for region averages, arousal, valence; add a separate `vertex_data_url` field pointing to the binary blob

**Warning signs:**
- API response time increases by >500ms with no server-side change
- Browser devtools show >3 MB response size for results endpoint
- `JSON.parse` appearing in performance profiles during segment playback

**Phase to address:**
Backend/API phase -- must design the binary transfer format before building the frontend consumer

---

### Pitfall 2: Rebuilding GLB Mesh Architecture Without Migration Strategy

**What goes wrong:**
The current brain model (`brain-fsaverage5.glb`) uses 5 separate named submeshes (attention, reward, emotional_processing, social_cognition, base) -- visible in `export_brain_glb.py` and consumed by `BrainViewerCanvas.tsx` which iterates `REGION_NAMES` and looks up `nodes[name]`. Per-vertex heatmaps require a fundamentally different approach: a single unified mesh with vertex color attributes, because you cannot apply per-vertex colors across mesh boundaries where vertices have been duplicated and re-indexed. The existing `extract_submesh()` function remaps vertices into independent coordinate spaces -- the original 20,484 vertex indexing is lost. Attempting to map TRIBE v2's vertex-indexed output back onto split submeshes requires reverse-mapping that is error-prone and lossy (boundary vertices between regions get dropped by the `all(axis=1)` face extraction in `export_brain_glb.py` line 53).

**Why it happens:**
The original design was correct for its purpose: 4 discrete colored blobs with emissive intensity driven by a single score per mesh. But per-vertex heatmaps are a fundamentally different rendering paradigm. Teams try to retrofit vertex colors onto the existing split-mesh structure instead of creating a new unified mesh.

**How to avoid:**
- Create a NEW GLB export alongside the existing one: a single unified mesh preserving the original fsaverage5 vertex ordering (20,484 vertices, both hemispheres concatenated)
- Keep the existing split-mesh GLB for the region overlay visualization (the toggle buttons in `BrainViewer.tsx` still work for discrete region highlights)
- The unified mesh vertex ordering will naturally match TRIBE v2's output if exported directly from `nilearn.datasets.fetch_surf_fsaverage` without re-indexing
- `BrainViewerCanvas.tsx` needs a new code path: load unified mesh for heatmap mode, load split meshes for region mode

**Warning signs:**
- Vertex colors appear on wrong brain areas
- Gaps or seams visible at region boundaries
- Colors "pop" instead of smoothly interpolating across sulci

**Phase to address:**
First phase -- mesh export/data pipeline must be resolved before any frontend heatmap work

---

### Pitfall 3: useFrame Per-Vertex Color Updates Causing GC Pressure

**What goes wrong:**
The current `BrainRegionMesh.tsx` uses `useFrame` to lerp a single `emissiveIntensity` float per mesh -- trivially cheap. With per-vertex heatmaps, developers naively create a new `Float32Array` or `Color` array every frame to update vertex colors during segment transitions. Allocating 20,484 x 3 (RGB) = 61,452 floats per frame at 60fps creates massive garbage collection pressure. GC pauses cause visible stuttering in the 3D viewer.

**Why it happens:**
React-three-fiber's declarative model encourages creating new objects. Three.js's `BufferAttribute` requires calling `setAttribute` or setting `needsUpdate = true`. Developers allocate new arrays instead of mutating existing ones in place.

**How to avoid:**
- Pre-allocate a single `Float32Array(20484 * 3)` for vertex colors and a matching `BufferAttribute` at component mount
- During segment transitions, write new color values directly into the pre-allocated array using a for-loop, then set `colorAttribute.needsUpdate = true`
- For smooth lerping between segments, pre-allocate TWO arrays (current and target), and lerp in-place during `useFrame`
- Never use `Array.map()`, spread operators, or `new Float32Array()` inside `useFrame`
- Use `vertexColors: true` on the material and set `mesh.geometry.setAttribute('color', colorAttribute)` once

**Warning signs:**
- Chrome DevTools Memory tab shows sawtooth pattern with frequent GC
- Frame drops correlate with segment boundaries
- "Jank" reports in React Three Fiber performance monitor

**Phase to address:**
Frontend heatmap rendering phase -- core rendering loop design

---

### Pitfall 4: Region Overlap Creates Double-Counting in Expanded Networks

**What goes wrong:**
The current system already has intentional overlap: `Pole_temporal` appears in both `emotional_processing` and `social_cognition` (documented in `regions.py` line 49 and line 60). Adding 5 new networks (visual, auditory, language, default mode, motion) dramatically increases the overlap surface. A vertex belonging to 3 networks would have its activation counted 3 times in aggregate scores, inflating overall engagement metrics. Worse, the heatmap visualization must decide WHICH network's color to show for overlapping vertices.

**Why it happens:**
Brain networks genuinely overlap -- this is neuroanatomically correct. But the visualization and scoring systems were designed for mostly-disjoint regions. The current `combined_mask |= mask` in `export_brain_glb.py` (line 81) handles overlap by assigning shared vertices to whichever region is processed first in the loop.

**How to avoid:**
- For scoring: keep per-region scores independent (already done correctly in `scoring.py` -- each region averages its own mask independently). Document that regions overlap and scores should NOT be summed
- For visualization: implement a priority/blending system. Options:
  1. Show the network with highest activation at each vertex (winner-takes-all)
  2. Blend colors based on relative activation strength across overlapping networks
  3. Let the user select one network at a time (simplest, avoids the problem entirely)
- For the heatmap (single unified metric): use the raw vertex activation value, not the per-region average. This sidesteps the overlap problem entirely since you are visualizing raw data, not derived regions
- Track and document which Destrieux parcels are shared across networks

**Warning signs:**
- Summed engagement scores exceed the theoretical maximum
- Adding a new network changes scores of existing networks (it should not -- but if scoring changes, this is a regression)
- Users report "everything lights up" because most of the cortex is covered

**Phase to address:**
Region mapping expansion phase -- define overlap policy before adding new networks

---

### Pitfall 5: Destrieux Atlas Coverage Gaps Create Misleading "Dead Zones"

**What goes wrong:**
The current system covers ~46% of cortical vertices across 4 networks. Expanding to 9 networks will increase coverage but the Destrieux atlas has 148 parcels (74 per hemisphere), and not all map cleanly to functional networks. Vertices in the "base" mesh (uncovered areas) will appear dark/inactive in the heatmap view even though TRIBE v2 produces activation values for ALL 20,484 vertices. Users will misinterpret dark areas as "no brain activity" when they are actually "activity not mapped to any named network."

**Why it happens:**
The Destrieux atlas is a structural parcellation based on gyral/sulcal anatomy, not a functional one. Functional networks like "default mode" do not align perfectly with anatomical boundaries. Research shows that structurally-informed parcellations may not consistently reflect underlying functional network topography, and that atlases imposing network assignments based on gyral-based neuroanatomy perpetuate misconceptions about brain function.

**How to avoid:**
- The per-vertex heatmap should show ALL vertices with raw activation colors, independent of region assignment. This is the primary visualization
- Region overlays should be a SECONDARY layer -- toggle-able outlines or boundaries drawn on top of the continuous heatmap
- Never show a brain view where unmapped areas are invisible or visually indistinguishable from zero activation
- Add a tooltip or legend explaining "activation values are shown for all cortical vertices; named regions highlight areas associated with specific cognitive functions"

**Warning signs:**
- Large dark patches on the brain surface in areas known to be active (e.g., visual cortex when watching video)
- Users ask "why is half the brain not doing anything?"
- Coverage percentage does not increase as much as expected despite adding 5 networks

**Phase to address:**
Both the region mapping phase (ensure coverage is documented) and the frontend heatmap phase (ensure raw activation is the primary view)

---

### Pitfall 6: Bloom Post-Processing Destroys Heatmap Readability

**What goes wrong:**
The current `BrainViewerCanvas.tsx` uses `<EffectComposer>` with `<Bloom luminanceThreshold={0.2} intensity={1.5} />`. This works for the current design where emissive regions glow against a dark base mesh. But per-vertex heatmaps use continuous color gradients where precision matters -- bloom will bleed bright vertices into neighboring dim ones, washing out the heatmap and making it impossible to see fine-grained spatial patterns. High-activation regions will appear larger than they are, and the color-to-value mapping becomes unreliable.

**Why it happens:**
The bloom effect was tuned for aesthetic appeal with 4 glowing blobs, not for data visualization accuracy. Developers add the heatmap without revisiting post-processing settings.

**How to avoid:**
- Disable bloom when heatmap mode is active, or drastically reduce intensity (0.2-0.3 instead of 1.5)
- Use separate render layers: bloom applies only to region overlay meshes, not the heatmap mesh
- Consider replacing bloom with a subtle ambient occlusion effect that enhances the 3D perception without distorting colors
- Test the heatmap with bloom off first, then add back only if it genuinely improves readability

**Warning signs:**
- Heatmap colors appear washed out or overly bright
- Small hot spots appear much larger than their actual vertex extent
- Users cannot distinguish between adjacent activation levels

**Phase to address:**
Frontend heatmap rendering phase -- post-processing configuration

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| JSON for vertex data | No API changes needed | 3-5x payload bloat, main-thread parse blocking | Never for production; acceptable for a single-segment proof-of-concept |
| Keeping split meshes only | No GLB pipeline changes | Cannot render per-vertex heatmaps correctly | Never -- must create unified mesh for heatmaps |
| Hardcoded color scale range | Quick to implement | Cannot adapt to different video content ranges; TRIBE v2 value ranges vary by content | MVP only -- add auto-scaling in next iteration |
| Skipping segment interpolation | Simpler rendering logic | Jarring color jumps during playback | MVP only -- visually poor but functional |
| Single color ramp for all metrics | Fewer design decisions | Arousal, valence, and activation have different semantics (diverging vs sequential) | MVP only |
| Duplicating BrainViewerCanvas for heatmap mode | Avoid refactoring existing component | Two components to maintain, diverging behavior | Never -- use a mode prop or composition pattern |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TRIBE v2 vertex output -> frontend heatmap | Assuming vertex order in binary data matches GLB mesh vertex order | Verify fsaverage5 vertex ordering is preserved in GLB export. Use the same `nilearn.datasets.fetch_surf_fsaverage` source for both export and mapping |
| RunPod response -> binary vertex data | Trying to return binary data through RunPod's JSON response handler | Return vertex data as base64-encoded string in JSON, or store binary blob in a temporary URL (S3/R2) and return the URL in the JSON response |
| Bloom post-processing -> vertex colors | Bloom amplifies bright vertex colors, making low-activation areas invisible | Disable or reduce bloom when heatmap is active; apply bloom only to region overlay meshes |
| OrbitControls -> heatmap vertex inspection | Raycasting for vertex identification conflicts with orbit control drag events | Use `onPointerMove` with a debounce; only raycast when pointer is stationary for >200ms; disable raycasting during active orbiting |
| New regions -> existing toggle UI | Adding 9 toggle buttons to the existing horizontal button bar in `BrainViewer.tsx` | 9 buttons will not fit the current layout (currently 4 fit). Redesign as a grouped/collapsible panel or dropdown |
| Existing region scores -> new region scores | Assuming the scoring function needs changes when adding new regions | `scoring.py` already handles arbitrary region masks -- just pass the expanded `REGION_DEFINITIONS` to `build_region_masks()`. No scoring code changes needed |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-uploading vertex colors to GPU every frame | GPU usage spikes, frame rate drops below 30fps | Only call `needsUpdate = true` when segment actually changes, not every frame. Use a dirty flag | Immediately on integrated GPUs (laptops, most users) |
| Full 20,484-vertex color array computation on every segment change | 100-200ms pause during segment transitions | Pre-compute all segment color arrays client-side after data load; swap by reference on segment change | With >15 segments on mobile devices |
| Rendering heatmap + bloom + 9 region overlays simultaneously | Draw calls explode from 6 to 20+, frame budget exceeded | Heatmap mode disables region mesh overlays. Show one visualization paradigm at a time | On any mid-range device when all features enabled simultaneously |
| Fetching vertex data synchronously before showing results page | Results page blank for 2-5 seconds while binary data loads | Show region averages immediately (existing small payload); load vertex data in background; progressively enhance the viewer from blobs to heatmap | Always -- vertex data is 20-60x larger than region scores |
| Color-mapping 20,484 vertices from scalar to RGB in JavaScript per segment | 5-15ms per segment change, blocks main thread | Pre-compute color lookup table (256 entries); quantize vertex values to uint8; index into LUT instead of computing HSL/RGB per vertex | Noticeable on mobile; cumulative with other per-segment work |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing arousal and valence as raw numbers (-1.48 to 1.80) | Users have no reference frame for what "arousal: 0.73" means | Use labeled zones: "high energy + positive" = excited; "low energy + negative" = bored. Or use normalized 0-100 scales with descriptive labels |
| Using a rainbow colormap for heatmap | Perceptually non-uniform -- users see false boundaries; colorblind users cannot read it | Use a sequential colormap (viridis, inferno) or a diverging scale (blue-white-red) centered on zero |
| Labeling metrics with neuroscience jargon | Content creators do not know what "default mode network" or "dorsal attention" means | Use plain-language labels: "Mind Wandering" instead of "Default Mode Network", "Visual Processing" instead of "Dorsal Visual Stream" |
| Displaying arousal/valence without actionable context | Numbers without interpretation are meaningless to non-scientists | Show what the values MEAN for the video: "This segment is emotionally intense and positive -- viewers feel excited" |
| Showing all 9 regions simultaneously by default | Visual overload, nothing stands out, cognitive burden | Default to heatmap-only view; let users opt into specific region overlays. Show top 2-3 most activated regions as a starting point |
| Arousal and valence as separate line charts | Users cannot relate arousal to valence -- they are interdependent dimensions | Use a 2D scatter/trajectory plot (circumplex) showing how the video moves through arousal-valence space over time. Each segment is a point; connect sequentially to show emotional trajectory |
| Presenting arousal/valence alongside the already-rejected "virality score" pattern | Users who rejected hook/retention scores may distrust arousal/valence if presented as authoritative composite scores | Frame as descriptive ("what viewers likely feel") not predictive ("this will perform well"). The user explicitly rejected virality/hook/retention scores as unreliable |

## "Looks Done But Isn't" Checklist

- [ ] **Vertex color mapping:** Verified that vertex index 0 in TRIBE v2 output maps to vertex index 0 in the GLB mesh -- if misaligned, the heatmap shows scrambled colors across the brain
- [ ] **Hemisphere ordering:** Left hemisphere is vertices 0-10241 and right is 10242-20483 in BOTH the binary data and the GLB mesh -- swapping hemispheres creates a mirrored-brain bug that is hard to detect visually
- [ ] **Color scale normalization:** Confirmed the color scale is normalized per-video (not globally) -- TRIBE v2 value ranges vary by content (-1.48 to 1.80 for Sintel trailer but will differ for other videos)
- [ ] **Zero activation rendering:** Vertices with activation near zero are visually distinct from unmapped/hidden vertices -- dark blue should look different from invisible/black
- [ ] **Mobile WebGL compatibility:** Tested that the unified mesh + vertex colors render on mobile Safari/Chrome -- WebGL 1 has limits on vertex attribute count
- [ ] **Region score regression:** After adding new regions, verified that existing 4 region scores (attention, reward, emotional_processing, social_cognition) have NOT changed -- the scoring is independent per-mask but a bug in mask building could alter results
- [ ] **Arousal/valence sign convention:** Confirmed that positive valence means "positive emotion" and positive arousal means "high energy" in TRIBE v2's output -- sign conventions vary between neuroscience models
- [ ] **Segment boundary alignment:** Per-vertex data segments align temporally with the existing region-average segments -- an off-by-one in HRF delay application would misalign brain state with video position
- [ ] **Colormap accessibility:** Tested the heatmap colormap with colorblindness simulation tools (protanopia, deuteranopia) -- ~8% of male users are colorblind

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| JSON vertex payload too large | LOW | Add binary endpoint alongside existing JSON; frontend fetches both in parallel; no breaking change to existing API |
| Wrong vertex ordering in GLB | MEDIUM | Re-export GLB preserving original fsaverage5 vertex indices; frontend changes minimal if API contract is stable |
| GC pressure from per-frame allocations | LOW | Refactor to pre-allocated arrays; isolated to heatmap component; no API changes |
| Region overlap double-counting | LOW | Scoring already handles this correctly; only visualization layer needs fix |
| Rainbow colormap deployed | LOW | Swap colormap lookup table; purely visual change, no data impact |
| Arousal/valence misinterpreted by users | MEDIUM | Requires UX redesign of metric display; data is correct but presentation must change |
| Hemisphere swap bug | HIGH | Requires re-export of GLB AND re-verification of all region masks; subtle bug that could ship undetected for weeks |
| Bloom washing out heatmap | LOW | Toggle bloom off in heatmap mode; single line change in BrainViewerCanvas.tsx |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| JSON payload bloat | Backend API / data pipeline | Response size <3 MB; binary endpoint returns ArrayBuffer; `Content-Type: application/octet-stream` |
| GLB mesh architecture mismatch | Data pipeline / mesh export | New GLB has single mesh with 20,484 vertices matching TRIBE v2 output indices |
| useFrame GC pressure | Frontend heatmap rendering | Chrome Memory tab shows flat heap during 30s of segment playback; no GC pauses >16ms |
| Region overlap double-counting | Region mapping expansion | Unit test: existing 4 region scores unchanged after adding 5 new regions; overlap documented |
| Coverage gaps misleading users | Frontend heatmap rendering + UX | Raw activation heatmap is the default view; region overlays are secondary toggle |
| Bloom destroys heatmap | Frontend heatmap rendering | Bloom disabled or reduced in heatmap mode; colors match the colormap legend accurately |
| Arousal/valence presentation | UX / results display | User testing confirms creators understand what the metrics mean; framed as descriptive not predictive |
| Vertex ordering mismatch | Data pipeline / mesh export | Integration test: known activation pattern (e.g., visual cortex hot) renders on occipital lobe |
| Colormap accessibility | Frontend heatmap rendering | Colormap passes colorblindness simulation; diverging scale has luminance variation not just hue |
| Toggle UI overflow | Frontend UI | 9+ regions fit the layout without horizontal scrolling; grouped or collapsible design |

## Sources

- Codebase analysis: `export_brain_glb.py` (split mesh architecture, vertex remapping), `atlas.py` (Destrieux atlas loading, mask building), `regions.py` (region definitions, documented overlap), `scoring.py` (independent per-mask scoring), `BrainViewerCanvas.tsx` (current mesh loading, bloom post-processing), `BrainRegionMesh.tsx` (current emissive intensity lerping pattern)
- [Three.js forum: single mesh vs multiple meshes performance](https://discourse.threejs.org/t/performance-one-single-mesh-with-multiple-materials-or-scene-graph-multiple-objects-with-single-material/35157) -- 450% performance improvement from batching into single mesh
- [React Three Fiber: scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) -- LOD, buffer attribute management
- [React Three Fiber: buffer attribute update patterns](https://github.com/pmndrs/react-three-fiber/discussions/2318) -- ref-based mutation, needsUpdate flag
- [JSON vs binary payload performance](https://medium.com/hoppinger/profiling-the-hidden-costs-of-json-and-http-s-c8f327d5db89) -- float text encoding 3x larger than binary
- [Binary format benchmarks](https://github.com/zeenix/json-vs-bin) -- binary 10-16x faster than JSON for array data
- [Brain atlas concordance problem](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0007200) -- structural vs functional parcellation mismatch
- [Cortical atlas morphometricity](https://www.sciencedirect.com/science/article/pii/S0010945222003008) -- information loss in atlas-based parcellation
- [Russell's circumplex model of affect](https://psu.pb.unizin.org/psych425/chapter/circumplex-models/) -- arousal-valence visualization framework
- [Emotion-aware design](https://arxiv.org/html/2502.16038v3) -- valence-arousal-dominance space in UX

---
*Pitfalls research for: NeuroCut v2.2 Enhanced Brain Analytics -- per-vertex heatmaps, functional network expansion, arousal/valence display*
*Researched: 2026-04-10*
