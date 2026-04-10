# Requirements: NeuroCut

**Defined:** 2026-04-10
**Core Value:** Content creators upload a video and get per-segment neural engagement scores — showing exactly where viewers' brains light up and where they tune out

## v2.1 Requirements

Requirements for 21st.dev Component Integration milestone. Each maps to roadmap phases.

### Foundation

- [ ] **FOUN-01**: Framer Motion and react-use-measure are installed as project dependencies and verified working with existing components
- [ ] **FOUN-02**: A cn() utility (clsx + tailwind-merge) is available for component class merging

### Components

- [ ] **COMP-01**: Results page displays brain activation scores with spring-animated sliding number counters instead of static text
- [ ] **COMP-02**: Upload page has an animated drag-and-drop zone with per-file progress bars, video thumbnail previews, and file list management
- [ ] **COMP-03**: Processing page shows a wave loader animation with neural signal aesthetic while inference runs
- [ ] **COMP-04**: Welcome/marketing page has a WebGL lightning shader hero section adapted to the NeuroCut purple/cyan palette

## v2.2 Requirements

Requirements for Enhanced Brain Analytics milestone. Each maps to roadmap phases.

### Brain Visualization

- [ ] **VIZ-01**: User can see per-vertex cortical heatmap on the 3D brain showing activation intensity across all 20,484 vertices
- [ ] **VIZ-02**: User can toggle between heatmap view and region-blob view on the brain viewer
- [ ] **VIZ-03**: User can select between colormap options (Inferno, Plasma, Viridis) for the heatmap

### Functional Networks

- [ ] **NET-01**: Pipeline maps 5 new functional networks (visual, auditory, language, default mode, motion) from Destrieux atlas parcels
- [ ] **NET-02**: User can see and toggle all 9 functional networks on the brain viewer with color-coded legend

### Data Pipeline

- [ ] **DATA-01**: Pipeline sends per-vertex activation data as quantized uint8 base64 to minimize payload size
- [ ] **DATA-02**: API schema supports 9 functional network region scores while remaining backward-compatible with existing 4-region jobs
- [ ] **DATA-03**: A unified GLB mesh with 20,484 vertices preserving fsaverage5 ordering exists for heatmap rendering

### Arousal/Valence

- [ ] **AV-01**: User can see arousal and valence composite scores on the results page
- [ ] **AV-02**: User can see a circumplex chart plotting arousal vs valence with quadrant labels

## Future Requirements

### Animation Polish

- **ANIM-01**: Page transition animations between routes
- **ANIM-02**: Micro-interactions on dashboard cards (hover, click feedback)
- **ANIM-03**: Skeleton loading states with shimmer animations

## Out of Scope

| Feature | Reason |
|---------|--------|
| Sidebar/nav component replacement | Existing custom sidebar already matches design system well |
| Generic timeline components | Custom NeuralTimeline is purpose-built for activation data |
| shadcn/ui adoption | Project uses custom component library; mixing would create inconsistency |
| Mobile-specific animations | Web-first, mobile deferred |
| Virality score | Unreliable heuristic — failed to identify actual viral video |
| Hook score | Naive average of first 5 segments, doesn't measure hook quality |
| Retention score | Naive average of last 5 segments, doesn't measure actual retention |
| Subcortical regions (amygdala, striatum) | TRIBE v2 only outputs cortical surface predictions |
| Per-vertex temporal animation | Too much data for real-time playback; segment-level updates sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 27 | Pending |
| FOUN-02 | Phase 27 | Pending |
| COMP-01 | Phase 28 | Pending |
| COMP-02 | Phase 29 | Pending |
| COMP-03 | Phase 30 | Pending |
| COMP-04 | Phase 31 | Pending |
| VIZ-01 | Phase 36 | Pending |
| VIZ-02 | Phase 36 | Pending |
| VIZ-03 | Phase 36 | Pending |
| NET-01 | Phase 33 | Pending |
| NET-02 | Phase 37 | Pending |
| DATA-01 | Phase 34 | Pending |
| DATA-02 | Phase 33 | Pending |
| DATA-03 | Phase 35 | Pending |
| AV-01 | Phase 37 | Pending |
| AV-02 | Phase 37 | Pending |

**Coverage:**
- v2.1 requirements: 6 total (mapped)
- v2.2 requirements: 10 total (mapped)
- Unmapped: 0

---
*Requirements defined: 2026-04-10*
*Last updated: 2026-04-10 after v2.2 roadmap creation*
