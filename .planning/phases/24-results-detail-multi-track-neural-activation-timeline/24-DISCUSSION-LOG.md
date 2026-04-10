# Phase 24: Results Detail Multi-Track Neural Activation Timeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 24-results-detail-multi-track-neural-activation-timeline
**Areas discussed:** Charting Library, Track Colors, Data Source, Component Architecture, Interactivity, Video Player, Page Layout
**Mode:** --auto (all decisions auto-selected based on prior conversation and design spec)

---

## Charting Library

| Option | Description | Selected |
|--------|-------------|----------|
| Recharts | Most popular React charting lib, easy AreaChart | ✓ |
| D3 + custom SVG | Maximum control, more work | |
| Visx | D3 primitives as React components | |

**User's choice:** Recharts (decided in prior conversation)
**Notes:** User confirmed Recharts during audit gap discussion

## Track Colors

| Option | Description | Selected |
|--------|-------------|----------|
| Design spec colors | #60a5fa, #a78bfa, #f472b6, #fbbf24 | ✓ |
| Match RegionBreakdown colors | primary, tertiary-fixed-dim, secondary, on-surface-variant | |

**User's choice:** Design spec colors (from Stitch design generation task)
**Notes:** Auto-selected to match the design spec from 260409-s0u

## Data Source

| Option | Description | Selected |
|--------|-------------|----------|
| Existing SegmentData.regions | Already has all 4 region scores | ✓ |
| New API endpoint | Separate timeline data endpoint | |

**User's choice:** Existing data (auto — data already available)
**Notes:** SegmentRegionScores interface already has attention, reward, emotional_processing, social_cognition

## Component Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| New NeuralTimeline component | Separate from ActivationTimeline | ✓ |
| Modify ActivationTimeline | Upgrade existing component | |

**User's choice:** New component (auto — keeps Results Overview page unchanged)

## Claude's Discretion

- Chart height per track
- Tooltip styling and animation
- Responsive behavior
- Recharts performance optimizations
