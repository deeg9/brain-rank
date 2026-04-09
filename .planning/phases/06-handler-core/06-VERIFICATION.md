---
phase: 06-handler-core
verified: 2026-04-07T00:00:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
deferred:
  - truth: "Handler returns inference results (OutputSchema) after video download"
    addressed_in: "Phase 7"
    evidence: "Phase 7 goal: 'The handler runs TRIBE v2 inference, maps output to NeuroCut schema'; Phase 7 SC 1: 'Handler runs TRIBE v2 on a downloaded video and returns per-segment activation scores'"
---

# Phase 6: Handler Core Verification Report

**Phase Goal:** A RunPod handler accepts job input, validates it, and downloads video from URL
**Verified:** 2026-04-07T00:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Handler function conforms to RunPod serverless pattern and accepts a job with a video URL | VERIFIED | `handler(job)` in `src/handler.py` extracts `job["input"]`; `runpod.serverless.start({"handler": handler})` is last executable line (confirmed by AST + live check) |
| 2  | Model is loaded once at module level (container start) and reused across jobs | VERIFIED | `model = get_model()` at module level in `handler.py`; `get_model()` uses `_model` singleton with `global _model` guard; lazy `tribev2` import inside function body confirms no per-request reload |
| 3  | Requests missing a video URL or with invalid parameters are rejected with clear error messages | VERIFIED | `InputSchema` `field_validator` rejects: empty string, ftp/file/data schemes, missing `video_url`; live Python tests all passed; `handler()` wraps `InputSchema(**job_input)` in try/except returning `ErrorResponse` with `error_type="validation"` |
| 4  | Video is downloaded from URL to temp storage with size limit enforcement | VERIFIED | `download_video()` streams in 8KB chunks; checks `Content-Length` header AND accumulated byte count against `MAX_VIDEO_SIZE = 500MB`; `DOWNLOAD_TIMEOUT = 120s`; output path `/tmp/video_{job_id}.mp4`; live SSRF tests passed |

**Score:** 4/4 truths verified

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Handler returns inference results (OutputSchema) after video download | Phase 7 | Phase 7 goal covers TRIBE v2 inference and NeuroCut schema output; `TODO Phase 7` comment in `handler.py` line 59 is the documented stub |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/schema.py` | Pydantic input/output models for RunPod handler | VERIFIED | Exports `InputSchema`, `OutputSchema`, `Segment`, `RegionScores`, `Summary`, `ErrorResponse`; all models use `ConfigDict(strict=False)`; live instantiation tests passed |
| `src/model_loader.py` | Singleton TribeModel loader | VERIFIED | `get_model()` defined; `_model = None` at module level; lazy `tribev2` import inside function body; `perf_counter` timing; `logging.getLogger(__name__)`; no try/except around load (fail-fast confirmed by AST) |
| `src/video_fetcher.py` | Video download from URL with security and size controls | VERIFIED | Exports `download_video`, `_validate_url`, `MAX_VIDEO_SIZE`, `DOWNLOAD_TIMEOUT`, `CHUNK_SIZE`; SSRF prevention via `socket.getaddrinfo` + `ipaddress` checks; streaming byte count; partial file cleanup on error |
| `src/handler.py` | RunPod serverless handler entry point | VERIFIED | `runpod.serverless.start({"handler": handler})` as last line; module-level `model = get_model()`; input validation; download with error handling; `finally` cleanup block |
| `Dockerfile` | Updated CMD to run handler | VERIFIED | `CMD ["python", "-u", "src/handler.py"]` confirmed at line 89; old `verify_container.py` reference not in CMD |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/handler.py` | `src/schema.py` | `from src.schema import ErrorResponse, InputSchema` | WIRED | Confirmed in source; both `InputSchema` and `ErrorResponse` actively used in handler body |
| `src/handler.py` | `src/model_loader.py` | `from src.model_loader import get_model` | WIRED | `get_model()` called at module level (`model = get_model()`) |
| `src/handler.py` | `src/video_fetcher.py` | `from src.video_fetcher import download_video` | WIRED | `download_video(params.video_url, job_id)` called inside handler body |
| `Dockerfile` | `src/handler.py` | `CMD ["python", "-u", "src/handler.py"]` | WIRED | Confirmed at Dockerfile line 89 |
| `src/schema.py` | `handler.py` (downstream) | `InputSchema` used for job input validation | WIRED | Import and usage confirmed in handler.py |
| `src/model_loader.py` | `handler.py` (downstream) | `get_model()` at module level | WIRED | Confirmed at module level, not per-request |

### Data-Flow Trace (Level 4)

Not applicable — Phase 6 handler.py intentionally returns a placeholder dict (documented stub); actual inference data flow is Phase 7 work. Validation and download code paths do not render dynamic data requiring trace verification.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| InputSchema accepts valid HTTPS URL | `python3 -c "from src.schema import InputSchema; i = InputSchema(video_url='https://example.com/v.mp4'); assert i.video_url"` | PASS | PASS |
| InputSchema rejects missing video_url | `InputSchema()` raises `ValidationError` | PASS | PASS |
| InputSchema rejects ftp scheme | `InputSchema(video_url='ftp://evil.com/x')` raises exception | PASS | PASS |
| InputSchema rejects empty string | `InputSchema(video_url='')` raises exception | PASS | PASS |
| InputSchema rejects file:// scheme | `InputSchema(video_url='file:///etc/passwd')` raises exception | PASS | PASS |
| `_validate_url` rejects localhost (SSRF) | `_validate_url('http://127.0.0.1/evil')` raises `ValueError: URL resolves to a private IP address` | PASS | PASS |
| `_validate_url` accepts public HTTPS URL | `_validate_url('https://example.com/video.mp4')` returns URL unchanged | PASS | PASS |
| `MAX_VIDEO_SIZE` is 500MB | `assert MAX_VIDEO_SIZE == 500 * 1024 * 1024` | PASS | PASS |
| `DOWNLOAD_TIMEOUT` is 120s | `assert DOWNLOAD_TIMEOUT == 120` | PASS | PASS |
| model_loader: `get_model` function defined | AST check | PASS | PASS |
| model_loader: `_model` at module level | AST check | PASS | PASS |
| model_loader: tribev2 is lazy import | AST check — no tribev2 in top-level imports | PASS | PASS |
| model_loader: fail-fast — no try in get_model | AST check — 0 Try nodes in get_model body | PASS | PASS |
| handler.py: `runpod.serverless.start` is last line | AST check | PASS | PASS |
| handler.py: try/finally cleanup block | AST check — `finalbody` non-empty | PASS | PASS |
| Dockerfile CMD points to handler.py | `grep CMD Dockerfile` | `CMD ["python", "-u", "src/handler.py"]` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| HDLR-01 | 06-02-PLAN.md | RunPod handler function accepts job input with video URL and returns structured JSON | SATISFIED | `handler(job)` in `src/handler.py`; `runpod.serverless.start({"handler": handler})`; validated via AST and source inspection |
| HDLR-02 | 06-01-PLAN.md | Model loaded at module level (once at container start), reused across all jobs | SATISFIED | `model = get_model()` at module level in `handler.py`; singleton `_model` with lazy `tribev2` import in `model_loader.py` |
| HDLR-03 | 06-01-PLAN.md | Input validation rejects requests missing video URL or with invalid parameters | SATISFIED | `InputSchema` `field_validator` confirmed working: rejects missing, empty, ftp/file schemes; handler wraps in `ErrorResponse(error_type="validation")` |
| HDLR-04 | 06-02-PLAN.md | Video downloaded from URL to temp storage with size limit enforcement | SATISFIED | `download_video()` enforces `MAX_VIDEO_SIZE=500MB` via Content-Length header AND streaming byte count; 120s timeout; SSRF prevention; `/tmp/video_{job_id}.mp4` temp path |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/handler.py` | 40, 59 | `TODO Phase 7: run inference and return OutputSchema` | Info | Not a blocker — inference is Phase 7 scope (HDLR-05 through HDLR-09); documented in plan as known stub with explicit resolution path |

No blocker or warning anti-patterns found. The Phase 7 placeholder is intentional and documented.

### Human Verification Required

None. All Phase 6 success criteria (input validation, model singleton loading, video download with SSRF/size controls, and Dockerfile CMD) are fully verifiable programmatically. Phase 7 inference behavior is not in scope for this phase.

### Gaps Summary

No gaps. All four roadmap success criteria are satisfied:

1. Handler conforms to RunPod serverless pattern — confirmed by `runpod.serverless.start({"handler": handler})` as last executable line, and `handler(job)` function extracting `job["input"]`.
2. Model loads once at module level — `model = get_model()` outside handler function, singleton enforced by `_model` global, lazy tribev2 import preserves fail-fast on bad model.
3. Invalid requests rejected clearly — `InputSchema` field_validator rejects missing, empty, and non-HTTP(S) URLs before any work; `ErrorResponse` with typed `error_type` returned on failure.
4. Video downloaded with size limit enforcement — `download_video()` checks Content-Length header and streaming byte count against 500MB; 120s timeout; SSRF prevention blocks private IPs; temp file cleaned up in `finally` block.

The only stub in `handler.py` (returning `{"status": "video_downloaded"}` placeholder) is explicitly scoped to Phase 7 and is correctly deferred.

---

_Verified: 2026-04-07T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
