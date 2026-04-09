# Roadmap: NeuroCut

## Milestones

- ✅ **v1.0 Inference Pipeline** - Phases 1-10 (shipped 2026-04-09)
- ✅ **v1.1 UI Audit & Consolidation** - Phases 11-14 (shipped 2026-04-09)
- 🚧 **v2.0 Frontend Implementation** - Phases 15-23 (in progress)

## Phases

<details>
<summary>✅ v1.0 Inference Pipeline (Phases 1-10) - SHIPPED 2026-04-09</summary>

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

<details>
<summary>✅ v1.1 UI Audit & Consolidation (Phases 11-14) - SHIPPED 2026-04-09</summary>

- [x] **Phase 11: Screen Audit** - Consolidate all 4 flows from 13 Stitch screens into canonical screen specs (completed 2026-04-09)
- [x] **Phase 12: Component Catalog** - Extract shared components, design tokens, and interaction patterns (completed 2026-04-09)
- [x] **Phase 13: Gap Analysis** - Identify missing screens, states, and responsive behaviors (completed 2026-04-09)
- [x] **Phase 14: Stitch Brief** - Produce consolidated brief for final Stitch UI generation (completed 2026-04-09)

</details>

### 🚧 v2.0 Frontend Implementation (In Progress)

**Milestone Goal:** Build the NeuroCut web app from 15 Stitch-generated screens, wire it to the live RunPod inference endpoint, and ship a working product.

- [ ] **Phase 15: Project Scaffold & Design System** - Next.js app with design tokens, reusable components, and routing
- [ ] **Phase 16: Backend Foundation** - Supabase auth and database schema for jobs
- [ ] **Phase 17: Authentication Flow** - Login, signup, session persistence, route protection, onboarding
- [ ] **Phase 18: Upload & Processing** - Video upload UI, cloud storage, processing screen with status polling
- [ ] **Phase 19: API Integration** - RunPod proxy routes and job status management
- [ ] **Phase 20: Results Display** - Neural activation results with timeline, region breakdown, and export
- [ ] **Phase 21: Dashboard** - Job history list, navigation to past results, empty state
- [ ] **Phase 22: Settings & Profile** - Account settings, notifications, billing page, profile with stats
- [ ] **Phase 23: Error Handling** - 404, 500, and offline error pages

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

<details>
<summary>v1.1 UI Audit & Consolidation - Phase Details (SHIPPED)</summary>

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
- [x] 11-01-PLAN.md
- [x] 11-02-PLAN.md
- [x] 11-03-PLAN.md
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
- [x] 12-01-PLAN.md
- [x] 12-02-PLAN.md
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
- [x] 13-01-PLAN.md
**UI hint**: yes

### Phase 14: Stitch Brief
**Goal**: A single consolidated brief that feeds into Google Stitch to generate production-ready UI screens covering the full product
**Depends on**: Phase 11, Phase 12, Phase 13
**Requirements**: BRIEF-01, BRIEF-02, BRIEF-03
**Success Criteria** (what must be TRUE):
  1. Consolidated Stitch brief exists covering all canonical screens plus gap screens in a format Stitch can consume
  2. Brief includes per-screen optimization notes stating what to keep from existing Stitch output, what to change, and what to add new
  3. Brief references design system tokens throughout for visual consistency across generated screens
**Plans:** 1/1 plans complete
Plans:
- [x] 14-01-PLAN.md
**UI hint**: yes

</details>

### Phase 15: Project Scaffold & Design System
**Goal**: Developers have a working Next.js project with all design system components and routing in place, ready for feature implementation
**Depends on**: Phase 14 (Stitch screens and UI specs exist)
**Requirements**: SETUP-01, SETUP-02, SETUP-03
**Success Criteria** (what must be TRUE):
  1. Next.js app runs locally with TypeScript, Tailwind CSS, and NeuroCut design tokens (dark theme, Space Grotesk + Inter, neural-gradient palette)
  2. Core UI components (buttons, inputs, cards, sidebar, top bar) render and match Stitch reference screens
  3. All 15 routes exist with correct layout assignment (app shell with sidebar for dashboard pages, full-screen for auth pages)
  4. Navigating between routes shows the correct layout wrapper and placeholder content
**Plans:** 3/3 plans complete
Plans:
- [x] 15-01-PLAN.md — Project init + Tailwind config with NeuroCut design tokens
- [x] 15-02-PLAN.md — Layout components (Sidebar, TopBar, AppShell, AuthLayout)
- [x] 15-03-PLAN.md — Route stubs (15 routes) + shared UI components (7 components)
**UI hint**: yes

### Phase 16: Backend Foundation
**Goal**: Supabase is configured with working auth and a database schema that can store analysis jobs
**Depends on**: Phase 15
**Requirements**: BACK-01, BACK-02
**Success Criteria** (what must be TRUE):
  1. Supabase project is live with email/password auth enabled and returns valid session tokens
  2. Database has a jobs table with columns for id, user_id, video_url, status, results, and timestamps
  3. Row-level security ensures users can only read/write their own job records
**Plans:** 1/1 plans complete
Plans:
- [x] 16-01-PLAN.md — Supabase client utilities, middleware, jobs table migration with RLS

### Phase 17: Authentication Flow
**Goal**: Users can create accounts, log in, stay logged in, and get redirected appropriately
**Depends on**: Phase 16
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password and lands on the onboarding welcome screen
  2. User can log in with email/password and lands on the dashboard
  3. Refreshing the browser preserves the logged-in session (no re-login required)
  4. Visiting any protected route while logged out redirects to the login page
  5. Login and signup screens match the Stitch reference (dark theme, neural-gradient CTA button)
**Plans:** 1 plan
Plans:
- [x] 16-01-PLAN.md — Supabase client utilities, middleware, jobs table migration with RLS
**UI hint**: yes

### Phase 18: Upload & Processing
**Goal**: Users can upload a video and watch processing progress in real time
**Depends on**: Phase 17, Phase 19 (API routes needed for actual processing -- can build UI with mocks first)
**Requirements**: UPLD-01, UPLD-02, UPLD-03, PROC-01, PROC-02, PROC-03, PROC-04
**Success Criteria** (what must be TRUE):
  1. User can drag-and-drop or browse to select a video file, and sees estimated credit cost before confirming
  2. After confirming, the video uploads to cloud storage and a job record is created in the database
  3. Processing screen shows live progress with stage labels (uploading, analyzing audio, encoding, predicting) by polling job status
  4. User can navigate away from the processing screen and return to see current progress
  5. If processing fails, user sees an error state with a retry button
**Plans:** 1 plan
Plans:
- [ ] 16-01-PLAN.md — Supabase client utilities, middleware, jobs table migration with RLS
**UI hint**: yes

### Phase 19: API Integration
**Goal**: The frontend can trigger RunPod inference and track job status without exposing API keys
**Depends on**: Phase 16
**Requirements**: BACK-03, BACK-04
**Success Criteria** (what must be TRUE):
  1. A Next.js API route accepts inference requests from the client and proxies them to RunPod (API key stays server-side)
  2. A Next.js API route polls RunPod /status/{job_id} and updates the job record in Supabase with current status and results
  3. The client never sees the RunPod API key in network requests or client-side code
**Plans:** 1 plan
Plans:
- [ ] 16-01-PLAN.md — Supabase client utilities, middleware, jobs table migration with RLS

### Phase 20: Results Display
**Goal**: Users can view comprehensive neural activation results for their analyzed video
**Depends on**: Phase 19 (needs real data from RunPod), Phase 18 (processing flow creates jobs)
**Requirements**: RSLT-01, RSLT-02, RSLT-03, RSLT-04, RSLT-05
**Success Criteria** (what must be TRUE):
  1. Results Overview page shows overall score, hook score, retention percentage, and peak moment derived from API response
  2. A neural activation timeline visualization displays engagement over time with identifiable peaks and valleys
  3. Results Detail page shows per-region breakdown (attention, reward, emotional processing, social cognition) with visual indicators
  4. Segment-level data table shows timestamps with corresponding activation scores
  5. User can export the full results as a downloadable JSON file
**Plans:** 1 plan
Plans:
- [ ] 16-01-PLAN.md — Supabase client utilities, middleware, jobs table migration with RLS
**UI hint**: yes

### Phase 21: Dashboard
**Goal**: Users can see and access all their past analyses from a central hub
**Depends on**: Phase 17 (needs auth), Phase 16 (needs job records)
**Requirements**: DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. Dashboard lists all past analyses for the logged-in user with scores and timestamps
  2. Clicking a past analysis navigates to its results page with full data
  3. A user with no analyses sees an empty state with a prompt to upload their first video
**Plans:** 1 plan
Plans:
- [ ] 16-01-PLAN.md — Supabase client utilities, middleware, jobs table migration with RLS
**UI hint**: yes

### Phase 22: Settings & Profile
**Goal**: Users can manage their account settings, view billing info, and see their profile
**Depends on**: Phase 17 (needs auth)
**Requirements**: SETT-01, SETT-02, SETT-03, SETT-04
**Success Criteria** (what must be TRUE):
  1. Settings page displays the user's display name and email
  2. Settings page has working notification toggle switches (state persists across page loads)
  3. Billing page shows a mock credit balance and mock purchase options (no real payment processing)
  4. Profile page shows user info and aggregate stats (total analyses, average score)
**Plans:** 1 plan
Plans:
- [ ] 16-01-PLAN.md — Supabase client utilities, middleware, jobs table migration with RLS
**UI hint**: yes

### Phase 23: Error Handling
**Goal**: The app handles error states gracefully with appropriate feedback
**Depends on**: Phase 15 (needs routing and layout)
**Requirements**: ERR-01, ERR-02, ERR-03
**Success Criteria** (what must be TRUE):
  1. Navigating to a non-existent route shows a styled 404 page with navigation back to dashboard
  2. Server errors display a styled 500 error page with a retry option
  3. Losing network connectivity shows an offline indicator with automatic retry when connection returns
**Plans:** 1 plan
Plans:
- [ ] 16-01-PLAN.md — Supabase client utilities, middleware, jobs table migration with RLS
**UI hint**: yes

## Progress

**Execution Order:**
Phases 1-10: Complete (v1.0)
Phases 11-14: Complete (v1.1)
Phases 15-23: 15 -> 16 -> 17 -> 18/19 (parallel-capable) -> 20 -> 21 -> 22 -> 23

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
| 11. Screen Audit | v1.1 | 3/3 | Complete | 2026-04-09 |
| 12. Component Catalog | v1.1 | 2/2 | Complete | 2026-04-09 |
| 13. Gap Analysis | v1.1 | 1/1 | Complete | 2026-04-09 |
| 14. Stitch Brief | v1.1 | 1/1 | Complete | 2026-04-09 |
| 15. Scaffold & Design System | v2.0 | 3/3 | Complete    | 2026-04-09 |
| 16. Backend Foundation | v2.0 | 1/1 | Complete    | 2026-04-09 |
| 17. Authentication Flow | v2.0 | 0/? | Not started | - |
| 18. Upload & Processing | v2.0 | 0/? | Not started | - |
| 19. API Integration | v2.0 | 0/? | Not started | - |
| 20. Results Display | v2.0 | 0/? | Not started | - |
| 21. Dashboard | v2.0 | 0/? | Not started | - |
| 22. Settings & Profile | v2.0 | 0/? | Not started | - |
| 23. Error Handling | v2.0 | 0/? | Not started | - |
