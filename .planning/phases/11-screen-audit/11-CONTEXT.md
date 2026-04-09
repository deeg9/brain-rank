# Phase 11: Screen Audit - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Consolidate 13 Google Stitch-generated UI screens into canonical screen specs — one per flow step, no duplicates. Covers all 4 flows: Upload, Processing, Results, Dashboard. Output is structured markdown specs, not code.

Source files: /Users/deeg/Downloads/NeuroCutStitchUI/

</domain>

<decisions>
## Implementation Decisions

### Consolidation Strategy
- Best-of-breed merge: cherry-pick strongest elements from each variant into one spec
- A/B comparison views flagged as v2 — inference pipeline only does single video, so A/B UI is premature for now
- 2 canonical Results screens: Results Overview (metrics/timeline) + Detail View (full neural analysis with export)
- Video player is a placeholder with spec — document expected behavior, don't implement

### Spec Format & Depth
- Structured markdown with sections: Layout, Components, Interactions, States, Data
- Components described with props, variants, and states — enough for Stitch to generate correctly
- Include simple ASCII wireframes for layout grids — helps Stitch understand spatial relationships
- Reference Stitch source files with "keep/change/drop" annotations — preserves lineage

### Data & Integration
- Map UI fields to actual RunPod response schema — ensures UI is buildable
- Metrics not in TRIBE v2 output flagged as "derived" or "future" (Hook Score, Engagement IQ, etc.)
- Each data field tagged: real (from TRIBE v2), derived (computed from raw), or aspirational (no current source)

### Claude's Discretion
- Internal document structure and naming conventions
- Level of detail in ASCII wireframes
- Ordering of sections within each spec

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- No frontend code exists in this repo yet
- Stitch UI files at /Users/deeg/Downloads/NeuroCutStitchUI/ (13 HTML screens + DESIGN.md)
- Design system documented in neurocut_obsidian/DESIGN.md (colors, typography, components)
- Interaction guide in neurocut_key_interactions_guide.html

### Stitch Screen Inventory
**Upload Flow (2 variants):**
- upload_videos/code.html — dual A/B drop zones, cost estimate, AI stats
- upload_analysis_refined/code.html — enhanced styling, radial gradients, same function

**Processing Flow (2 variants):**
- processing_refined/code.html — centered layout, dual progress, inference logs
- processing_analysis/code.html — alternative labels "Neural Processing Cluster"

**Results Flow (6+ variants):**
- analysis_results/code.html — CORE: video comparison, multi-track timeline, 5 metric cards, AI recommendations
- single_video_neural_analysis/code.html — single video focus, waveform, tags, benchmarking
- final_results_neural_analysis/code.html — large player, high-density timeline
- neural_analysis_full_detail/code.html — professional display, focus regions, export/share
- results_with_emotional_tags_export/code.html — full analytics with sidebar nav, emotional tags, export
- results_with_neural_moments_tagging/code.html — tagging-focused view
- results_section_a_refined/code.html — refined section variant

**Dashboard Flow (2 variants):**
- dashboard_history/code.html — bento grid, job cards with thumbnails
- dashboard_job_history/code.html — data table, credits, system nodes

### Integration Points
- RunPod async endpoint: POST /run → poll /status/{job_id}
- Response includes per-segment activation scores (2-second windows)
- Mapped regions: attention, reward, emotional_processing, social_cognition
- Each segment has: activation, arousal, valence, region breakdown

</code_context>

<specifics>
## Specific Ideas

- The Stitch DESIGN.md establishes a "Neural Architect" creative north star — high-density, editorial-tech hybrid
- Design tokens are well-defined: primary (#ba9eff), secondary (#5af8fb), tertiary (#9bffce), error (#ff6e84)
- Typography: Space Grotesk (headlines) + Inter (body)
- "No-Line Rule" — boundaries through background shifts, not borders
- Glass & Gradient rule for CTAs and AI insight cards

</specifics>

<deferred>
## Deferred Ideas

- A/B comparison flow — flagged for v2 when multi-video inference is supported
- Real-time collaboration features (avatars, shared editing shown in some variants)
- PDF report generation
- Video player implementation details

</deferred>
