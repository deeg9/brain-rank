---
phase: 06-handler-core
plan: 02
subsystem: handler
tags: [video-fetcher, handler, ssrf, runpod, serverless]
dependency_graph:
  requires: [06-01]
  provides: [handler-entry-point, video-download]
  affects: [Dockerfile]
tech_stack:
  added: [requests]
  patterns: [ssrf-prevention, streaming-download, try-finally-cleanup, singleton-model]
key_files:
  created:
    - src/video_fetcher.py
    - src/handler.py
  modified:
    - Dockerfile
decisions:
  - "Exceptions propagate from video_fetcher to handler for ErrorResponse wrapping"
  - "SSRF prevention resolves hostname and checks all returned IPs against private ranges"
  - "Partial file cleanup on size-limit violation during streaming download"
metrics:
  duration: 1min
  completed: 2026-04-09
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 6 Plan 2: Video Fetcher and Handler Entry Point Summary

Secure video download with SSRF prevention, 500MB size limit, and 120s timeout, wired into a RunPod serverless handler that validates input, downloads video, and cleans up temp files in a finally block.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create video fetcher with SSRF prevention and size limits | bf74e8b | src/video_fetcher.py |
| 2 | Create RunPod handler entry point and update Dockerfile CMD | 3bb51a9 | src/handler.py, Dockerfile |

## Deviations from Plan

None - plan executed exactly as written.

## Key Implementation Details

### Video Fetcher (src/video_fetcher.py)
- `_validate_url()` parses URL, resolves hostname via `socket.getaddrinfo`, checks all IPs against `ipaddress` module (is_private, is_loopback, is_reserved, is_link_local)
- `download_video()` streams in 8KB chunks, enforces 500MB via Content-Length header check AND streaming byte count
- Partial files cleaned up on any exception during download

### Handler (src/handler.py)
- `model = get_model()` at module level -- loads TribeModel once at container startup
- `handler(job)` validates via InputSchema, downloads video, returns placeholder for Phase 7
- Error handling: validation errors, request exceptions, ValueError (SSRF/size), and catch-all
- `finally` block ensures video_path.unlink() runs on every code path

### Dockerfile
- CMD changed from `scripts/verify_container.py` to `src/handler.py`

## Known Stubs

| File | Line | Stub | Resolution |
|------|------|------|------------|
| src/handler.py | 58 | TODO Phase 7: returns video_downloaded placeholder instead of inference results | Phase 7 will add inference and OutputSchema |

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|------------|
| T-06-04 (SSRF) | _validate_url resolves hostname, checks all IPs against private/loopback/reserved/link-local |
| T-06-05 (DoS - size) | Content-Length header check + streaming byte count, both against 500MB limit. 120s timeout. |
| T-06-07 (Info Disclosure) | ErrorResponse returns error message and type only, no stack traces or file paths |
| T-06-08 (DoS - temp files) | finally block ensures video_path.unlink() on every code path |

## Verification Results

- Video fetcher: all SSRF, scheme, and constant tests passed
- Handler: AST verification confirmed handler function, runpod.serverless.start, get_model(), finally block, ErrorResponse import
- Dockerfile: CMD updated, old verify_container.py reference removed from CMD

## Self-Check: PASSED

All files exist. All commits verified.
