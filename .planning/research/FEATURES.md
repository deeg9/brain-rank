# Feature Landscape

**Domain:** Per-vertex brain heatmaps, functional network mapping, arousal/valence display for neural engagement analytics
**Researched:** 2026-04-10

## Table Stakes

Features users expect when moving from 4-region blobs to full cortical visualization. Missing = upgrade feels half-baked.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Per-vertex color attribute on brain mesh | This IS the heatmap. Without per-vertex coloring, there is no spatial resolution upgrade. Three.js supports this natively via `BufferGeometry.setAttribute('color', ...)` with `vertexColors: true` on the material. | Medium | Existing `brain-fsaverage5.glb` mesh (20,484 vertices), TRIBE v2 raw predictions piped to frontend | Replace current `BrainRegionMesh` emissive glow with per-vertex color array. Each vertex gets an RGB value mapped from its activation scalar via a colormap. Must update every time segment changes. |
| Sequential colormap (cool-to-hot) | Standard in neuroimaging. Users familiar with brain activation maps expect blue-to-red or viridis-like gradients. A single emissive color per region is not a heatmap. | Low | Per-vertex color attribute | Implement as a JS function mapping 0-1 scalar to RGB. Use diverging cool-warm palette (blue=low, white=neutral, red=high) -- matches fMRI convention. Viridis is perceptually uniform but less intuitive for "brain heat." |
| Color scale legend | Without a legend, the heatmap is uninterpretable. Must show min/max values and color gradient. | Low | Colormap function | Simple horizontal gradient bar with "Low" / "High" labels. Position below or beside the 3D viewer. |
| Expanded functional networks (5 new regions) | PROJECT.md explicitly lists: visual processing, auditory processing, language/narrative, default mode, motion processing. These align with TRIBE v2's ICA-discovered networks. | Medium | Backend: new Destrieux parcel mappings in `regions.py`. Frontend: extended `SegmentRegionScores` type, new toggle buttons, new timeline tracks. | TRIBE v2's own ICA analysis reveals these 5 networks naturally. They are NOT arbitrary -- they reflect the model's learned functional organization. Yeo 7-network parcellation provides neuroscience backing. |
| Region toggle buttons for all 9 networks | Current UI has 4 toggle buttons. Must extend to 9. Critical for usability -- 9 simultaneous overlays would be visual noise. | Low | Expanded regions in data model | Layout challenge: 9 buttons in a row may overflow. Use 2-row grid or scrollable chip bar. Keep existing toggle pattern. |
| Arousal metric display | Already in `SegmentData` (computed as avg of attention + emotional_processing). Must be surfaced prominently on results page, not just buried in segment table. | Low | Existing `arousal` field in segment data | Currently only shown as a number in SegmentTable. Needs a dedicated MetricCard or gauge. |
| Valence metric display | Same as arousal -- already computed (avg of reward + social_cognition), needs prominent display. | Low | Existing `valence` field in segment data | Pair with arousal display. These two dimensions together map to Russell's circumplex model of affect. |
| Timeline tracks for new networks | Current NeuralTimeline shows 4 tracks. Must support 9. Cannot just add 5 more stacked rows -- would be too tall. | Medium | Expanded region data in API response | Need track grouping or selective display. Show 4 default, let user toggle additional tracks on/off. Or group by category: "Sensory" (visual, auditory, motion), "Cognitive" (attention, language, DMN), "Affective" (reward, emotional, social). |

## Differentiators

Features that set NeuroCut apart. Not expected in a basic upgrade, but valued by content creators.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Arousal-Valence scatter plot (circumplex) | Maps each segment as a dot on a 2D arousal (Y) x valence (X) plane. Shows emotional trajectory of the video at a glance. No competitor does this for video content. Based on Russell's circumplex model of affect -- instantly communicates "this segment is exciting and positive" vs "calm and negative." | Medium | Arousal and valence per segment (already computed) | Use Recharts ScatterChart or custom SVG. Quadrant labels: "Exciting/Positive" (top-right), "Exciting/Negative" (top-left), "Calm/Positive" (bottom-right), "Calm/Negative" (bottom-left). Color dots by time position to show trajectory. |
| Per-vertex data in API response | Send the full 20,484-vertex activation array per segment to the frontend for true spatial heatmap. Currently the backend aggregates to 4 scalar region scores and discards vertex data. | High | Backend schema change: add optional `vertex_activations: float[]` to Segment. Significant payload increase. | Key architectural decision. Options: (A) send all vertices for all segments (~2.4MB gzipped for 30 segments), (B) separate `/vertices/{job_id}` endpoint, (C) pre-compute vertex colors server-side. Recommend (A) with gzip for simplicity -- 2.4MB is acceptable for a results page that loads once. |
| Heatmap animation synced to video playback | As video plays, brain heatmap smoothly transitions between segment activations. Lerp between consecutive vertex arrays for fluid animation. | Medium | Per-vertex data available on frontend, video time sync (already exists via `currentTime`) | Use `useFrame` to lerp vertex color arrays between keyframes. Already have the pattern in `BrainRegionMesh` with `emissiveIntensity` lerping. Extend to lerp full Float32Array of colors. |
| Network overlay isolation mode | Click a network name to show ONLY that network's vertices highlighted, with the rest dimmed to base color. Different from toggle (which shows/hides geometry) -- this filters the heatmap to show activation only within one network's vertices. | Medium | Per-vertex data + region masks available on frontend | Requires shipping region mask definitions (vertex index arrays) to the frontend. ~40KB for all 9 masks as typed arrays. |
| Arousal/Valence timeline overlay | Add arousal and valence as overlay lines on the existing NeuralTimeline, providing a composite engagement view alongside individual region tracks. | Low | Existing arousal/valence data | Two additional line series on existing chart. Use dashed lines or different stroke style to distinguish from region tracks. |
| Peak moment highlighting | Auto-identify and visually mark the highest-activation moments on the brain viewer and timeline. "Your video peaks at 0:24 -- here's what the brain looks like." | Low | Existing `summary.peak_second` | Combine existing peak data with a "Jump to peak" button. Show the brain heatmap at that moment. |

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time vertex streaming via WebSocket | Massive over-engineering. Video is pre-processed, not live. All data is known upfront. | Load all vertex data at page load or lazy-fetch per segment via REST. |
| Volumetric (voxel) rendering | TRIBE v2 outputs on fsaverage5 surface mesh, not in volumetric MNI space. Building a volume renderer solves the wrong problem. NiiVue exists for this but is irrelevant here. | Stay with surface mesh rendering. The GLB already has the correct topology. |
| Custom atlas parcellation UI | Letting users define their own brain regions is a neuroscience research tool feature, not a content creator feature. | Ship 9 pre-defined networks. Hardcode in backend. |
| Statistical significance / p-values | TRIBE v2 predictions are point estimates, not statistical tests. Showing "p < 0.05" would be scientifically misleading. | Show raw activation values with clear "predicted activation" labeling. |
| Comparison between multiple videos | Explicitly out of scope per PROJECT.md. Requires solving normalization across different-length videos. | Single video analysis only. Defer to future milestone. |
| PDF/image export of brain visualization | Nice-to-have but not core to the analytics upgrade. Three.js canvas screenshots are unreliable across browsers. | Defer. If needed later, use `canvas.toDataURL()` as a quick path. |
| Subcortical structure rendering | Amygdala, ventral striatum, hippocampus are not on the cortical surface. TRIBE v2 does not predict subcortical activations (fsaverage5 is cortex only). | Acknowledge limitation in UI: "Cortical activation only." |

## Feature Dependencies

```
Backend: New region masks (regions.py)
  --> Backend: Extended RegionScores schema (schema.py)
    --> Backend: Per-vertex data in API response (postprocessor.py)
      --> Frontend: Parse extended API response (results.ts)
        --> Frontend: Per-vertex color attribute on mesh (BrainViewerCanvas.tsx)
          --> Frontend: Colormap function (brain-utils.ts)
            --> Frontend: Color scale legend (BrainViewer.tsx)
        --> Frontend: Heatmap animation sync (BrainRegionMesh.tsx)
        --> Frontend: Network overlay isolation

Backend: Extended RegionScores schema
  --> Frontend: Extended SegmentRegionScores type
    --> Frontend: Region toggle buttons for 9 networks
    --> Frontend: Timeline tracks for new networks
    --> Frontend: Arousal/Valence recalculation (if formula changes with new regions)

Existing arousal/valence data (no backend change needed)
  --> Frontend: Arousal metric card
  --> Frontend: Valence metric card
  --> Frontend: Arousal-Valence circumplex scatter plot
  --> Frontend: Arousal/Valence timeline overlay
```

## New Functional Network Definitions

Based on Yeo 7-network parcellation and TRIBE v2's ICA-discovered networks, the 5 new networks mapped to Destrieux atlas parcels:

| Network | Neuroscience Basis | Key Destrieux Parcels | Confidence |
|---------|-------------------|----------------------|------------|
| Visual Processing | Yeo Visual Network; TRIBE v2 ICA component | `S_calcarine`, `G_cuneus`, `S_oc_sup_and_transversal`, `G_occipital_sup`, `G_occipital_middle`, `S_oc_middle_and_Lunatus`, `Pole_occipital` | HIGH -- well-established primary visual cortex parcels |
| Auditory Processing | Yeo Somatomotor (auditory sub); TRIBE v2 ICA component | `G_temp_sup-G_T_transv` (Heschl's gyrus), `G_temp_sup-Plan_tempo`, `S_temporal_transverse`, `G_temp_sup-Lateral` | HIGH -- primary auditory cortex is well-localized |
| Language/Narrative | TRIBE v2 ICA component; Broca + Wernicke areas | `G_front_inf-Triangul` (Broca), `G_front_inf-Opercular`, `G_temp_sup-Lateral` (Wernicke overlap), `S_temporal_sup`, `G_pariet_inf-Angular` (semantic) | MEDIUM -- overlaps with attention and social networks |
| Default Mode Network | Yeo DMN; TRIBE v2 ICA component | `G_precuneus`, `G_cingul-Post-ventral`, `G_cingul-Post-dorsal`, `G_front_sup` (medial), `G_pariet_inf-Angular`, `G_temp_sup-Lateral` | HIGH -- one of the most replicated findings in neuroimaging |
| Motion Processing | TRIBE v2 ICA component; MT+/V5 complex | `G_occipital_middle` (V5/MT+), `G_temporal_middle`, `S_occipital_ant`, `G_and_S_occipital_inf` | MEDIUM -- MT+ localization on Destrieux requires careful vertex selection |

**Note:** Some parcels appear in multiple networks (e.g., `G_pariet_inf-Angular` in social_cognition, language, and DMN). This is neuroanatomically valid -- the same cortical region participates in multiple functional networks. This is already the pattern in the existing `regions.py` (e.g., `Pole_temporal` shared between emotional_processing and social_cognition).

## Data Size Estimates

| Data | Size (raw) | Size (gzipped) | Notes |
|------|-----------|----------------|-------|
| 1 segment vertex array (20,484 float32) | 80 KB | ~20 KB | Per-segment cost |
| 30 segments vertex data | 2.4 MB | ~600 KB | Typical 60s video |
| 9 region masks (boolean arrays) | 23 KB | ~3 KB | Ship once, cache forever |
| Current API response (30 segments, 4 regions) | ~8 KB | ~2 KB | Current baseline |

**Recommendation:** Add vertex data as optional field with `include_vertices: true` input parameter (InputSchema already has `include_raw: bool`). Reuse that flag or add a new one. Keep default response lean for clients that only need region scores.

## MVP Recommendation

**Phase 1 -- Backend extensions (no frontend changes):**
1. Add 5 new region definitions to `regions.py` -- Low complexity, pure data
2. Rebuild `region_masks.npz` with 9 regions -- Run `build_region_masks()` once
3. Extend `RegionScores` schema to include 9 region fields -- Breaking change for frontend type
4. Add per-vertex activation data to API response (optional field, gzipped)
5. Reconsider arousal/valence formulas now that 9 regions exist

**Phase 2 -- Frontend quick wins (uses existing data patterns):**
1. Arousal and Valence metric cards -- Low complexity, immediate visible improvement
2. Extended region toggle buttons (9 networks) -- Low complexity, extend existing pattern
3. Timeline track grouping with selective display

**Phase 3 -- Frontend heatmap (the headline feature):**
1. Per-vertex heatmap coloring on brain mesh -- Medium-High, replaces BrainRegionMesh pattern
2. Colormap function + legend -- Completes the heatmap UX
3. Heatmap animation synced to video playback

**Defer to later:**
- Arousal-Valence circumplex scatter plot
- Network overlay isolation mode
- Peak moment jump-to button

## Sources

- [TRIBE v2 GitHub Repository](https://github.com/facebookresearch/tribev2) -- output format, ICA network analysis
- [Meta AI Blog: TRIBE v2](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) -- architecture, functional networks
- [Yeo 2011 parcellation (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3174820/) -- 7-network functional parcellation
- [FreeSurfer Yeo2011 atlas](https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation_Yeo2011) -- atlas availability on fsaverage5
- [BrainBrowser](https://brainbrowser.cbrain.mcgill.ca/) -- reference web-based per-vertex surface visualization
- [three.js vertex colors example](https://threejs.org/examples/webgl_geometry_colors.html) -- native BufferGeometry vertex color support
- [three-brain-js](https://github.com/dipterix/three-brain-js) -- reference WebGL brain viewer
- [Russell's Circumplex Model](https://psychologyfanatic.com/circumplex-model-of-arousal-and-valence/) -- arousal-valence 2D emotion space
- [Colormap best practices (Matplotlib)](https://matplotlib.org/stable/users/explain/colors/colormaps.html) -- perceptual uniformity guidance
- Existing NeuroCut codebase: `src/region_mapping/`, `web/src/components/results/`
