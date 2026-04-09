# Requirements: NeuroCut UI Audit & Consolidation

**Defined:** 2026-04-09
**Core Value:** Consolidate 13 Stitch-generated UI screens into a canonical set and produce a clear brief for final UI generation

## v1.1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Screen Audit

- [ ] **AUDT-01**: Upload flow consolidated from 2 variants into 1 canonical screen spec
- [ ] **AUDT-02**: Processing flow consolidated from 2 variants into 1 canonical screen spec
- [ ] **AUDT-03**: Results flow consolidated from 6+ variants into canonical screen set (comparison view + single video detail)
- [ ] **AUDT-04**: Dashboard flow consolidated from 2 variants into 1 canonical screen spec
- [ ] **AUDT-05**: Each canonical screen documents: layout, components, interactions, states, and data requirements

### Component Catalog

- [ ] **COMP-01**: Shared components cataloged (nav sidebar, top bar, video player, timeline, metric cards, tags)
- [ ] **COMP-02**: Design tokens documented (colors, typography, spacing, elevation from DESIGN.md)
- [ ] **COMP-03**: Interaction patterns documented (timeline scrubbing, playback sync, keyboard shortcuts)

### Gap Analysis

- [ ] **GAPS-01**: Missing screens identified with specs (auth, settings, billing, errors, onboarding, profile)
- [ ] **GAPS-02**: Missing states identified per screen (loading, empty, error, disabled)
- [ ] **GAPS-03**: Missing responsive behaviors documented (mobile, tablet breakpoints)

### Stitch Brief

- [ ] **BRIEF-01**: Consolidated Stitch brief produced with canonical screens + gap screens
- [ ] **BRIEF-02**: Brief includes optimization notes (what to keep, what to change, what to add)
- [ ] **BRIEF-03**: Brief references design system tokens for consistency

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### UI Implementation

- **IMPL-01**: Frontend codebase scaffolded (Next.js, Tailwind, design tokens)
- **IMPL-02**: Canonical screens implemented from Stitch output
- **IMPL-03**: API integration with RunPod inference endpoint
- **IMPL-04**: Auth and user management

### Backend Scaffolding

- **BACK-01**: Supabase setup (auth, database, storage)
- **BACK-02**: R2/S3 for video storage with presigned URLs
- **BACK-03**: Credit system and Stripe integration

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Writing frontend code | This milestone produces specs/briefs only |
| Backend implementation | Deferred to future milestone |
| Design system creation | Using existing DESIGN.md from Stitch; catalog only |
| A/B comparison UX | Only single video analysis in v1 inference |
| Mobile app | Web-first |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDT-01 | Phase 11 | Pending |
| AUDT-02 | Phase 11 | Pending |
| AUDT-03 | Phase 11 | Pending |
| AUDT-04 | Phase 11 | Pending |
| AUDT-05 | Phase 11 | Pending |
| COMP-01 | Phase 12 | Pending |
| COMP-02 | Phase 12 | Pending |
| COMP-03 | Phase 12 | Pending |
| GAPS-01 | Phase 13 | Pending |
| GAPS-02 | Phase 13 | Pending |
| GAPS-03 | Phase 13 | Pending |
| BRIEF-01 | Phase 14 | Pending |
| BRIEF-02 | Phase 14 | Pending |
| BRIEF-03 | Phase 14 | Pending |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after roadmap creation*
