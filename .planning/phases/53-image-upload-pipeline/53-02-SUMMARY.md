---
phase: 53-image-upload-pipeline
plan: "02"
subsystem: runpod-handler
tags: [image-conversion, moviepy, handler, inference-pipeline]
dependency_graph:
  requires: [52-01]
  provides: [image-to-video-conversion, image-input-handler]
  affects: [src/handler.py, src/schema.py]
tech_stack:
  added: [moviepy-imageclip, pillow-resize]
  patterns: [image-pad-letterbox, media-type-branching]
key_files:
  created:
    - src/image_converter.py
  modified:
    - src/schema.py
    - src/handler.py
decisions:
  - "Reuse _validate_url from video_fetcher for SSRF prevention on image downloads"
  - "Output video path follows /tmp/video_{job_id}.mp4 pattern for cleanup compatibility"
  - "Image cleanup happens in finally block of convert_image_to_video, not in handler"
metrics:
  duration: 111s
  completed: 2026-04-12T14:22:15Z
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 53 Plan 02: Image-to-Video Converter & Handler Integration Summary

Image-to-video conversion module using MoviePy ImageClip with 1280x720 letterbox padding, 10fps, no audio, and handler branching on input_type='image' with configurable duration (2-15s, default 6s).

## What Was Done

### Task 1: InputSchema image_duration field
- Added `image_duration: float = 6.0` field to InputSchema
- Added `@field_validator("image_duration")` enforcing 2.0-15.0s range
- Existing video/text validation unchanged
- **Commit:** 4211356

### Task 2: Image converter module and handler integration
- Created `src/image_converter.py` with three functions:
  - `download_image()`: Downloads image with SSRF prevention (reuses `_validate_url`), 50MB limit, 30s timeout
  - `resize_and_pad()`: Scales image to fit 1280x720 preserving aspect ratio, pads with black bars to exact 16:9
  - `convert_image_to_video()`: Orchestrates download + resize + MoviePy ImageClip conversion to MP4
- Modified `src/handler.py` to branch on `input_type == "image"`:
  - Image path: calls `convert_image_to_video(url, job_id, duration=params.image_duration)`
  - Video path: unchanged `download_video()` call
  - Rest of pipeline (inference, postprocess, cleanup) unchanged
- **Commit:** 0cc0362

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- InputSchema accepts image_duration with 6.0 default: PASS
- InputSchema rejects image_duration=1.0 (out of range): PASS
- image_converter.py parses correctly with all 3 functions: PASS
- All acceptance criteria grep checks: PASS
- Note: MoviePy import cannot be verified locally (container-only dependency)

## Known Stubs

None - all code paths are fully wired.
