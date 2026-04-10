# Phase 25: Synced Video Player and Neural Timeline Scrubber - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the basic `<video>` element with a full-featured video player component that syncs bidirectionally with the NeuralTimeline. Scrubbing the timeline seeks the video; playing the video moves the timeline cursor. Real-time brain region values display at the current playhead position. Playback speed controls.

</domain>

<decisions>
## Implementation Decisions

### Video Player
- **D-01:** Use native HTML5 `<video>` element with a custom React wrapper (no third-party player library like react-player — keep it lean and controllable). The video URL comes from `results.video_url` which is already available on the page.
- **D-02:** Custom controls overlay matching the Neural Editorial design system — play/pause, progress bar, time display, speed selector (0.5x, 1x, 1.5x, 2x), volume. Dark glassmorphism surface.
- **D-03:** Player sits above the NeuralTimeline on the Results Detail page, replacing the current basic `<video controls>` element at line ~218 of `results/[id]/page.tsx`.

### Bidirectional Sync
- **D-04:** Shared `currentTime` state managed by the parent page (`results/[id]/page.tsx`) and passed to both VideoPlayer and NeuralTimeline via props/callbacks.
- **D-05:** Video → Timeline: `onTimeUpdate` event fires on the video (~4x/sec), updates `currentTime` state, NeuralTimeline renders a vertical playhead line at that position.
- **D-06:** Timeline → Video: Clicking/dragging on the NeuralTimeline sets `currentTime`, which seeks the video via `videoRef.current.currentTime = newTime`.
- **D-07:** The NeuralTimeline needs a new `currentTime` prop and an `onSeek` callback prop. The existing Recharts charts need a `ReferenceLine` or custom cursor at the current time position.

### Real-Time Region Values Display
- **D-08:** A floating panel or overlay shows the 4 brain region values (Attention, Reward, Emotional, Social) at the current playhead position. Updates in real-time as video plays or timeline is scrubbed.
- **D-09:** Find the closest segment to `currentTime` and display its `regions` values. Use the same color coding as the NeuralTimeline tracks (blue, purple, pink, amber).
- **D-10:** Display as a compact horizontal bar or overlay near the timeline, NOT a separate card — it should feel integrated with the scrubbing experience.

### Playback Speed
- **D-11:** Speed controls: 0.5x, 1x, 1.5x, 2x via `videoRef.current.playbackRate`. Dropdown or toggle buttons matching the design system.

### Timeline Scrubber Interaction
- **D-12:** Clicking anywhere on the NeuralTimeline area charts should seek to that timestamp. Not just hover — actual click-to-seek.
- **D-13:** Optional: draggable scrubber handle on the timeline that can be dragged left/right for fine scrubbing. Claude's discretion on whether this adds enough value vs click-to-seek.

### Claude's Discretion
- Exact layout of the speed controls (dropdown vs pill buttons)
- Whether to show a mini-waveform or progress bar on the video player itself
- Animation/transition for the playhead line moving across the timeline
- How to handle segments — interpolate between segments or snap to nearest
- Keyboard shortcuts (space for play/pause, arrow keys for seek)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Components
- `web/src/components/results/NeuralTimeline.tsx` — Current 4-track Recharts timeline (needs currentTime prop, onSeek callback, ReferenceLine)
- `web/src/app/(app)/results/[id]/page.tsx` — Results Detail page (parent component managing shared state)
- `web/src/components/results/SegmentTable.tsx` — SegmentData type with regions

### Design Reference
- `.planning/quick/260409-s0u-generate-stitch-design-screens-for-top-a/260409-s0u-SUMMARY.md` — Design spec for Results Detail layout

### Phase 24 Context
- `.planning/phases/24-results-detail-multi-track-neural-activation-timeline/24-CONTEXT.md` — Decisions about track colors, Recharts patterns, syncId usage
- `.planning/phases/24-results-detail-multi-track-neural-activation-timeline/24-RESEARCH.md` — Recharts research findings (syncId, gradients, tooltips)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NeuralTimeline` component already renders 4 synced AreaCharts with `syncId="neural-timeline"` — needs extension for playhead + click handler
- Basic `<video>` element already exists on the page (line ~218) with `results.video_url` as src
- `formatTimestamp` utility for time display
- `SegmentData.regions` has all 4 brain region scores per segment
- `TRACK_CONFIG` in NeuralTimeline.tsx has colors and labels for all 4 tracks
- CSS utilities: `glass-surface`, `glow-primary`, `ghost-border` available

### Established Patterns
- Client components with `'use client'`
- Dynamic imports with `{ ssr: false }` for Recharts (must continue for video player)
- Design system: surface-container backgrounds, Inter/Space Grotesk fonts, no borders

### Integration Points
- `results/[id]/page.tsx` is the parent — manages state, passes to VideoPlayer + NeuralTimeline
- NeuralTimeline.tsx needs new props: `currentTime`, `onSeek`
- New VideoPlayer component at `web/src/components/results/VideoPlayer.tsx`

</code_context>

<specifics>
## Specific Ideas

- User described this as THE killer interaction: "as you speed up or slow down the cursor on the timeline, it shows you the emotion. It will also rewind or speed up the video and then show you the neural activation timeline"
- The experience should feel like a professional video editor's timeline — smooth, responsive, premium
- The real-time region values should update fluidly as the cursor moves, not with jarring jumps
- Reference: Stitch Results Detail design shows a scrubber timeline with a playhead line spanning all tracks

</specifics>

<deferred>
## Deferred Ideas

- Thumbnail preview on timeline hover (like YouTube's preview thumbnails)
- Segment annotations/markers on the timeline (e.g., "Hook zone", "Drop-off risk")
- Side-by-side A/B video comparison with synced timelines
- Export specific segments as clips based on timeline selection

</deferred>

---

*Phase: 25-synced-video-player-and-neural-timeline-scrubber*
*Context gathered: 2026-04-10*
