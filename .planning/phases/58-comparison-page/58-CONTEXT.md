# Phase 58: Comparison Page - Context

**Gathered:** 2026-04-12
**Status:** Complete

<domain>
## Phase Boundary

Side-by-side comparison view for any two completed analyses with metric deltas and cross-type disclaimers.
</domain>

<decisions>
## Implementation Decisions

- Route: /compare?a={id1}&b={id2} with query params
- Two dropdown selectors populated from user's completed analyses
- 2-column metrics table (no brain viewers — perf risk per research)
- Green +X.X / Red -X.X deltas next to each metric
- Cross-type disclaimer: yellow banner when input_types differ, deltas show "N/A"
</decisions>
