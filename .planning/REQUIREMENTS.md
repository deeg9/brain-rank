# Requirements: NeuroCut Frontend Implementation

**Defined:** 2026-04-09
**Core Value:** Content creators upload a video and get per-segment neural engagement scores

## v2.0 Requirements

### Project Setup

- [ ] **SETUP-01**: Next.js project initialized with TypeScript, Tailwind CSS, and NeuroCut design tokens
- [ ] **SETUP-02**: Design system components built (buttons, inputs, cards, sidebar, top bar) matching Stitch output
- [ ] **SETUP-03**: App routing structure matches the 15 screens with proper layouts (app shell vs full-screen)

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can log in with email and password
- [ ] **AUTH-03**: User session persists across browser refresh
- [ ] **AUTH-04**: Unauthenticated users are redirected to login
- [ ] **AUTH-05**: New users see the onboarding welcome screen after first signup

### Video Upload

- [ ] **UPLD-01**: User can drag-and-drop or browse to upload a video file
- [ ] **UPLD-02**: Upload shows estimated credit cost before confirming
- [ ] **UPLD-03**: Video is uploaded to cloud storage and a URL is passed to the RunPod endpoint

### Processing

- [ ] **PROC-01**: Processing screen shows real-time progress by polling RunPod /status endpoint
- [ ] **PROC-02**: Progress displays current stage (uploading, analyzing audio, encoding, predicting)
- [ ] **PROC-03**: User can navigate away and return to check processing status
- [ ] **PROC-04**: Processing failure shows error state with retry option

### Results

- [ ] **RSLT-01**: Results Overview shows overall score, hook score, retention, peak moment from API response
- [ ] **RSLT-02**: Results Overview shows neural activation timeline visualization
- [ ] **RSLT-03**: Results Detail shows per-region breakdown (attention, reward, emotional, social)
- [ ] **RSLT-04**: Results Detail shows segment-level data with timestamps
- [ ] **RSLT-05**: User can export results as JSON

### Dashboard

- [ ] **DASH-01**: Dashboard lists all past analyses with scores and timestamps
- [ ] **DASH-02**: User can click a past analysis to view its results
- [ ] **DASH-03**: Empty state shows onboarding prompt when no analyses exist

### Settings & Profile

- [ ] **SETT-01**: Settings page shows account info (display name, email)
- [ ] **SETT-02**: Settings page has notification toggles
- [ ] **SETT-03**: Billing page shows credit balance and mock purchase options
- [ ] **SETT-04**: Profile page shows user info and aggregate analysis stats

### Backend

- [ ] **BACK-01**: Supabase project set up with auth (email/password)
- [ ] **BACK-02**: Database schema for jobs (id, user_id, video_url, status, results, timestamps)
- [ ] **BACK-03**: API route proxies inference requests to RunPod (hides API key from client)
- [ ] **BACK-04**: API route polls RunPod status and updates job record

### Error Handling

- [ ] **ERR-01**: 404 page displayed for unknown routes
- [ ] **ERR-02**: 500 error page displayed for server errors
- [ ] **ERR-03**: Offline state detected and displayed with retry

## v3.0 Requirements

Deferred to future release.

- **PAY-01**: Real Stripe integration for credit purchases
- **AB-01**: A/B comparison mode processing two videos
- **COLLAB-01**: Team sharing and collaboration features
- **PDF-01**: PDF report generation and download
- **MOBILE-01**: Mobile-responsive optimization pass

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real payment processing | Mock billing UI for v2.0, Stripe deferred to v3.0 |
| A/B video comparison | Single video only, multi-video deferred |
| Mobile app | Web-first |
| Real-time collaboration | Complexity, not core value |
| PDF reports | Deferred to v3.0 |
| OAuth (Google, GitHub) | Email/password sufficient for v2.0 |
| Video player with frame scrub | Placeholder player, full player deferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 15 | Pending |
| SETUP-02 | Phase 15 | Pending |
| SETUP-03 | Phase 15 | Pending |
| AUTH-01 | Phase 17 | Pending |
| AUTH-02 | Phase 17 | Pending |
| AUTH-03 | Phase 17 | Pending |
| AUTH-04 | Phase 17 | Pending |
| AUTH-05 | Phase 17 | Pending |
| UPLD-01 | Phase 18 | Pending |
| UPLD-02 | Phase 18 | Pending |
| UPLD-03 | Phase 18 | Pending |
| PROC-01 | Phase 18 | Pending |
| PROC-02 | Phase 18 | Pending |
| PROC-03 | Phase 18 | Pending |
| PROC-04 | Phase 18 | Pending |
| RSLT-01 | Phase 20 | Pending |
| RSLT-02 | Phase 20 | Pending |
| RSLT-03 | Phase 20 | Pending |
| RSLT-04 | Phase 20 | Pending |
| RSLT-05 | Phase 20 | Pending |
| DASH-01 | Phase 21 | Pending |
| DASH-02 | Phase 21 | Pending |
| DASH-03 | Phase 21 | Pending |
| SETT-01 | Phase 22 | Pending |
| SETT-02 | Phase 22 | Pending |
| SETT-03 | Phase 22 | Pending |
| SETT-04 | Phase 22 | Pending |
| BACK-01 | Phase 16 | Pending |
| BACK-02 | Phase 16 | Pending |
| BACK-03 | Phase 19 | Pending |
| BACK-04 | Phase 19 | Pending |
| ERR-01 | Phase 23 | Pending |
| ERR-02 | Phase 23 | Pending |
| ERR-03 | Phase 23 | Pending |

**Coverage:**
- v2.0 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after roadmap creation*
