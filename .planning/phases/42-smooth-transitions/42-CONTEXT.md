# Phase 42: Smooth Transitions - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Activation values interpolate smoothly between 2-second segments and the brain auto-rotates when the user is not interacting. Two distinct features: (1) temporal lerp between segment activation data, (2) idle auto-rotation with immediate pause on user interaction.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure/animation phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key parameters from success criteria:
- Lerp duration: ~300ms between segment boundaries
- Auto-rotate idle timeout: 3+ seconds after last user interaction
- Auto-rotate must pause immediately on grab and resume after idle timeout

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/components/results/BrainGlowMesh.tsx` — unified mesh with useFrame, DynamicDrawUsage, applyThresholdGlow
- `web/src/components/results/BrainViewerCanvas.tsx` — has OrbitControls
- `web/src/hooks/useVideoTime.ts` — provides currentTimeRef at display refresh rate
- `web/src/lib/colormap.ts` — applyThresholdGlow with smoothstep

### Established Patterns
- useFrame dirty-flag pattern for GPU sync
- Ref-based time for Three.js, React state for UI
- Float32Array colorBuffer with DynamicDrawUsage

### Integration Points
- BrainGlowMesh receives vertexData and applies threshold glow per frame
- BrainViewerCanvas renders OrbitControls — auto-rotate integrates here
- Segment boundaries detected from currentTimeRef changes

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
