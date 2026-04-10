---
phase: 33-functional-network-expansion
plan: 01
subsystem: region-mapping
tags: [brain-networks, schema, backend, frontend, backward-compatibility]
dependency_graph:
  requires: []
  provides: [9-network-definitions, expanded-region-scores, frontend-9-region-ui]
  affects: [postprocessor, generate-masks, brain-viewer, neural-timeline]
tech_stack:
  added: []
  patterns: [dynamic-model-construction, default-field-values]
key_files:
  created: []
  modified:
    - src/region_mapping/regions.py
    - src/region_mapping/constants.py
    - src/schema.py
    - src/postprocessor.py
    - tests/test_region_mapping.py
    - web/src/components/results/SegmentTable.tsx
    - web/src/components/results/brain-utils.ts
    - web/src/components/results/RegionValuesBar.tsx
    - web/src/components/results/NeuralTimeline.tsx
    - web/src/components/results/BrainViewer.tsx
    - web/src/components/results/__tests__/brain-utils.test.ts
decisions:
  - Used 0.0 defaults for new RegionScores fields to maintain backward compatibility with existing 4-region payloads
  - Replaced hardcoded RegionScores(...) with dynamic RegionScores(**region_vals) for forward extensibility
  - Kept arousal/valence computation using original 4 regions (neuroanatomically appropriate)
metrics:
  duration: 252s
  completed: "2026-04-10T20:15:52Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 11
---

# Phase 33 Plan 01: Functional Network Expansion Summary

Expanded NeuroCut from 4 to 9 functional brain networks across full stack with Destrieux atlas parcel mappings and backward-compatible schema evolution.

## What Was Done

### Task 1: Backend -- 5 new network definitions and schema update (788aaa1)

**Region definitions** (`src/region_mapping/regions.py`):
Added 5 new network entries to REGION_DEFINITIONS with neuroscience-cited Destrieux parcels:
- `visual_processing` (8 parcels): V1/calcarine, cuneus, fusiform, occipital pole
- `auditory_processing` (6 parcels): Heschl's gyrus, planum temporale, STG
- `language_narrative` (8 parcels): Broca's area (IFG), Wernicke's area (STG), angular gyrus
- `default_mode` (8 parcels): precuneus, PCC, mPFC, angular gyrus, temporal pole
- `motion_processing` (6 parcels): V5/MT+, intraparietal sulcus, parieto-occipital

**Constants** (`src/region_mapping/constants.py`):
Updated NEUROCUT_REGIONS list from 4 to 9 entries.

**Schema** (`src/schema.py`):
Added 5 new float fields to RegionScores with `= 0.0` default for backward compatibility.

**Postprocessor** (`src/postprocessor.py`):
Replaced hardcoded `RegionScores(attention=..., reward=..., ...)` with dynamic `RegionScores(**region_vals)`. Arousal/valence computation unchanged (still uses attention, emotional_processing, reward, social_cognition).

**Tests** (`tests/test_region_mapping.py`):
- Updated 3 existing tests to expect 9 regions
- Added `test_region_definitions_has_nine_networks` (asserts len == 9)
- Added `test_backward_compatibility_region_scores` (4-field payload parses, new fields default to 0.0)

### Task 2: Frontend -- types, colors, display arrays for 9 networks (ce5ce6a)

- `SegmentRegionScores` interface: 5 new number fields
- `REGION_COLORS`: 5 new hex colors (green, orange, cyan, rose, lime)
- `REGION_DISPLAY`: 5 new entries with 3-letter labels (VIS, AUD, LNG, DMN, MOT)
- `TRACK_CONFIG`: 5 new timeline tracks with gradient IDs
- `REGION_LABELS`: 5 new display labels
- `visibleRegions`: all 9 initialized to true
- `getTopRegion`: entries array expanded to 9 with Tailwind color classes
- Test updated to verify all 9 REGION_COLORS keys

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- Python tests: 7/7 passed (non-nilearn tests)
- Frontend tests: 37/37 passed (vitest)
- TypeScript: No errors in modified files (pre-existing errors in unrelated Supabase route files)
- Backward compatibility: RegionScores(**{4 fields}) correctly defaults new fields to 0.0

## Self-Check: PASSED
