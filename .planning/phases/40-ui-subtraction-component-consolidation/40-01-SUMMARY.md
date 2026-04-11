---
phase: 40-ui-subtraction-component-consolidation
plan: 01
subsystem: brain-viewer
tags: [ui-subtraction, component-consolidation, refactor]
dependency_graph:
  requires: []
  provides: [BrainGlowMesh, simplified-brain-viewer]
  affects: [brain-viewer-canvas, results-page]
tech_stack:
  added: []
  patterns: [hardcoded-plasma-colormap, single-mesh-rendering]
key_files:
  created:
    - web/src/components/results/BrainGlowMesh.tsx
  modified:
    - web/src/components/results/BrainViewer.tsx
    - web/src/components/results/BrainViewerCanvas.tsx
  deleted:
    - web/src/components/results/BrainHeatmapMesh.tsx
    - web/src/components/results/BrainNetworkMesh.tsx
decisions:
  - Hardcoded plasma colormap in BrainGlowMesh (no user selection needed)
  - Kept controlsRef in BrainViewerCanvas for future Phase 42 auto-rotate
  - Kept BrainViewerProps interface unchanged to avoid touching consumer page
metrics:
  duration: 146s
  completed: "2026-04-11T07:22:43Z"
  tasks: 2
  files_changed: 5
---

# Phase 40 Plan 01: UI Subtraction & Component Consolidation Summary

Stripped all interactive controls from BrainViewer (mode toggle, colormap dropdown, 9 network filter buttons, 4 preset view buttons) and merged BrainHeatmapMesh + BrainNetworkMesh into a single BrainGlowMesh component with hardcoded plasma colormap and all Phase 39 GPU performance patterns preserved.

## What Was Done

### Task 1: Strip all controls from BrainViewer and clean header
- Removed 3 useState calls (viewMode, colormap, visibleRegions)
- Removed colormap selector dropdown, heatmap/regions mode toggle, 4 preset view buttons
- Removed region legend with 9 network filter buttons and score display
- Removed canvasRef, toggleRegion function, REGION_LABELS constant, RegionKey type
- Removed imports: COLORMAP_OPTIONS, ColormapName, BrainViewerCanvasHandle, REGION_COLORS, SegmentRegionScores, getRegionsAtTime
- Simplified header to icon + "Neural Activation Map" title only
- BrainViewerCanvas now receives only vertexData prop
- **Commit:** 51c5f03

### Task 2: Create BrainGlowMesh, simplify BrainViewerCanvas, delete old meshes
- Created BrainGlowMesh.tsx: renamed from BrainHeatmapMesh with hardcoded 'plasma' colormap
- Preserved all Phase 39 GPU performance patterns: buildColormapLUT, applyColormapFromLUT, DynamicDrawUsage, useFrame dirty-flag, pre-allocated Float32Array, cloned geometry with dispose
- Simplified BrainViewerCanvas: removed forwardRef, useImperativeHandle, mode switching, EffectComposer/Bloom
- Deleted BrainHeatmapMesh.tsx (logic moved to BrainGlowMesh)
- Deleted BrainNetworkMesh.tsx (fully replaced)
- TypeScript compiles cleanly (no errors in brain viewer files)
- **Commit:** e5226dd

## Lines of Code Impact

- BrainViewer.tsx: 187 lines -> 47 lines (-140 lines, -75%)
- BrainViewerCanvas.tsx: 108 lines -> 40 lines (-68 lines, -63%)
- BrainGlowMesh.tsx: 73 lines (new, based on BrainHeatmapMesh minus colormap prop)
- BrainNetworkMesh.tsx: 135 lines (deleted)
- BrainHeatmapMesh.tsx: 77 lines (deleted)
- **Net: -347 lines removed**

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

All created files exist. All deleted files confirmed removed. Both commit hashes found in git log.
