---
phase: 41-threshold-glow-legend
plan: 01
subsystem: brain-visualization
tags: [colormap, threshold-glow, tdd, brain-mesh]
dependency_graph:
  requires: []
  provides: [applyThresholdGlow, smoothstep, threshold-constants]
  affects: [BrainGlowMesh, colormap]
tech_stack:
  added: []
  patterns: [smoothstep-blending, HDR-vertex-colors, emissive-scaling]
key_files:
  created: []
  modified:
    - web/src/lib/colormap.ts
    - web/src/lib/colormap.test.ts
    - web/src/components/results/BrainGlowMesh.tsx
decisions:
  - Inferno colormap chosen over plasma for warm glow aesthetic on dark backgrounds
  - Threshold 0.3 with 0.1 blend width (0.25-0.35 smoothstep range)
  - Emissive scale 1.0-2.0 above threshold with HDR via toneMapped=false
metrics:
  duration: 164s
  completed: "2026-04-11T07:45:25Z"
  tasks: 2
  files: 3
---

# Phase 41 Plan 01: Threshold Glow Colormap Summary

Smoothstep-based threshold glow on brain mesh: vertices below 0.25 activation are dark gray (#1a1a1a), above 0.35 are inferno-mapped with emissive scaling up to 2x, with hermite blending at the boundary.

## Tasks Completed

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Add smoothstep and applyThresholdGlow with TDD tests | 8ab496b | colormap.ts: smoothstep, applyThresholdGlow, constants; colormap.test.ts: 12 new tests |
| 2 | Update BrainGlowMesh to use inferno + threshold glow | 59d51be | BrainGlowMesh.tsx: inferno LUT, applyThresholdGlow, toneMapped={false} |

## Implementation Details

### Task 1: Colormap Threshold Glow (TDD)

**RED phase:** Added 12 failing tests covering:
- smoothstep boundary cases (below edge0, above edge1, midpoint, at edges)
- applyThresholdGlow below-threshold dark gray output (values 0.0, 0.2)
- applyThresholdGlow above-threshold inferno+emissive output (values 0.5, 1.0)
- Boundary blend at 0.30 (smoothstep midpoint)
- Emissive scale verification at threshold (1.0) and max (2.0)

**GREEN phase:** Implemented in colormap.ts:
- `smoothstep(edge0, edge1, x)` -- standard hermite interpolation with clamping
- `applyThresholdGlow(values, lutData, target)` -- per-vertex threshold glow with blend
- Exported constants: THRESHOLD=0.3, BLEND_LOW=0.25, BLEND_HIGH=0.35, DARK_GRAY=0x1a/255, MAX_EMISSIVE=2.0

All existing functions (buildColormapLUT, applyColormapFromLUT, applyColormap) preserved.

### Task 2: BrainGlowMesh Integration

- Switched LUT from `plasma` to `inferno`
- Replaced `applyColormapFromLUT` with `applyThresholdGlow` in the color update effect
- Added `toneMapped={false}` to material for HDR vertex colors > 1.0
- Adjusted roughness 0.6 -> 0.7, metalness 0.2 -> 0.1

## Verification Results

- 18/18 unit tests pass (6 existing + 12 new)
- All acceptance criteria verified via grep checks
- No regressions in existing colormap functionality

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED
