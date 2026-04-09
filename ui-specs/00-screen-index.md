# 00 Screen Index

## Screen Index

Master index of canonical screens for NeuroCut v1.1 UI. This document maps all 13 Google Stitch source files to their canonical spec destinations and documents the consolidation rationale used throughout the Phase 11 screen audit.

---

## Canonical Screens

| # | Screen | Spec File | Flow | Purpose |
|---|--------|-----------|------|---------|
| 1 | Upload | ui-specs/01-upload.md | Upload | Single video upload with drag-and-drop |
| 2 | Processing | ui-specs/02-processing.md | Processing | Job progress tracking via RunPod async polling |
| 3 | Results Overview | ui-specs/03-results-overview.md | Results | Summary metrics, activation timeline, video preview |
| 4 | Results Detail | ui-specs/04-results-detail.md | Results | Per-region deep dive, segment explorer, export |
| 5 | Dashboard | ui-specs/05-dashboard.md | Dashboard | Job history, quick stats, new analysis entry |

---

## Source File Mapping

| Source File | Canonical Spec | Consolidation Notes |
|-------------|---------------|---------------------|
| upload_videos/code.html | 01-upload.md | Base functional layout: drag-and-drop zone, file info, cost estimate |
| upload_analysis_refined/code.html | 01-upload.md | Enhanced styling cherry-picked (radial gradients, refined spacing); same functional structure |
| processing_refined/code.html | 02-processing.md | Base progress layout: centered status, progress bars, inference log panel |
| processing_analysis/code.html | 02-processing.md | "Neural Processing Cluster" branding considered; alternative labels for progress steps |
| analysis_results/code.html | 03-results-overview.md | CORE variant: video comparison layout, multi-track timeline, 5 metric cards, AI recommendations. A/B elements stripped to single-video for v1 |
| single_video_neural_analysis/code.html | 03-results-overview.md + 04-results-detail.md | Single video focus elements split across both specs: overview metrics to 03, waveform/tags/benchmarking to 04 |
| final_results_neural_analysis/code.html | 03-results-overview.md | Large player and high-density timeline elements cherry-picked for overview layout |
| results_section_a_refined/code.html | 03-results-overview.md | Refined section styling incorporated into overview spec |
| neural_analysis_full_detail/code.html | 04-results-detail.md | Primary source for detail view: focus regions, professional display, per-region breakdowns |
| results_with_emotional_tags_export/code.html | 04-results-detail.md | Export controls (PNG, PDF, JSON) and emotional tag patterns cherry-picked |
| results_with_neural_moments_tagging/code.html | 04-results-detail.md | Tagging interaction patterns: mark moments, add labels, segment annotations |
| dashboard_history/code.html | 05-dashboard.md | Bento grid card layout for job history; visual card design with thumbnails and score bars |
| dashboard_job_history/code.html | 05-dashboard.md | Data table layout with credits display; search input and column structure referenced |

---

## Consolidation Strategy

The screen audit used a **best-of-breed merge** approach across all 13 Stitch source files:

1. **Cherry-pick strongest elements** from each variant into one canonical spec per screen. No variant is used wholesale -- each spec combines the best layout, component, and interaction patterns from its source files.

2. **A/B comparison views deferred to v2.** The RunPod inference pipeline processes a single video at a time. All dual-video comparison UI (side-by-side thumbnails, A vs B score bars, "winner" badges) is stripped from v1 specs and noted in Deferred sections.

3. **Results split into 2 screens.** The 7 Results variants contained too much functionality for a single screen. Split into:
   - **Results Overview (03):** Summary metrics, activation timeline, video preview -- the "at a glance" view
   - **Results Detail (04):** Per-region deep dive, segment explorer, emotional tags, export -- the "full analysis" view

4. **All data fields tagged against RunPod OutputSchema.** Every UI field is classified as:
   - `real` -- Maps directly to `OutputSchema` / `Summary` / `Segment` / `RegionScores` from the inference endpoint
   - `derived` -- Computed from real data (averages, peaks, counts, formatting)
   - `aspirational` -- No current data source; requires future backend work

5. **Source lineage preserved.** Each spec includes a Source Files table with keep/change/drop annotations so the consolidation rationale is traceable.

---

## User Flow

```
Dashboard --> Upload --> Processing --> Results Overview --> Results Detail
    ^                                        |                    |
    |                                        v                    v
    +<-------------- Back to Dashboard <-----+--------------------+
```

**Primary path:** User lands on Dashboard, clicks "New Analysis", uploads a video, monitors processing, views results overview, drills into detail view.

**Return path:** From any results screen, user can navigate back to Dashboard via sidebar nav.

**Direct entry:** User can navigate directly to any screen via the sidebar, though Processing and Results require an active/completed job.

---

## Data Tag Legend

- **real** -- Field maps directly to `OutputSchema` from the RunPod inference endpoint. These values come from TRIBE v2 inference output: `Summary.overall`, `Summary.hook_score`, `Summary.retention_score`, `Segment.activation_score`, `RegionScores.*`, etc.

- **derived** -- Computed from real data. Examples: average scores across segments, peak moment identification, time formatting, percentage calculations, job counts. The raw data exists in `OutputSchema` but requires client-side computation or aggregation.

- **aspirational** -- No current data source exists. Requires future backend work to implement. Examples: credit/billing system, video thumbnails, AI recommendations, benchmark comparisons, collaborative features, PDF report generation.

---

## Non-Screen Files

The Stitch UI directory contains additional files that are not screen variants but serve as reference material:

| File | Type | Usage |
|------|------|-------|
| neurocut_key_interactions_guide.html | Interaction reference | Comprehensive interaction patterns (hover, click, drag, transitions) referenced in Component Catalog (Phase 12) |
| neurocut_product_description.html | Product brief | Product vision and marketing context; not a screen, used for understanding intent |
| neurocut_obsidian/DESIGN.md | Design system | Design tokens (colors, typography, spacing, elevation rules) referenced in all specs and detailed in Phase 12 Component Catalog |
