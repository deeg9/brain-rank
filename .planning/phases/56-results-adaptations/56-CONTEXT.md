# Phase 56: Results Adaptations - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure-like frontend phase)

<domain>
## Phase Boundary

Adapt the results page to render appropriately for non-video content types. Image jobs show the uploaded image as a static preview. Text jobs show the submitted text content. Neural timeline, brain viewer, and metric displays work identically regardless of content type. The video player is conditionally hidden for non-video jobs.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — this is a straightforward conditional rendering phase. Use the `input_type` field from the job data to determine what to render in place of the video player. Key guidance:
- Image results: show the uploaded image (from video_url which stores the image URL) as a static preview
- Text spoken results: show the submitted text content in a styled card
- Text visual results: show the submitted text content with the style template name
- Brain viewer, timeline, metrics, circumflex chart all render identically — no changes needed there

</decisions>

<code_context>
## Existing Code Insights

### Key Files
- web/src/app/(app)/results/[id]/page.tsx — Results page with video player + brain viewer + timeline
- web/src/lib/database.types.ts — Job interface with input_type, text_content, text_style fields

### Integration Points
- The results page fetches job data which now includes input_type, text_content, text_style
- The video player section needs conditional rendering based on input_type
- All other result components (brain viewer, timeline, metrics) are input-type-agnostic

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
