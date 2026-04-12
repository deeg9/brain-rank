# Requirements: NeuroCut

**Defined:** 2026-04-12
**Core Value:** Content creators upload a video and get per-segment neural engagement scores — showing exactly where viewers' brains light up and where they tune out

## v5.0 Requirements

Requirements for Multi-Modal Input & Comparison milestone. Expand beyond video-only to support image and text neural testing, with side-by-side comparison.

### Image Input

- [ ] **IMG-01**: User can upload a JPEG or PNG image file with a live preview
- [ ] **IMG-02**: System validates image file type, size (max 10MB), and dimensions (min 256px) with clear error messages
- [ ] **IMG-03**: User can configure how long the static image is held for inference (6s default, 2-15s range)

### Text Input

- [ ] **TXT-01**: User can enter text and submit it in spoken mode (TRIBE v2 native text-to-speech-to-audio path)
- [ ] **TXT-02**: User can enter text and submit it in visual mode (rendered as styled image card then converted to video, labeled "Experimental")
- [ ] **TXT-03**: User can choose a style template for visual mode (Billboard, Social Post, General)
- [ ] **TXT-04**: Text input is capped at 500 characters with a visible counter

### Comparison

- [ ] **CMP-01**: User can select any two completed analyses and view results side by side on a /compare page
- [ ] **CMP-02**: Comparison view shows metric deltas (+/-) between the two analyses
- [ ] **CMP-03**: Cross-content-type comparisons display a disclaimer that scores may not be directly comparable

### UX Adaptations

- [ ] **UX-01**: Upload page has a type selector (Video / Image / Text) that shows the appropriate input UI
- [ ] **UX-02**: Content type badges (Video/Image/Text + Exploratory for non-video) appear on dashboard, results, and discovery feed
- [ ] **UX-03**: Results page adapts for non-video content (static image preview or text display instead of video player)

## Previous Milestone Requirements (v4.0)

### Identity & Profiles

- [x] **PROF-01**: User can claim a unique username (case-insensitive, citext)
- [x] **PROF-02**: User can view a public profile page at /u/username showing public analyses and stats
- [x] **PROF-03**: User can upload a profile avatar
- [x] **PROF-04**: User can set a short bio on their profile

### Privacy & Sharing

- [x] **PRIV-01**: User can toggle each analysis between public and private (default private)
- [x] **PRIV-02**: User can view a public analysis page with brain viewer, timeline, and metrics (scores only, no video playback)
- [x] **PRIV-03**: User can copy a shareable link for public analyses

### Discovery & Leaderboard

- [x] **DISC-01**: User can browse a /discover feed of all public analyses with thumbnails, usernames, and neural scores
- [x] **DISC-02**: User can sort the leaderboard by neural score, hook strength, or retention
- [x] **DISC-03**: User can search public analyses by video title or username
- [x] **DISC-04**: User can filter public analyses by content type or score range

### Social Engagement

- [x] **SOC-01**: Public analyses track view counts
- [x] **SOC-02**: User can bookmark public analyses
- [x] **SOC-03**: User can view their saved bookmarks at /bookmarks

## Future Requirements

- Follow system — users can follow other creators
- Video playback on public views (pending licensing resolution)
- Real payment processing (Stripe integration)
- Batch comparison (3+ assets side by side)
- Shareable comparison links
- AI-generated recommendations based on brain scores

## Out of Scope

| Feature | Reason |
|---------|--------|
| Synchronized 3D brain viewer rotation in comparison | Two Three.js canvases sharing camera state is a performance risk — defer |
| Batch comparison (3+ assets) | Two-at-a-time is sufficient for v5.0 |
| AI recommendations | Requires more data and model refinement |
| Heatmap overlay on images | TRIBE v2 outputs cortical activation, not spatial attention — would be dishonest |
| Live A/B testing (traffic splitting) | Different paradigm from neural prediction — tools like TubeBuddy do this |
| Offline TTS fallback | Test gTTS reliability first; build fallback only if needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UX-01 | Phase 52 | Pending |
| IMG-01 | Phase 53 | Pending |
| IMG-02 | Phase 53 | Pending |
| IMG-03 | Phase 53 | Pending |
| TXT-01 | Phase 54 | Pending |
| TXT-04 | Phase 54 | Pending |
| TXT-02 | Phase 55 | Pending |
| TXT-03 | Phase 55 | Pending |
| UX-03 | Phase 56 | Pending |
| UX-02 | Phase 57 | Pending |
| CMP-01 | Phase 58 | Pending |
| CMP-02 | Phase 58 | Pending |
| CMP-03 | Phase 58 | Pending |

**Coverage:**
- v5.0 requirements: 13 total
- Mapped: 13/13
- Unmapped: 0

---
*Requirements defined: 2026-04-12*
*Traceability updated: 2026-04-12*
