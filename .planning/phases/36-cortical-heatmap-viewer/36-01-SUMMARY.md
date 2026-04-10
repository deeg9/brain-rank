---
phase: 36-cortical-heatmap-viewer
plan: 01
subsystem: frontend-visualization
tags: [3d-viewer, heatmap, vertex-colors, colormap, d3, three.js]
dependency_graph:
  requires: [34-vertex-data-pipeline, 35-unified-glb-mesh-export]
  provides: [per-vertex-heatmap-rendering, dual-view-mode, colormap-selection]
  affects: [BrainViewer, BrainViewerCanvas, results-page]
tech_stack:
  added: [d3-scale-chromatic, d3-interpolate, d3-color, d3-scale]
  patterns: [vertex-colors, buffer-attribute-mutation, conditional-postprocessing]
key_files:
  created:
    - web/src/lib/colormap.ts
    - web/src/components/results/BrainHeatmapMesh.tsx
  modified:
    - web/src/components/results/SegmentTable.tsx
    - web/src/components/results/brain-utils.ts
    - web/src/components/results/BrainViewerCanvas.tsx
    - web/src/components/results/BrainViewer.tsx
    - web/package.json
decisions:
  - Used useEffect instead of useFrame for colormap application to avoid 60fps * 20k vertex d3 calls
  - Default view mode set to heatmap as the headline v2.2 feature
  - Default colormap set to Plasma for best contrast on dark backgrounds
  - Bloom postprocessing conditionally disabled in heatmap mode to preserve colormap fidelity
metrics:
  duration: 193s
  completed: "2026-04-10T20:44:41Z"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 5
---

# Phase 36 Plan 01: Cortical Heatmap Viewer Summary

Per-vertex cortical heatmap rendering with d3 colormaps, dual view mode toggle, and colormap selection on the 3D brain viewer.

## What Was Built

### Colormap Utility (web/src/lib/colormap.ts)
- `applyColormap()` function maps 20,484 normalized activation values to RGB triplets using d3-scale-chromatic interpolators (Inferno, Plasma, Viridis)
- Mutates a pre-allocated Float32Array in-place to avoid GC pressure in the render loop
- Exports `ColormapName` type, `COLORMAP_OPTIONS` array for UI binding

### BrainHeatmapMesh Component (web/src/components/results/BrainHeatmapMesh.tsx)
- Loads brain-fsaverage5-unified.glb via useGLTF, clones geometry to avoid mutating cached original
- Pre-allocates Float32Array(20484 * 3) color buffer via useMemo
- Sets BufferGeometry color attribute with vertexColors: true on meshStandardMaterial
- Updates colors via useEffect only when vertexData or colormap changes (not every frame)
- Preloads unified GLB at module level

### Dual View Mode (BrainViewerCanvas + BrainViewer)
- BrainViewerCanvas conditionally renders BrainHeatmapMesh (heatmap mode) or existing BrainRegionMesh components (regions mode)
- EffectComposer/Bloom disabled in heatmap mode to preserve scientific colormap fidelity
- BrainViewer adds segmented Heatmap/Regions toggle in header bar
- Colormap dropdown (Plasma/Inferno/Viridis) appears only in heatmap mode
- Region legend (color dots + scores) hidden in heatmap mode
- Vertex data decoded from base64 per current timeline position using getVertexDataAtTime + decodeVertexData

### Data Flow Updates
- Added `vertex_data?: string` to SegmentData interface in SegmentTable.tsx
- Added `getVertexDataAtTime()` to brain-utils.ts mirroring getRegionsAtTime logic
- Results page requires no changes -- vertex_data flows through existing segments prop

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | a8c052f | Colormap utility, d3 deps, vertex_data typing, getVertexDataAtTime |
| 2 | fe2a9e7 | BrainHeatmapMesh with per-vertex coloring |
| 3 | f49381a | Dual view mode, colormap selector, vertex data wiring |

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **useEffect over useFrame for colormap**: Running d3 interpolators at 60fps for 20,484 vertices would be expensive. useEffect triggers only on vertexData/colormap changes (segment transitions or user selection).
2. **Plasma as default colormap**: Best perceptual contrast on dark backgrounds per CONTEXT.md guidance.
3. **Heatmap as default view mode**: This is the headline feature of v2.2 and should be the first thing users see.

## Verification

- TypeScript compilation passes (no errors in any modified/created files)
- Pre-existing Supabase type errors in jobs/route.ts and upload/actions.ts remain unchanged

## Self-Check: PASSED

All 2 created files and 5 modified files exist on disk. All 3 task commits verified in git log.
