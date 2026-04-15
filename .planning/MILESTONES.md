# Milestones

## v7.0 BrainRank Landing Page (Shipped: 2026-04-15)

**Phases completed:** 3 phases, 5 plans, 11 tasks

**Key accomplishments:**

- Scroll-triggered fade-in animations on all content sections using Framer Motion useInView, plus responsive layout with mobile DPR optimization for 3D brain

---

## Completed

### v1.0: Inference Pipeline (2026-04-07 — 2026-04-09)

**Goal:** Send a video URL to a RunPod endpoint and get back per-segment brain activation scores as JSON — proving the model works, the pipeline is viable, and inference time is acceptable.

**Phases:** 10 phases, all complete

1. Model Setup — TRIBE v2 cloned, installed, first inference on GPU
2. Output Mapping — 20,484 cortical vertices mapped to brain regions
3. Model Validation — GO decision: model differentiates engagement (Cohen d 0.40-1.02)
4. Container Foundation — Dockerfile with CUDA, Python 3.11, PyTorch, TRIBE v2
5. Container Verification — Full model load in container, image optimized
6. Handler Core — RunPod handler with input validation, video download
7. Handler Inference and Output — Full inference pipeline with error handling
8. RunPod Deployment — Live serverless endpoint on RunPod
9. End-to-End Validation — Pipeline test and benchmarking
10. Production Hardening — Progress updates, timing, timeout tuning

**Key outcomes:**

- TRIBE v2 inference works end-to-end on RunPod A40
- 759s total / 679s inference time for 60s video
- Async endpoint pattern (/run + polling) due to 12+ min inference
- Pre-computed brain region masks (no nilearn at runtime)
- CC BY-NC-4.0 license — non-commercial validation only

### v1.1: UI Audit & Consolidation (2026-04-09)

**Goal:** Analyze 13 Google Stitch-generated UI screens, consolidate duplicates, identify gaps, and produce a Stitch brief for final UI generation.

**Phases:** 4 phases, all complete

11. Screen Audit — 13 Stitch variants consolidated into 5 canonical screen specs
12. Component Catalog — 26 components, design tokens, 27 interaction patterns cataloged
13. Gap Analysis — 10 missing screens, states for all 15 screens, responsive specs
14. Stitch Brief — 1098-line consolidated brief for Google Stitch

**Key outcomes:**

- 13 exploratory Stitch screens consolidated to 5 canonical screens
- 10 missing screens identified and specced (auth, settings, errors, profile, empty state)
- Two Stitch briefs produced, both sent to Google Stitch
- 15 production-ready HTML screens received back from Stitch (batches 2+3)
- Complete design system documented (Neural Architect theme, tonal layering, Space Grotesk + Inter)

### v2.0–v3.0: Frontend Implementation & Brain Visualization (2026-04-09 — 2026-04-11)

**Goal:** Build the full NeuroCut web app with Next.js + Supabase, implement 3D brain viewer with per-vertex cortical heatmaps, and overhaul visualization UX.

**Phases:** Phases 15-43 across v2.0, v2.1, v2.2, v3.0
**Key outcomes:**

- Full Next.js app with auth, upload, results, dashboard, settings
- 3D brain viewer with per-vertex activation, dynamic glow, threshold-based display
- Neural timeline with peak markers, smooth transitions, video sync
- 9 functional brain networks mapped and visualized

### v4.0: Social Discovery Platform (2026-04-11 — 2026-04-12)

**Goal:** Add user identities, public sharing, and a neural-score-ranked discovery feed.

**Phases:** 8 phases (44-51), all complete

44. Social Schema & Identity — username, avatar, bio columns + RLS policies
45. Profile Customization — avatar upload, bio editor, profile settings
46. Public Profile Pages — /u/username with public analyses and stats
47. Privacy Controls & Sharing — public/private toggle, shareable links
48. Public Analysis View — scores-only public view with brain viewer
49. Discovery Feed — /discover with neural score ranking
50. Discovery Search & Filters — search by title/username, sort, filter
51. Social Engagement — view counts, bookmarks, /bookmarks page

**Key outcomes:**

- User profiles with unique usernames, avatars, and bios
- Public/private toggle on analyses with shareable links
- Discovery feed ranked by neural score (no social votes)
- View counts and bookmarks

### v5.0: Multi-Modal Input & Comparison (2026-04-12 — 2026-04-13)

**Goal:** Expand beyond video-only to support image and text neural testing, with side-by-side comparison.

**Phases:** 7 phases (52-58), all complete

52. Schema & Upload Type Selector — input_type column, upload type selector
53. Image Upload Pipeline — JPEG/PNG → silent video → TRIBE v2 inference
54. Text Spoken Mode — text → native TRIBE v2 TTS → audio inference
55. Text Visual Mode — text → styled card → image → video (Experimental)
56. Results Adaptations — conditional rendering for non-video content
57. Content Type Badges — Video/Image/Text + Exploratory badges everywhere
58. Comparison Page — side-by-side with metric deltas and cross-type disclaimers

**Key outcomes:**

- Multi-modal input: video, image (JPEG/PNG → video conversion), and text analysis
- Text spoken mode (TTS → audio inference) and visual mode (styled card → image → video)
- Content type badges and results page adaptations for non-video content
- Side-by-side comparison page for any two analyses

## In Progress
