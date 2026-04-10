# Phase 30: Wave Loader - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

The processing wait state displays a neural signal wave animation instead of the current loading indicator. Adapts the 21st.dev "Wave Loader" component with NeuroCut neural signal aesthetic.

</domain>

<decisions>
## Implementation Decisions

### Component Design
- Create a WaveLoader component based on 21st.dev pattern
- Animated vertical bars that scale with staggered timing (neural signal / EEG aesthetic)
- Configurable bar count (default ~8-12 bars for neural signal look)
- Props: bars count, message text, color variant
- Use Framer Motion animate with infinite repeat

### Visual Adaptation
- Bar colors: gradient or alternating between primary (#ba9eff) and secondary (#5af8fb)
- Background: transparent (sits on existing processing page glass surface)
- Add optional "Analyzing neural patterns..." message below

### Integration Points
- Add to processing page alongside existing progress stages and percentage
- Does NOT replace status information — augments it visually
- Coexists with existing progress bar, stage labels (uploading, analyzing audio, encoding, predicting)

### Claude's Discretion
- Exact number of bars and their widths
- Whether bars scale Y or translate Y
- Animation duration and stagger delay
- Placement relative to existing progress indicators

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- web/src/lib/utils.ts — cn() utility
- framer-motion already installed
- web/src/app/processing/ — existing processing page

### Established Patterns
- Processing page polls job status via API
- Shows progress stages and percentage
- Uses Skeleton component for loading states

### Integration Points
- web/src/app/processing/page.tsx — add wave loader to existing layout
- Must not interfere with status polling or progress display

</code_context>

<specifics>
## Specific Ideas

The 21st.dev WaveLoader uses class-variance-authority for variants, Framer Motion animate with scaleY keyframes and staggered delays per bar. Simple and lightweight.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
