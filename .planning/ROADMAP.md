# Roadmap: NeuroCut

## Milestones

- ✅ **v1.0 Inference Pipeline** - Phases 1-10 (shipped 2026-04-09)
- ✅ **v1.1 UI Audit & Consolidation** - Phases 11-14 (shipped 2026-04-09)
- 🚧 **v2.0 Frontend Implementation** - Phases 15-26 (in progress)
- 📋 **v2.1 21st.dev Component Integration** - Phases 27-32 (planned)
- 📋 **v2.2 Enhanced Brain Analytics** - Phases 33-37 (planned)
- 📋 **v3.0 Brain Visualization UX Overhaul** - Phases 39-43 (planned)
- ✅ **v4.0 Social Discovery Platform** - Phases 44-51 (shipped 2026-04-12)
- 🚧 **v5.0 Multi-Modal Input & Comparison** - Phases 52-58 (in progress)

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

### v2.0 Frontend Implementation (In Progress)

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
- [ ] **Phase 24: Neural Timeline** - Multi-track neural activation timeline with synchronized crosshair
- [ ] **Phase 25: Video Player + Scrubber** - Synced video player and neural timeline scrubber
- [ ] **Phase 26: Neural Insights + Benchmark** - Research-backed insights and benchmark engine

### v2.1 21st.dev Component Integration (Planned)

**Milestone Goal:** Integrate 4 premium animated components from 21st.dev into the NeuroCut web app, adapted to the existing dark/neural design system, to elevate the UI with polished animations and interactions.

- [ ] **Phase 27: Animation Foundation** - Framer Motion dependency and cn() utility for all animated components
- [ ] **Phase 28: Sliding Number Counters** - Spring-animated score counters on results page
- [ ] **Phase 29: Animated File Upload** - Drag-and-drop upload zone with progress bars and video thumbnails
- [ ] **Phase 30: Processing Page Premium Polish** - Animated progress bar, kinetic log stream, pipeline stepper, VRAM stat card glow, live pulse indicators, and wave loader
- [ ] **Phase 31: Hero Odyssey** - WebGL lightning shader hero section for welcome/marketing page

### v2.2 Enhanced Brain Analytics (Planned)

**Milestone Goal:** Unlock the full 20,484-vertex brain data with per-vertex heatmaps, expand from 4 to 9+ functional networks, and surface arousal/valence metrics -- making the results page scientifically richer and visually closer to Meta's own TRIBE v2 demo.

- [ ] **Phase 33: Functional Network Expansion** - Add 5 new functional networks to backend region mapping and update API schema
- [ ] **Phase 34: Vertex Data Pipeline** - Quantized uint8 base64 encoding for per-vertex activation data
- [ ] **Phase 35: Unified GLB Mesh Export** - Python script producing a single GLB with 20,484 vertices in fsaverage5 order
- [ ] **Phase 36: Cortical Heatmap Viewer** - Per-vertex heatmap on 3D brain with dual-view toggle and colormap selector
- [ ] **Phase 37: Arousal/Valence & Network Legend** - Arousal/valence display cards, circumplex chart, and 9-network toggleable legend

### Gap Closure

- [ ] **Phase 38: Code Cleanup & Missing Wiring** - Fix 9-network regions mode, add retry API route, remove dead code

**Plans:** 1 plan
Plans:
- [x] 38-01-PLAN.md — Fix 9-network regions mode, add retry route, remove dead code

### v3.0 Brain Visualization UX Overhaul (Planned)

**Milestone Goal:** Redesign the brain viewer from a cluttered multi-control interface to a clean, dynamic visualization where the brain simply glows as the video plays -- matching Meta's own TRIBE v2 demo approach.

- [ ] **Phase 39: Performance Foundation** - GPU colormap LUT, DynamicDrawUsage, useFrame animation loop
- [ ] **Phase 40: UI Subtraction & Component Consolidation** - Remove all controls, merge mesh components, clean header
- [ ] **Phase 41: Threshold Glow & Legend** - Threshold-based emissive glow, static network color legend
- [ ] **Phase 42: Smooth Transitions** - Segment interpolation, auto-rotate idle behavior
- [ ] **Phase 43: Timeline Peak Markers** - Mark top activation moments on neural timeline

- ✅ **v4.0 Social Discovery Platform** - Phases 44-51 (shipped 2026-04-12) — [Archive](milestones/v4.0-ROADMAP.md)
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
**Plans:** 2/2 plans complete
Plans:
- [x] 17-01-PLAN.md — Login + signup pages with Supabase auth server actions
- [x] 17-02-PLAN.md — Route protection middleware + onboarding welcome page
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
**Plans:** 2/2 plans complete
Plans:
- [x] 18-01-PLAN.md — Upload page with drag-drop, file validation, Supabase Storage upload, job creation
- [x] 18-02-PLAN.md — Processing page with status polling, progress bar, stage indicators, error/retry

**UI hint**: yes

### Phase 19: API Integration
**Goal**: The frontend can trigger RunPod inference and track job status without exposing API keys
**Depends on**: Phase 16
**Requirements**: BACK-03, BACK-04
**Success Criteria** (what must be TRUE):
  1. A Next.js API route accepts inference requests from the client and proxies them to RunPod (API key stays server-side)
  2. A Next.js API route polls RunPod /status/{job_id} and updates the job record in Supabase with current status and results
  3. The client never sees the RunPod API key in network requests or client-side code
**Plans:** 1/1 plans complete
Plans:
- [x] 19-01-PLAN.md — POST /api/jobs + GET /api/jobs/[id] routes proxying to RunPod

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
**Plans:** 2/2 plans complete
Plans:
- [x] 20-01-PLAN.md — Results Overview page with summary metrics and activation timeline
- [x] 20-02-PLAN.md — Results Detail page with region breakdown, segment table, JSON export
**UI hint**: yes

### Phase 21: Dashboard
**Goal**: Users can see and access all their past analyses from a central hub
**Depends on**: Phase 17 (needs auth), Phase 16 (needs job records)
**Requirements**: DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. Dashboard lists all past analyses for the logged-in user with scores and timestamps
  2. Clicking a past analysis navigates to its results page with full data
  3. A user with no analyses sees an empty state with a prompt to upload their first video
**Plans:** 1/1 plans complete
Plans:
- [x] 21-01-PLAN.md — Dashboard job list, empty state, navigation to results
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
**Plans:** 1/1 plans complete
Plans:
- [x] 22-01-PLAN.md — Settings, billing, and profile pages
**UI hint**: yes

### Phase 23: Error Handling
**Goal**: The app handles error states gracefully with appropriate feedback
**Depends on**: Phase 15 (needs routing and layout)
**Requirements**: ERR-01, ERR-02, ERR-03
**Success Criteria** (what must be TRUE):
  1. Navigating to a non-existent route shows a styled 404 page with navigation back to dashboard
  2. Server errors display a styled 500 error page with a retry option
  3. Losing network connectivity shows an offline indicator with automatic retry when connection returns
**Plans:** 1/1 plans complete
Plans:
- [x] 23-01-PLAN.md — 404, 500, and offline error pages
**UI hint**: yes

### Phase 24: Results Detail Multi-Track Neural Activation Timeline

**Goal:** Results Detail page has a premium 4-track neural activation timeline (Recharts AreaCharts) with synchronized crosshair, gradient fills, custom tooltip, and video player placeholder
**Requirements**: RSLT-02, RSLT-03
**Depends on:** Phase 20
**Plans:** 1 plan

Plans:
- [ ] 24-01-PLAN.md — Install Recharts, create NeuralTimeline component, add video placeholder, update Results Detail page layout

### Phase 25: Synced Video Player and Neural Timeline Scrubber

**Goal:** Bidirectional sync between a custom video player and the 4-track NeuralTimeline -- playing the video moves a playhead across all tracks, clicking a track seeks the video, and a real-time region values bar shows brain activation scores at the current position
**Requirements**: RSLT-02, RSLT-03
**Depends on:** Phase 24
**Plans:** 1 plan

Plans:
- [ ] 25-01-PLAN.md — VideoPlayer component, NeuralTimeline playhead + click-to-seek, RegionValuesBar, parent state wiring

### Phase 26: Research-Backed Neural Insights and Benchmark Engine

**Goal:** Transform raw brain activation scores into actionable, research-backed insights with a benchmark engine, insights panel, annotated timeline, and comparison cards on the Results Detail page
**Requirements**: RSLT-02, RSLT-03
**Depends on:** Phase 25
**Plans:** 1 plan

Plans:
- [ ] 26-01-PLAN.md — Benchmark engine, InsightsPanel, timeline annotations, BenchmarkCards, page wiring

### Phase 27: Animation Foundation
**Goal**: Framer Motion and class-merging utilities are installed and verified, enabling all subsequent animated component work
**Depends on**: Phase 15 (existing Next.js project)
**Requirements**: FOUN-01, FOUN-02
**Success Criteria** (what must be TRUE):
  1. Framer Motion and react-use-measure are installed and a test animation renders without errors in the existing app
  2. A cn() utility combining clsx and tailwind-merge is available and correctly merges conflicting Tailwind classes
  3. An existing component (e.g., a card or button) can be wrapped with a Framer Motion animation without breaking its current styling or behavior
**Plans:** 1 plan
Plans:
- [ ] 27-01-PLAN.md — Install Framer Motion + react-use-measure + clsx + tailwind-merge, create cn() utility, verify with Card component
**UI hint**: yes

### Phase 28: Sliding Number Counters
**Goal**: Brain activation scores on the results page animate into view with spring-physics number counters instead of appearing as static text
**Depends on**: Phase 27 (Framer Motion required), Phase 20 (results page exists)
**Requirements**: COMP-01
**Success Criteria** (what must be TRUE):
  1. The overall score, hook score, retention percentage, and peak moment on the Results Overview page animate from 0 to their final values with a visible spring-physics motion
  2. The animation triggers when the results page loads or when scores first enter the viewport
  3. The animated numbers match the existing design system (Space Grotesk font, correct colors, proper sizing) and do not break the results page layout
**Plans:** 1/1 plans complete
Plans:
- [x] 31-01-PLAN.md — WebGL lightning shader hero section with FBM effects, branded content overlay, auth-aware CTA
**UI hint**: yes

### Phase 29: Animated File Upload
**Goal**: The upload page has a polished drag-and-drop zone with animated transitions, per-file progress bars, and video thumbnail previews replacing the current upload implementation
**Depends on**: Phase 27 (Framer Motion required), Phase 18 (upload page exists)
**Requirements**: COMP-02
**Success Criteria** (what must be TRUE):
  1. User can drag a video file over the upload zone and see a visual hover/active state animation indicating the drop target
  2. After dropping or selecting a file, a progress bar animates the upload progress and a video thumbnail preview is generated and displayed
  3. User can add multiple files and manage the file list (remove files before confirming upload)
  4. The upload zone integrates with the existing Supabase Storage upload flow without breaking job creation
**Plans:** 1/1 plans complete
Plans:
- [x] 29-01-PLAN.md — AnimatedFileUpload component, VideoThumbnail, upload page integration
**UI hint**: yes

### Phase 30: Processing Page Premium Polish
**Goal**: The processing page is elevated from functional to premium with animated progress bar, kinetic log stream, pipeline stepper with motion, VRAM stat card with glow effects, live pulse indicators, and a neural wave loader
**Depends on**: Phase 27 (Framer Motion required), Phase 18 (processing page exists)
**Requirements**: COMP-03
**Success Criteria** (what must be TRUE):
  1. Progress bar uses Framer Motion spring animation with a traveling shimmer/glow sweep effect
  2. Pipeline stage stepper has connected lines, animated checkmarks, and a pulsing active indicator replacing the flat grid
  3. Inference log panel has terminal chrome (macOS dots), AnimatePresence line entries, color-coded prefixes, and top/bottom fade gradients
  4. VRAM stat card has animated number counting, orbiting halo glow, and shimmer on the load intensity bar
  5. Live status pulse dots replace static indicators with ping animation throughout the page
  6. A neural wave loader animation runs during the predicting stage, evoking EEG/neural signal aesthetic
  7. All animations run at 60fps, respect the NeuroCut purple/cyan palette, and coexist with existing status information
**Plans:** 2/2 plans complete
Plans:
- [x] 30-01-PLAN.md — Neural wave loader component
- [x] 30-02-PLAN.md — Gap closure: progress bar, stepper, log panel, VRAM card, pulse dots
**UI hint**: yes

### Phase 31: Hero Odyssey
**Goal**: The welcome/marketing page has a WebGL lightning shader hero section that establishes the neural/scientific brand identity
**Depends on**: Phase 27 (Framer Motion required)
**Requirements**: COMP-04
**Success Criteria** (what must be TRUE):
  1. The welcome page renders a WebGL lightning shader animation in the hero section that runs at 60fps on modern browsers
  2. The shader is adapted to the NeuroCut purple/cyan palette with neural-aesthetic lightning effects
  3. The hero section includes a call-to-action that navigates to the upload or signup flow
  4. The WebGL shader degrades gracefully on devices that do not support WebGL (shows a static fallback)
**Plans:** 1/1 plans complete
Plans:
- [ ] 31-01-PLAN.md — WebGL lightning shader hero section with FBM effects, branded content overlay, auth-aware CTA
**UI hint**: yes

### Phase 32: 3D Brain Viewer

**Goal:** Interactive 3D brain visualization using react-three-fiber showing brain regions lighting up based on TRIBE v2 activation scores, synced to the video timeline on the results page
**Depends on:** Phase 20 (results page exists), Phase 27 (Framer Motion / animation foundation)
**Requirements**: RSLT-03
**Success Criteria** (what must be TRUE):
  1. A 3D brain model renders on the results page using react-three-fiber with the fsaverage5 mesh
  2. Four brain regions (attention, reward, emotional processing, social cognition) glow independently based on per-segment activation scores
  3. The brain visualization syncs with the video timeline — scrubbing the video updates region colors in real-time
  4. Bloom/glow postprocessing creates a visually striking "lighting up" effect matching the NeuroCut dark theme
**Plans:** 2/2 plans complete

Plans:
- [x] 32-01-PLAN.md — R3F deps, brain-utils, Python mesh conversion to GLB
- [x] 32-02-PLAN.md — BrainViewer R3F component, results page integration, visual verification
**UI hint**: yes

### Phase 33: Functional Network Expansion
**Goal**: The backend maps all 9 functional networks from Destrieux atlas parcels and the API schema supports them while staying backward-compatible with existing 4-region jobs
**Depends on**: Phase 32 (existing brain viewer and region mapping infrastructure)
**Requirements**: NET-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. The regions.py module defines vertex masks for 5 new functional networks (visual processing, auditory processing, language/narrative, default mode, motion processing) using Destrieux atlas parcels
  2. The API response schema includes all 9 functional network scores per segment while existing 4-region jobs still parse correctly without client changes
  3. Running inference on a test video returns scores for all 9 networks with plausible differentiation (not all identical values)
**Plans:** 1/1 plans complete
Plans:
- [x] 33-01-PLAN.md — Add 5 new functional networks (backend + frontend) and update API schema

### Phase 34: Vertex Data Pipeline
**Goal**: Per-vertex activation data is transmitted efficiently as quantized uint8 base64-encoded payloads instead of raw float arrays
**Depends on**: Phase 33 (schema must support new fields)
**Requirements**: DATA-01
**Success Criteria** (what must be TRUE):
  1. The postprocessor quantizes 20,484 float32 vertex activations to uint8 and base64-encodes the result, reducing per-segment payload from ~80KB to ~28KB
  2. The frontend can decode the base64 string back to a typed array and map values to vertex colors without visible quantization artifacts
  3. Existing API consumers that do not read the vertex_data field continue to work unchanged
**Plans:** 1/1 plans complete
Plans:
- [x] 34-01-PLAN.md — Quantize vertex activations to uint8 base64, add schema fields, create frontend decoder

### Phase 35: Unified GLB Mesh Export
**Goal**: A single GLB mesh file with exactly 20,484 vertices in fsaverage5 ordering exists for the frontend heatmap renderer
**Depends on**: Phase 32 (existing brain mesh conversion tooling)
**Requirements**: DATA-03
**Success Criteria** (what must be TRUE):
  1. A Python script reads the fsaverage5 surface files and produces a GLB with 20,484 vertices whose indices match the TRIBE v2 output ordering
  2. The GLB loads in the existing react-three-fiber brain viewer and renders a recognizable cortical surface
  3. Vertex i in the decoded activation array corresponds to vertex i in the GLB mesh (no index remapping needed at runtime)
**Plans:** 1/1 plans complete
Plans:
- [x] 35-01-PLAN.md — Add unified mesh export and generate brain-fsaverage5-unified.glb

### Phase 36: Cortical Heatmap Viewer
**Goal**: Users can see per-vertex activation intensity painted directly on the 3D brain surface and switch between heatmap and region-blob views
**Depends on**: Phase 34 (vertex data available), Phase 35 (unified GLB mesh exists)
**Requirements**: VIZ-01, VIZ-02, VIZ-03
**Success Criteria** (what must be TRUE):
  1. The 3D brain viewer displays a continuous color gradient across all 20,484 vertices reflecting per-vertex activation intensity for the selected segment
  2. User can toggle between the per-vertex heatmap view and the original 4-region blob view using a visible control on the brain viewer
  3. User can select between at least 3 colormap options (Inferno, Plasma, Viridis) and the heatmap updates immediately
  4. Scrubbing the timeline updates the heatmap colors in real-time without perceptible lag
**UI hint**: yes
**Plans:** 1/1 plans complete
Plans:
- [x] 36-01-PLAN.md — Per-vertex heatmap mesh, colormap utility, dual view mode toggle

### Phase 37: Arousal/Valence Display & Network Legend
**Goal**: Users can see arousal and valence metrics and interact with all 9 functional networks on the results page
**Depends on**: Phase 33 (9 networks available in API), Phase 36 (heatmap viewer exists for network overlay)
**Requirements**: AV-01, AV-02, NET-02
**Success Criteria** (what must be TRUE):
  1. The results page displays arousal and valence composite scores as styled metric cards matching the existing design system
  2. A circumplex chart plots arousal (y-axis) vs valence (x-axis) with quadrant labels (high-arousal/positive, high-arousal/negative, low-arousal/positive, low-arousal/negative)
  3. A color-coded legend lists all 9 functional networks with toggle switches that show/hide each network's activation on the brain viewer
  4. Toggling a network on highlights its vertices on the heatmap; toggling it off returns those vertices to the base color
**UI hint**: yes
**Plans:** 1/1 plans complete
Plans:
- [x] 37-01-PLAN.md — Arousal/valence metric cards, circumplex chart, 9-network legend verification

### Phase 39: Performance Foundation
**Goal**: The brain viewer renders per-vertex activation colors at 60fps using GPU-side computation instead of CPU string parsing
**Depends on**: Phase 38 (clean codebase with 9-network support)
**Requirements**: PERF-01, PERF-03
**Success Criteria** (what must be TRUE):
  1. Vertex colors are computed via a GPU-side 256-entry DataTexture LUT -- no d3-color CSS string parsing occurs per frame
  2. Buffer attributes use DynamicDrawUsage and the animation loop runs in useFrame instead of useEffect
  3. Video-to-brain sync polls currentTime at display refresh rate via requestVideoFrameCallback (or useFrame fallback)
  4. The brain viewer maintains 60fps during video playback with all 20,484 vertices updating per segment change
**Plans:** 2/2 plans complete
Plans:
- [x] 39-01-PLAN.md — GPU colormap LUT, DynamicDrawUsage, useFrame for BrainHeatmapMesh
- [x] 39-02-PLAN.md — requestVideoFrameCallback hook, ref-based video-to-brain sync
**UI hint**: yes

### Phase 40: UI Subtraction & Component Consolidation
**Goal**: The brain viewer has zero interactive controls -- no toggles, no dropdowns, no preset view buttons -- and the component tree is simplified from two mesh components to one
**Depends on**: Phase 39 (performance foundation must be in place before restructuring components)
**Requirements**: VIS-02, VIS-04
**Success Criteria** (what must be TRUE):
  1. The heatmap/regions mode toggle, colormap dropdown, and all 9 network filter toggle buttons are removed from the brain viewer
  2. The brain viewer header shows only a clean title with no crowded controls
  3. BrainHeatmapMesh and BrainNetworkMesh are merged into a single BrainGlowMesh component
  4. BrainViewer.tsx has zero useState calls for view mode, colormap selection, or region filters
**Plans:** 1/1 plans complete
Plans:
- [x] 40-01-PLAN.md — Strip controls, merge meshes into BrainGlowMesh, clean header

**UI hint**: yes

### Phase 41: Threshold Glow & Legend
**Goal**: Brain regions glow dynamically above an activation threshold while below-threshold vertices stay dark, and a static legend explains the color mapping
**Depends on**: Phase 40 (simplified component tree ready for custom shader material)
**Requirements**: VIS-01, VIS-03
**Success Criteria** (what must be TRUE):
  1. Vertices with activation above threshold emit colored glow proportional to activation intensity; vertices below threshold appear dark gray
  2. Threshold transitions use smoothstep blending -- no hard-edge popping or flickering at the activation boundary
  3. A static non-interactive color legend below the brain viewer shows which color maps to which functional network
  4. The brain viewer uses a single committed colormap (inferno or hot) with no user-selectable alternatives
**Plans:** 2/2 plans complete
Plans:
- [x] 41-01-PLAN.md — Threshold glow with smoothstep blending, inferno colormap, emissive intensity
- [x] 41-02-PLAN.md — Static ActivationLegend component with inferno gradient bar
**UI hint**: yes

### Phase 42: Smooth Transitions
**Goal**: Activation values interpolate smoothly between 2-second segments and the brain auto-rotates when the user is not interacting
**Depends on**: Phase 41 (threshold glow must be working before adding temporal smoothing)
**Requirements**: PERF-02, POL-01
**Success Criteria** (what must be TRUE):
  1. When the video crosses a segment boundary, vertex activation values lerp smoothly over ~300ms instead of snapping instantly
  2. The brain auto-rotates slowly when the user has not touched OrbitControls for 3+ seconds
  3. Auto-rotation pauses immediately when the user grabs the brain and resumes after idle timeout
**Plans:** 2/2 plans complete
- [x] 42-01-PLAN.md — Smooth vertex interpolation between 2-second segments (~300ms lerp)
- [x] 42-02-PLAN.md — Auto-rotation with 3s idle timeout, immediate pause on grab

**UI hint**: yes

### Phase 43: Timeline Peak Markers
**Goal**: The neural timeline visually marks the moments of highest brain activation so creators can instantly see their video's peak engagement points
**Depends on**: Phase 41 (activation threshold logic defines what counts as a peak)
**Requirements**: POL-02
**Success Criteria** (what must be TRUE):
  1. The top 3-5 activation peaks are automatically identified and marked on the neural timeline with visible indicators
  2. Each peak marker shows the timestamp and relative activation intensity on hover or tap
  3. Peak markers do not interfere with existing timeline interactions (playhead scrubbing, click-to-seek)
**Plans:** 1/1 plans complete
Plans:
- [x] 43-01-PLAN.md — Peak detection logic, timeline marker rendering, results page wiring
**UI hint**: yes

<details>
<summary>✅ v4.0 Social Discovery Platform (Phases 44-51) - SHIPPED 2026-04-12</summary>

See [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md) for full phase details.

</details>

### v5.0 Multi-Modal Input & Comparison (In Progress)

**Milestone Goal:** Expand beyond video-only to support image and text neural testing, with a side-by-side comparison view.

### Phase 52: Schema & Upload Type Selector
**Goal**: The database, TypeScript types, and upload UI support multiple content types so all subsequent phases can store and route non-video jobs
**Depends on**: Phase 51 (v4.0 complete)
**Requirements**: UX-01
**Success Criteria** (what must be TRUE):
  1. The jobs table has an `input_type` column (defaulting to 'video') and all existing jobs are backfilled without breakage
  2. The upload page shows a type selector (Video / Image / Text) that shows the appropriate input UI
  3. TypeScript types and the RunPod input schema accept `input_type`, `text_content`, and `text_style` fields
  4. Selecting Video on the upload page shows the existing drag-and-drop video upload (no regression)
**Plans**: 2 plans
Plans:
- [x] 52-01-PLAN.md — Schema migration, TypeScript types, createJob action, RunPod InputSchema
- [x] 52-02-PLAN.md — InputTypeSelector component and upload page integration
**UI hint**: yes

### Phase 53: Image Upload Pipeline
**Goal**: Users can upload a JPEG/PNG image and get neural activation scores back, with the image-to-video conversion handled transparently server-side
**Depends on**: Phase 52
**Requirements**: IMG-01, IMG-02, IMG-03
**Success Criteria** (what must be TRUE):
  1. User can select an image file (JPEG or PNG) and see a live preview before submitting
  2. Invalid files are rejected with clear error messages for wrong type, size over 10MB, or dimensions below 256px
  3. User can configure how long the static image is held for inference (6s default, 2-15s slider)
  4. Submitting an image creates a job, the RunPod worker converts it to a silent video via FFmpeg, runs inference, and returns scores
  5. The user receives results identical in structure to a video job (same polling, same results page)
**Plans:** 2/2 plans complete
Plans:
- [x] 53-01-PLAN.md — Image upload UI with preview, validation, duration slider, and Supabase upload
- [x] 53-02-PLAN.md — RunPod handler image-to-video conversion and video-only inference
**UI hint**: yes

### Phase 54: Text Spoken Mode
**Goal**: Users can submit text and get neural activation scores via TRIBE v2's native text-to-speech-to-audio inference path
**Depends on**: Phase 52
**Requirements**: TXT-01, TXT-04
**Success Criteria** (what must be TRUE):
  1. User can enter text in a text area and submit it in spoken mode
  2. Text input is capped at 500 characters with a visible live counter
  3. Submitting text in spoken mode creates a job that uses TRIBE v2's native `text_path` (gTTS internally), runs inference on the generated audio, and returns scores
  4. The user receives results with the same structure and polling flow as video/image jobs
**Plans**: 2 plans
Plans:
- [ ] 54-01-PLAN.md — Text textarea UI with 500-char counter and submit flow
- [ ] 54-02-PLAN.md — RunPod handler text_spoken branch with TRIBE v2 text_path inference

**UI hint**: yes

### Phase 55: Text Visual Mode
**Goal**: Users can submit text as a rendered visual card for video-path inference, with style template selection and an Experimental label
**Depends on**: Phase 53 (reuses image-to-video conversion code)
**Requirements**: TXT-02, TXT-03
**Success Criteria** (what must be TRUE):
  1. User can enter text and submit it in visual mode, which renders the text as a styled image card
  2. User can choose a style template (Billboard, Social Post, General) that changes the card's visual appearance
  3. The visual mode submission is labeled "Experimental" in the UI before and after submission
  4. The rendered image card follows the image-to-video conversion path (Pillow render, FFmpeg conversion, video-only inference)
**Plans**: 2 plans
Plans:
- [ ] 52-01-PLAN.md — Schema migration, TypeScript types, createJob action, RunPod InputSchema
- [ ] 52-02-PLAN.md — InputTypeSelector component and upload page integration
**UI hint**: yes

### Phase 56: Results Adaptations
**Goal**: The results page renders appropriately for non-video content instead of showing a broken or irrelevant video player
**Depends on**: Phase 53, Phase 54 (at least one non-video input type must be working)
**Requirements**: UX-03
**Success Criteria** (what must be TRUE):
  1. Image job results show the original uploaded image as a static preview instead of a video player
  2. Text job results show the submitted text content (and style card for visual mode) instead of a video player
  3. The neural timeline, brain viewer, and all metric displays work identically regardless of content type
**Plans**: 2 plans
Plans:
- [ ] 52-01-PLAN.md — Schema migration, TypeScript types, createJob action, RunPod InputSchema
- [ ] 52-02-PLAN.md — InputTypeSelector component and upload page integration
**UI hint**: yes

### Phase 57: Content Type Badges
**Goal**: Users can immediately identify the content type and confidence level of any analysis across the entire app
**Depends on**: Phase 52 (input_type column must exist)
**Requirements**: UX-02
**Success Criteria** (what must be TRUE):
  1. Every analysis card on the dashboard shows a badge indicating its content type (Video, Image, or Text)
  2. Non-video analyses display an "Exploratory" badge indicating scores are from out-of-distribution input
  3. Content type badges appear consistently on the results page header, discovery feed cards, and public analysis views
**Plans**: 2 plans
Plans:
- [ ] 52-01-PLAN.md — Schema migration, TypeScript types, createJob action, RunPod InputSchema
- [ ] 52-02-PLAN.md — InputTypeSelector component and upload page integration
**UI hint**: yes

### Phase 58: Comparison Page
**Goal**: Users can pick any two completed analyses and view their results side by side with metric differences highlighted
**Depends on**: Phase 52 (input_type in schema), Phase 56 (results adaptations for rendering)
**Requirements**: CMP-01, CMP-02, CMP-03
**Success Criteria** (what must be TRUE):
  1. User can navigate to /compare and select any two completed analyses from a picker
  2. The comparison view displays both analyses side by side with their brain viewers, timelines, and key metrics
  3. Metric deltas (+/-) are shown between the two analyses for overall score and region breakdowns
  4. When comparing analyses of different content types, a disclaimer is displayed warning that scores may not be directly comparable
**Plans**: 2 plans
Plans:
- [ ] 52-01-PLAN.md — Schema migration, TypeScript types, createJob action, RunPod InputSchema
- [ ] 52-02-PLAN.md — InputTypeSelector component and upload page integration
**UI hint**: yes

## Progress

**Execution Order:**
Phases 1-10: Complete (v1.0)
Phases 11-14: Complete (v1.1)
Phases 15-23: 15 -> 16 -> 17 -> 18/19 (parallel-capable) -> 20 -> 21 -> 22 -> 23
Phases 24-26: 24 -> 25 -> 26
Phases 27-31: 27 -> 28/29/30/31 (parallel-capable after foundation)
Phases 33-37: 33 -> 34 -> 35 -> 36 -> 37
Phases 39-43: 39 -> 40 -> 41 -> 42 -> 43 (42 and 43 parallel-capable after 41)
Phases 44-51: 44 -> 45 -> 46 -> 47 -> 48 -> 49 -> 50 -> 51 (49 and 50 parallel-capable after 48)
Phases 52-58: 52 -> 53/54 (parallel-capable) -> 55 (after 53) -> 56 (after 53+54) -> 57 (after 52) -> 58 (after 56)

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
| 15. Scaffold & Design System | v2.0 | 3/3 | Complete | 2026-04-09 |
| 16. Backend Foundation | v2.0 | 1/1 | Complete | 2026-04-09 |
| 17. Authentication Flow | v2.0 | 2/2 | Complete | 2026-04-09 |
| 18. Upload & Processing | v2.0 | 2/2 | Complete | 2026-04-10 |
| 19. API Integration | v2.0 | 1/1 | Complete | 2026-04-10 |
| 20. Results Display | v2.0 | 2/2 | Complete | 2026-04-10 |
| 21. Dashboard | v2.0 | 1/1 | Complete | 2026-04-10 |
| 22. Settings & Profile | v2.0 | 1/1 | Complete | 2026-04-10 |
| 23. Error Handling | v2.0 | 1/1 | Complete | 2026-04-10 |
| 24. Neural Timeline | v2.0 | 0/1 | Planning | - |
| 25. Video Player + Scrubber | v2.0 | 0/1 | Planning | - |
| 26. Neural Insights + Benchmark | v2.0 | 0/1 | Planning | - |
| 27. Animation Foundation | v2.1 | 0/1 | Planning | - |
| 28. Sliding Number Counters | v2.1 | 1/1 | Complete    | 2026-04-10 |
| 29. Animated File Upload | v2.1 | 1/1 | Complete    | 2026-04-10 |
| 30. Wave Loader | v2.1 | 2/2 | Complete    | 2026-04-10 |
| 31. Hero Odyssey | v2.1 | 1/1 | Complete    | 2026-04-10 |
| 32. 3D Brain Viewer | v2.1 | 2/2 | Complete    | 2026-04-10 |
| 33. Functional Network Expansion | v2.2 | 1/1 | Complete   | 2026-04-10 |
| 34. Vertex Data Pipeline | v2.2 | 1/1 | Complete   | 2026-04-10 |
| 35. Unified GLB Mesh Export | v2.2 | 1/1 | Complete   | 2026-04-10 |
| 36. Cortical Heatmap Viewer | v2.2 | 1/1 | Complete   | 2026-04-10 |
| 37. Arousal/Valence & Network Legend | v2.2 | 1/1 | Complete    | 2026-04-10 |
| 38. Code Cleanup & Missing Wiring | Gap | 1/1 | Complete    | 2026-04-11 |
| 39. Performance Foundation | v3.0 | 2/2 | Complete    | 2026-04-11 |
| 40. UI Subtraction & Consolidation | v3.0 | 1/1 | Complete    | 2026-04-11 |
| 41. Threshold Glow & Legend | v3.0 | 2/2 | Complete    | 2026-04-11 |
| 42. Smooth Transitions | v3.0 | 2/2 | Complete    | 2026-04-11 |
| 43. Timeline Peak Markers | v3.0 | 1/1 | Complete    | 2026-04-11 |
| 44. Social Schema & Identity | v4.0 | 2/2 | Complete    | 2026-04-11 |
| 45. Profile Customization | v4.0 | 1/1 | Complete    | 2026-04-12 |
| 46. Public Profile Pages | v4.0 | 1/1 | Complete    | 2026-04-12 |
| 47. Privacy Controls & Sharing | v4.0 | 1/1 | Complete    | 2026-04-12 |
| 48. Public Analysis View | v4.0 | 1/1 | Complete    | 2026-04-12 |
| 49. Discovery Feed | v4.0 | 1/1 | Complete    | 2026-04-12 |
| 50. Discovery Search & Filters | v4.0 | 1/1 | Complete    | 2026-04-12 |
| 51. Social Engagement | v4.0 | 2/2 | Complete    | 2026-04-12 |
| 52. Schema & Upload Type Selector | v5.0 | 2/2 | Complete    | 2026-04-12 |
| 53. Image Upload Pipeline | v5.0 | 2/2 | Complete    | 2026-04-12 |
| 54. Text Spoken Mode | v5.0 | 0/0 | Not started | - |
| 55. Text Visual Mode | v5.0 | 0/0 | Not started | - |
| 56. Results Adaptations | v5.0 | 0/0 | Not started | - |
| 57. Content Type Badges | v5.0 | 0/0 | Not started | - |
| 58. Comparison Page | v5.0 | 0/0 | Not started | - |
