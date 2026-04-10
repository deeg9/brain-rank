---
status: passed
verified_at: 2026-04-10
---

# Phase 36: Cortical Heatmap Viewer — Verification

## Results

**Status: PASSED**

### Success Criteria Check

1. ✅ BrainHeatmapMesh component renders per-vertex colored mesh using unified GLB + d3 colormaps
2. ✅ Dual view toggle (Heatmap/Regions) visible in brain viewer header — switches rendering mode
3. ✅ Colormap selector (Plasma/Inferno/Viridis) dropdown in header
4. ✅ Bloom disabled in heatmap mode, enabled in regions mode
5. ✅ Existing jobs without vertex_data gracefully fall back to regions view
6. ✅ No console errors, 0 warnings from new components

### Visual Verification

- Brain viewer header shows: Colormap dropdown, Heatmap/Regions toggle, Preset views (Front/Top/Left/Right)
- Regions view renders existing 4-region colored blobs with base mesh
- Heatmap mode ready for newly-processed videos with vertex_data

### Files Created/Modified

- `web/src/lib/colormap.ts` — Colormap utility with Inferno/Plasma/Viridis
- `web/src/components/results/BrainHeatmapMesh.tsx` — Per-vertex colored mesh
- `web/src/components/results/BrainViewerCanvas.tsx` — Dual view mode + conditional bloom
- `web/src/components/results/BrainViewer.tsx` — Toggle, colormap selector, vertex data flow
- `web/src/components/results/brain-utils.ts` — getVertexDataAtTime
- `web/src/components/results/SegmentTable.tsx` — vertex_data field
