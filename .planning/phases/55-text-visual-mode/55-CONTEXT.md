# Phase 55: Text Visual Mode - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable text visual mode: user enters text, selects a style template (Billboard/Social Post/General), submits with inputType='text_visual'. RunPod handler renders the text as a styled image card using Pillow (1280x720), converts to video via the existing image_converter from Phase 53, runs video-only inference, returns scores. The entire visual mode is labeled "Experimental".

</domain>

<decisions>
## Implementation Decisions

### Text Card Rendering (RunPod/Pillow)
- Rendering happens in RunPod handler using Pillow (already available from Phase 53)
- Card dimensions: 1280x720 (same as image conversion target)
- Use Pillow's default font at large size (no custom fonts in Docker)
- Three style templates:
  - Billboard: large bold white text centered on dark gradient background, 16:9
  - Social Post: card-style with rounded corner appearance, platform-style layout
  - General: centered text on solid dark background, clean typography

### Frontend Integration
- Same submit flow as spoken mode but with `inputType='text_visual'` and `textStyle` param
- Text sent to Supabase storage as .txt, URL passed to createJob
- Style template selector: 3 pill buttons (Billboard / Social Post / General) shown when Visual mode selected
- "Experimental" label on Visual toggle (already from Phase 52), also on submit button

### Claude's Discretion
- Exact Pillow drawing code for each template style
- Font size calculation based on text length
- Color choices for each template
- Whether to show a preview of the rendered card before submit

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `convert_image_to_video` from src/image_converter.py (Phase 53) — takes image path, returns video path
- Upload page Text tab with Spoken/Visual toggle (Phase 52)
- `uploadText` function in upload.ts (Phase 54)
- `createJob` with inputType and textStyle params (Phase 52)
- RunPod handler branching pattern (image branch in Phase 53, text_spoken in Phase 54)

### Integration Points
- Upload page: add style template pills when Visual mode selected, wire submit to createJob with 'text_visual'
- RunPod handler: add text_visual branch — render text card with Pillow, convert to video, run inference
- New file: src/text_renderer.py for Pillow rendering logic

</code_context>

<specifics>
## Specific Ideas

- Pillow flow: `Image.new('RGB', (1280, 720), bg_color)` → `ImageDraw.text()` → save as temp PNG → `convert_image_to_video(png_path, job_id)` → existing inference pipeline
- Reuse image_converter.py's `convert_image_to_video` function directly

</specifics>

<deferred>
## Deferred Ideas

- Live card preview before submit (would need server-side rendering endpoint)
- Custom font bundles in Docker container
- User-selectable colors/backgrounds

</deferred>
