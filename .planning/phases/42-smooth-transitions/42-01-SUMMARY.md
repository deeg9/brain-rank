---
phase: 42-smooth-transitions
plan: 01
subsystem: brain-visualization
tags: [animation, interpolation, vertex-data, performance]
dependency_graph:
  requires: []
  provides: [smooth-segment-transitions, vertex-lerp-pipeline]
  affects: [BrainViewer, BrainGlowMesh, BrainViewerCanvas, brain-utils]
tech_stack:
  added: []
  patterns: [pre-allocated-buffers, zero-allocation-render-loop, blend-factor-interpolation]
key_files:
  created: []
  modified:
    - web/src/components/results/brain-utils.ts
    - web/src/components/results/BrainViewer.tsx
    - web/src/components/results/BrainViewerCanvas.tsx
    - web/src/components/results/BrainGlowMesh.tsx
decisions:
  - 300ms blend window before segment boundaries for smooth lerp transitions
  - Pre-allocated Float32Array lerpBuffer to avoid per-frame allocations
  - ~4Hz React state update rate is sufficient for 300ms transition (1-2 updates in blend window)
metrics:
  duration: 112s
  completed: "2026-04-11T07:58:45Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 42 Plan 01: Smooth Segment Vertex Interpolation Summary

Vertex activation lerp over 300ms at segment boundaries using pre-allocated buffers and getAdjacentSegments utility for zero-allocation blending.

## What Was Done

### Task 1: Add segment interpolation utility and update BrainViewer data flow (9c0182a)

Added `getAdjacentSegments()` to `brain-utils.ts` that returns `AdjacentSegmentResult` with `currentVertexData`, `nextVertexData`, and `blendFactor`. The blend factor ramps from 0 to 1 over the last 300ms before a segment boundary. Updated `BrainViewer.tsx` to use this new function, decoding both segment vertex arrays via `useMemo` keyed on base64 strings. Threaded `vertexDataA`, `vertexDataB`, and `blendFactor` through `BrainViewerCanvas` to `BrainGlowMesh`.

### Task 2: Implement per-frame vertex lerp in BrainGlowMesh (c8c38ab)

Added module-level `lerpVertexData()` helper that writes interpolated values into a pre-allocated `lerpBuffer` (no per-frame allocations). Updated the color update `useEffect` to conditionally lerp when `blendFactor > 0 && vertexDataB !== null`, or skip lerp overhead and use `vertexDataA` directly. The existing dirty-flag GPU sync pattern via `useFrame` remains unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] BrainViewerCanvas prop threading**
- **Found during:** Task 1
- **Issue:** Plan did not mention BrainViewerCanvas.tsx, but it sits between BrainViewer and BrainGlowMesh and needed its props updated to thread the new interpolation data through.
- **Fix:** Updated BrainViewerCanvasProps interface and component to accept and pass vertexDataA/vertexDataB/blendFactor instead of single vertexData.
- **Files modified:** web/src/components/results/BrainViewerCanvas.tsx
- **Commit:** 9c0182a

## Verification

- TypeScript compiles without errors in all modified files
- All acceptance criteria grep checks pass
- No new Float32Array allocations in render loop (lerpBuffer is pre-allocated via useMemo)
- Blend factor correctly clamps to [0, 1] range

## Self-Check: PASSED
