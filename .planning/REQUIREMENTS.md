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

**Coverage:**
- v2.1 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0

---
*Requirements defined: 2026-04-10*
*Last updated: 2026-04-10 after roadmap creation*
