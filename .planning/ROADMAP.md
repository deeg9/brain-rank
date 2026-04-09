# Roadmap: NeuroCut

## Milestones

- ✅ **v1.0 Inference Pipeline** - Phases 1-10 (shipped 2026-04-09)
- 🚧 **v1.1 UI Audit & Consolidation** - Phases 11-14 (in progress)

## Phases

<details>
<summary>v1.0 Inference Pipeline (Phases 1-10) - SHIPPED 2026-04-09</summary>

- [x] **Phase 1: Model Setup** - Clone TRIBE v2, install dependencies, run first inference locally (completed 2026-04-08)
- [x] **Phase 2: Output Mapping** - Understand raw vertex output and define vertex-to-region mapping (completed 2026-04-08)
- [x] **Phase 3: Model Validation** - Confirm model differentiates content and benchmark local inference (completed 2026-04-08)
- [x] **Phase 4: Container Foundation** - Build Dockerfile with all dependencies and gated model access (completed 2026-04-08)
- [x] **Phase 5: Container Verification** - Full model load in container, image optimization, weights strategy (completed 2026-04-09)
- [x] **Phase 6: Handler Core** - RunPod handler entry point with input validation and video download (completed 2026-04-09)
- [x] **Phase 7: Handler Inference and Output** - Wire inference, output mapping, error handling, cleanup, logging (completed 2026-04-09)
- [x] **Phase 8: RunPod Deployment** - Account setup, image push, endpoint creation, async config (completed 2026-04-09)
- [x] **Phase 9: End-to-End Validation** - Full pipeline test and performance benchmarking on RunPod (completed 2026-04-09)
- [x] **Phase 10: Production Hardening** - Progress updates, timing, duration validation, timeout tuning (completed 2026-04-09)

</details>

### v1.1 UI Audit & Consolidation (In Progress)

**Milestone Goal:** Consolidate 13 Stitch-generated UI screens into a canonical set and produce a Stitch brief for final UI generation.

- [ ] **Phase 11: Screen Audit** - Consolidate all 4 flows from 13 Stitch screens into canonical screen specs
- [ ] **Phase 12: Component Catalog** - Extract shared components, design tokens, and interaction patterns
- [ ] **Phase 13: Gap Analysis** - Identify missing screens, states, and responsive behaviors
- [ ] **Phase 14: Stitch Brief** - Produce consolidated brief for final Stitch UI generation

## Phase Details

<details>
<summary>v1.0 Inference Pipeline - Phase Details (SHIPPED)</summary>

### Phase 1: Model Setup
**Goal**: TRIBE v2 is cloned, installed, and producing raw output for a test video on a remote GPU
**Depends on**: Nothing (first phase)
**Requirements**: MODL-01, MODL-02
**Success Criteria** (what must be TRUE):
  1. TRIBE v2 repository is cloned and all dependencies install without errors in a clean environment
  2. Running TRIBE v2 on a 60-second test video produces output without crashing
  3. Raw output tensor shape and format are visible and logged
**Plans:** 2/2 plans complete
Plans:
- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md

### Phase 2: Output Mapping
**Goal**: The raw cortical vertex output is fully understood and a vertex-to-region mapping is defined
**Depends on**: Phase 1
**Requirements**: MODL-03, MODL-04, MODL-06
**Success Criteria** (what must be TRUE):
  1. The 20,484 cortical vertex output format is documented
  2. A vertex-to-region mapping exists for attention, reward, emotional processing, and social cognition regions
  3. The 5-second hemodynamic delay is accounted for in temporal alignment
**Plans:** 2/2 plans complete
Plans:
- [x] 02-01-PLAN.md
- [x] 02-02-PLAN.md

### Phase 3: Model Validation
**Goal**: TRIBE v2 output meaningfully differentiates between video content types
**Depends on**: Phase 2
**Requirements**: MODL-05, MODL-07
**Success Criteria** (what must be TRUE):
  1. Two different videos produce measurably different activation scores
  2. Inference time for a 60-second video is measured and documented
  3. A go/no-go decision on model viability is recorded
**Plans:** 2/2 plans complete
Plans:
- [x] 03-01-PLAN.md
- [x] 03-02-PLAN.md

### Phase 4: Container Foundation
**Goal**: A Docker image builds with CUDA, Python 3.11, PyTorch, all TRIBE v2 dependencies
**Depends on**: Phase 3
**Requirements**: CNTR-01, CNTR-02, CNTR-03
**Plans:** 1/1 plans complete
Plans:
- [x] 04-01-PLAN.md

### Phase 5: Container Verification
**Goal**: The container loads all models on GPU and image is optimized
**Depends on**: Phase 4
**Requirements**: CNTR-04, CNTR-05, CNTR-06
**Plans:** 2/2 plans complete
Plans:
- [x] 05-01-PLAN.md
- [x] 05-02-PLAN.md

### Phase 6: Handler Core
**Goal**: RunPod handler accepts job input, validates it, downloads video
**Depends on**: Phase 5
**Requirements**: HDLR-01, HDLR-02, HDLR-03, HDLR-04
**Plans:** 2/2 plans complete
Plans:
- [x] 06-01-PLAN.md
- [x] 06-02-PLAN.md

### Phase 7: Handler Inference and Output
**Goal**: Handler runs inference, maps output, handles errors, cleans up
**Depends on**: Phase 6
**Requirements**: HDLR-05, HDLR-06, HDLR-07, HDLR-08, HDLR-09
**Plans:** 2/2 plans complete
Plans:
- [x] 07-01-PLAN.md
- [x] 07-02-PLAN.md

### Phase 8: RunPod Deployment
**Goal**: Containerized worker deployed as live RunPod serverless endpoint
**Depends on**: Phase 7
**Requirements**: DEPL-01, DEPL-02, DEPL-03, DEPL-04
**Plans:** 1/2 plans complete
Plans:
- [x] 08-01-PLAN.md
- [ ] 08-02-PLAN.md

### Phase 9: End-to-End Validation
**Goal**: Video URL sent to live endpoint returns correct JSON scores
**Depends on**: Phase 8
**Requirements**: DEPL-05, DEPL-06
**Plans:** 0/0 plans (validated during Phase 8)

### Phase 10: Production Hardening
**Goal**: Progress updates, timing, duration validation, timeout tuning
**Depends on**: Phase 9
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04
**Plans:** 0/0 plans (completed during Phase 8-9)

</details>

### Phase 11: Screen Audit
**Goal**: Every user flow has exactly one canonical screen spec with no duplicates or ambiguity
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: AUDT-01, AUDT-02, AUDT-03, AUDT-04, AUDT-05
**Success Criteria** (what must be TRUE):
  1. Upload flow has one canonical spec consolidating both Stitch variants, documenting layout, components, interactions, states, and data requirements
  2. Processing flow has one canonical spec consolidating both Stitch variants, documenting layout, components, interactions, states, and data requirements
  3. Results flow has a canonical screen set (comparison view + single video detail) consolidating 6+ Stitch variants, each documenting layout, components, interactions, states, and data requirements
  4. Dashboard flow has one canonical spec consolidating both Stitch variants, documenting layout, components, interactions, states, and data requirements
  5. A canonical screen index exists listing every screen with its source Stitch files and consolidation rationale
**Plans:** 3/3 plans complete
Plans:
- [x] 11-01-PLAN.md — Upload and Processing canonical specs
- [x] 11-02-PLAN.md — Results Overview and Results Detail canonical specs
- [x] 11-03-PLAN.md — Dashboard canonical spec and screen index
**UI hint**: yes

### Phase 12: Component Catalog
**Goal**: A complete inventory of reusable components, design tokens, and interaction patterns ready for implementation reference
**Depends on**: Phase 11
**Requirements**: COMP-01, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. Every shared component (nav sidebar, top bar, video player, timeline, metric cards, tags) is cataloged with props, variants, and usage locations across canonical screens
  2. Design tokens (colors, typography, spacing, elevation) are documented in a structured format extracted from DESIGN.md and validated against actual Stitch screen usage
  3. Interaction patterns (timeline scrubbing, playback sync, keyboard shortcuts) are documented with expected behaviors and edge cases
**Plans:** 2/2 plans complete
Plans:
- [x] 12-01-PLAN.md — Shared components catalog and design tokens
- [x] 12-02-PLAN.md — Interaction patterns reference
**UI hint**: yes

### Phase 13: Gap Analysis
**Goal**: Every missing screen, state, and responsive behavior is identified and specced so the Stitch brief covers the full product surface
**Depends on**: Phase 11, Phase 12
**Requirements**: GAPS-01, GAPS-02, GAPS-03
**Success Criteria** (what must be TRUE):
  1. Missing screens are identified and specced (auth, settings, billing, errors, onboarding, profile) with layout sketches and component references from the catalog
  2. Missing states are documented per canonical screen (loading, empty, error, disabled) with expected content and transitions
  3. Missing responsive behaviors are documented (mobile, tablet breakpoints) with layout adaptation notes per canonical screen
**Plans:** 1/1 plans complete
Plans:
- [x] 13-01-PLAN.md — Missing screens, states, and responsive behaviors
**UI hint**: yes

### Phase 14: Stitch Brief
**Goal**: A single consolidated brief that feeds into Google Stitch to generate production-ready UI screens covering the full product
**Depends on**: Phase 11, Phase 12, Phase 13
**Requirements**: BRIEF-01, BRIEF-02, BRIEF-03
**Success Criteria** (what must be TRUE):
  1. Consolidated Stitch brief exists covering all canonical screens plus gap screens in a format Stitch can consume
  2. Brief includes per-screen optimization notes stating what to keep from existing Stitch output, what to change, and what to add new
  3. Brief references design system tokens throughout for visual consistency across generated screens
**Plans:** 1 plan
Plans:
- [ ] 14-01-PLAN.md — Consolidated Stitch brief from all ui-specs sources
**UI hint**: yes

## Progress

**Execution Order:**
Phases 1-10: Complete (v1.0)
Phases 11-14: Phase 11 -> 12 -> 13 -> 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Model Setup | v1.0 | 2/2 | Complete | 2026-04-08 |
| 2. Output Mapping | v1.0 | 2/2 | Complete | 2026-04-08 |
| 3. Model Validation | v1.0 | 2/2 | Complete | 2026-04-08 |
| 4. Container Foundation | v1.0 | 1/1 | Complete | 2026-04-08 |
| 5. Container Verification | v1.0 | 2/2 | Complete | 2026-04-09 |
| 6. Handler Core | v1.0 | 2/2 | Complete | 2026-04-09 |
| 7. Handler Inference and Output | v1.0 | 2/2 | Complete | 2026-04-09 |
| 8. RunPod Deployment | v1.0 | 1/2 | Complete | 2026-04-09 |
| 9. End-to-End Validation | v1.0 | 0/0 | Complete | 2026-04-09 |
| 10. Production Hardening | v1.0 | 0/0 | Complete | 2026-04-09 |
| 11. Screen Audit | v1.1 | 3/3 | Complete    | 2026-04-09 |
| 12. Component Catalog | v1.1 | 2/2 | Complete    | 2026-04-09 |
| 13. Gap Analysis | v1.1 | 1/1 | Complete    | 2026-04-09 |
| 14. Stitch Brief | v1.1 | 0/1 | Not started | - |
