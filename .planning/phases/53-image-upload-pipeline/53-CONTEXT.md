# Phase 53: Image Upload Pipeline - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable image upload (JPEG/PNG) on the upload page with validation, live preview, duration config slider, and transparent server-side conversion to video for TRIBE v2 inference. The user uploads an image and gets back neural activation scores identical in structure to a video job.

</domain>

<decisions>
## Implementation Decisions

### Image-to-Video Conversion
- Conversion happens in RunPod handler (FFmpeg + MoviePy already installed)
- Duration: 6s default, 2-15s slider for user config
- FPS: 10 FPS (matches Square Zero Labs approach)
- No audio track (silent video, audio=False) — video-only inference mode
- Use MoviePy `ImageClip` for conversion, then run existing video inference pipeline

### Upload & Validation UX
- Image preview via `URL.createObjectURL` — instant, no server round-trip
- Validation errors displayed inline below upload zone with shake animation (existing pattern)
- Duration config: slider with numeric display (6s default, 2-15s range) below image preview
- Max file size: 10MB (per requirements IMG-02)
- Min dimensions: 256px (per requirements IMG-02)

### RunPod Handler
- TRIBE v2 inference mode: `features_to_use: ["video"]` — video-only, skips LLaMA + WhisperX
- Converted video stored as temp file, deleted after inference
- Image resized to 1280x720 if larger, padded to 16:9 if needed (standard for V-JEPA2)

### Claude's Discretion
- Exact slider component styling
- Image upload area component (reuse AnimatedFileUpload with modified acceptedTypes, or new simpler component)
- RunPod handler branching logic structure
- Error handling for conversion failures

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AnimatedFileUpload` component — may be adapted for image files by changing acceptedTypes
- `InputTypeSelector` — already shows Image tab (Phase 52), needs to wire to real upload
- `createJob` server action — already accepts `inputType` param (Phase 52)
- `uploadVideo` function in `web/src/lib/upload.ts` — Supabase storage upload, may need an `uploadImage` variant
- RunPod `InputSchema` — already accepts `input_type: "image"` (Phase 52)

### Established Patterns
- Upload flow: file → Supabase storage → createJob(url, type) → RunPod dispatch → poll results
- RunPod handler: download media → process → inference → postprocess → return JSON

### Integration Points
- Upload page Image tab (currently placeholder, needs real upload UI)
- RunPod handler.py — needs image download + conversion branch
- Supabase storage — may need an `images` bucket or reuse `videos` bucket
- Results page — will show identical results (Phase 56 handles display adaptations)

</code_context>

<specifics>
## Specific Ideas

- Per Square Zero Labs: `ImageClip(path, duration=6).write_videofile(out, fps=10, codec="libx264", audio=False)`
- Video-only mode config: `config_update={"data": {"features_to_use": ["video"]}}`
- Duration slider should show seconds and update in real-time as user drags

</specifics>

<deferred>
## Deferred Ideas

- Ken Burns zoom effect on images (future enhancement)
- AI-generated motion from static images (Stable Video Diffusion — future premium feature)
- Batch image upload (multiple images at once)

</deferred>
