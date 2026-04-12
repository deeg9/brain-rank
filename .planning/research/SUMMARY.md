# Research Summary: v5.0 Multi-Modal Input & Comparison

**Synthesized:** 2026-04-12
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

## Executive Summary

NeuroCut v5.0 expands the video-only inference pipeline to accept images and text, plus a side-by-side comparison view. All three new input paths converge on the same TRIBE v2 output schema. Images convert to short silent videos on RunPod via FFmpeg. Text spoken mode passes directly to TRIBE v2's native `text_path` interface (handles TTS internally — zero conversion code needed). Text visual mode renders a Pillow image card then follows the image-to-video path. All paths return identical `(segments, predictions)` output — backend result schema, polling logic, and most frontend components require no changes.

The heaviest change is a full-stack schema migration adding `input_type`, `text_content`, and `text_style` columns to the `jobs` table — critical path, must land before any new pipeline code.

## Stack Additions

| Addition | Where | Why |
|----------|-------|-----|
| Pillow >= 12.2.0 | RunPod container | Image decode/resize, text card rendering (may already be transitive dep) |
| satori ^0.19.2 | Next.js | Server-side text card rendering as SVG (Vercel-standard OG image pipeline) |
| @resvg/resvg-js ^2.6.2 | Next.js | SVG-to-PNG conversion for satori output |

Everything else (MoviePy, FFmpeg, gTTS, Recharts, Three.js, Supabase) already installed.

## Feature Priorities

**Must ship:** Content type selector, image upload with preview, text spoken mode, text visual mode (experimental label), input_type column + badges, results conditional rendering, comparison page with analysis picker.

**Should ship:** Metric delta annotations, cross-type comparison disclaimers, "Exploratory" badge system for non-video scores.

**Defer:** Synchronized 3D brain viewers in comparison, shareable comparison links, batch comparison (3+ assets), AI recommendations.

## Architecture

- Single RunPod endpoint with discriminated union routing on `input_type`
- All conversion happens inside RunPod worker (FFmpeg + Pillow available)
- Schema: 3 new columns on `jobs` — `input_type TEXT DEFAULT 'video'`, `text_content TEXT`, `text_style JSONB`
- Comparison page is pure frontend — two parallel `GET /api/jobs/[id]` fetches, no new API routes
- No new API routes needed — existing `createJob` server action and `GET /api/jobs/[id]` handle everything

## Top Risks

1. **OOD scores** — Image/text-visual scores from out-of-distribution input; must label "Exploratory" everywhere
2. **gTTS reliability** — Calls Google's API from RunPod IPs; may be rate-limited under load; need offline fallback ready
3. **MoviePy ImageClip failures** — Needs explicit RGB conversion, 256px minimum, dimension validation
4. **Schema migration critical path** — `input_type` must be backfilled before any new code ships
5. **Cross-type comparison** — Must detect and disclaim; disable delta calculations across types

## Suggested Phase Structure (6 phases)

1. **Schema & Infrastructure Foundation** — `input_type` column, TypeScript types, backward-compatible RunPod InputSchema
2. **Image Upload Pipeline** — Image-to-video conversion, validates pattern text-visual reuses
3. **Text Spoken Mode** — Native TRIBE v2 `text_path`, validates gTTS reliability
4. **Text Visual Mode** — Pillow text rendering + image-to-video, ship as "Experimental"
5. **Results Adaptations & Content Type Badges** — Conditional rendering, Exploratory badges, dashboard/discovery icons
6. **Comparison Page** — Two parallel fetches, side-by-side results, cross-type disclaimers

## Confidence: HIGH

All deps verified, architecture based on direct codebase inspection + TRIBE v2 source analysis.

---
*Synthesized: 2026-04-12*
*Ready for roadmap: yes*
