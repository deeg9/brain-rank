# Requirements: NeuroCut

**Defined:** 2026-04-11
**Core Value:** Content creators upload a video and get per-segment neural engagement scores — showing exactly where viewers' brains light up and where they tune out

## v3.0 Requirements

Requirements for Brain Visualization UX Overhaul milestone. Redesign brain viewer to match Meta's TRIBE v2 demo approach.

### Performance

- [ ] **PERF-01**: Brain viewer renders per-vertex activation colors using GPU-side LUT instead of CPU d3-color parsing
- [ ] **PERF-02**: Activation values interpolate smoothly between 2-second segments instead of snapping
- [ ] **PERF-03**: Video-to-brain sync polls currentTime at 60fps via requestVideoFrameCallback

### Visualization

- [ ] **VIS-01**: Brain regions glow only above an activation threshold — below-threshold vertices appear dark
- [ ] **VIS-02**: All toggle controls removed — no heatmap/regions switch, no 9 network filter buttons, no colormap dropdown
- [ ] **VIS-03**: Static non-interactive color legend shows which color maps to which brain network
- [ ] **VIS-04**: Brain viewer header is clean — no crowded controls, just a title

### Polish

- [ ] **POL-01**: Brain auto-rotates slowly when user is not interacting with it
- [ ] **POL-02**: Peak activation moments are marked on the neural timeline

## Future Requirements

None yet.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Comparison mode (two stimuli side-by-side) | Meta has this in their demo but it requires paired analysis — defer |
| Expert/advanced mode with toggles | Keep the simplified view as primary; revisit if users request it |
| Per-vertex temporal animation (sub-segment) | TRIBE v2 outputs 2-second segments; interpolation is cosmetic, not data-driven |
| Custom colormap selector | Meta uses one colormap — simplicity over configurability |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERF-01 | Phase 39 | Pending |
| PERF-02 | Phase 42 | Pending |
| PERF-03 | Phase 39 | Pending |
| VIS-01 | Phase 41 | Pending |
| VIS-02 | Phase 40 | Pending |
| VIS-03 | Phase 41 | Pending |
| VIS-04 | Phase 40 | Pending |
| POL-01 | Phase 42 | Pending |
| POL-02 | Phase 43 | Pending |

**Coverage:**
- v3.0 requirements: 9 total
- Mapped: 9/9
- Unmapped: 0

---
*Requirements defined: 2026-04-11*
*Traceability updated: 2026-04-11 (roadmap created)*
