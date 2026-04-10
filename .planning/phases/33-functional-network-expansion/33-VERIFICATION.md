---
status: passed
verified_at: 2026-04-10
---

# Phase 33: Functional Network Expansion — Verification

## Results

**Status: PASSED**

### Success Criteria Check

1. ✅ regions.py defines vertex masks for 5 new functional networks using Destrieux atlas parcels
2. ✅ API response schema includes all 9 network scores per segment; existing 4-region jobs still parse correctly (new fields default to 0.0)
3. ✅ Frontend displays all 9 networks in timeline and brain viewer toggle legend

### Visual Verification

- Neural Activation Timeline shows 9 tracks (4 original + 5 new)
- Brain viewer region toggles show all 9 networks with distinct colors
- New networks show 0 values for existing jobs (backward compatible — no data yet)
- No console errors from the schema change

### Files Modified

- `src/region_mapping/regions.py` — 9 network definitions
- `src/region_mapping/constants.py` — NEUROCUT_REGIONS expanded
- `src/schema.py` — RegionScores with 9 fields
- `src/postprocessor.py` — Dynamic region scoring
- `web/src/components/results/SegmentTable.tsx` — 9-region types
- `web/src/components/results/brain-utils.ts` — 9 region colors
- `web/src/components/results/BrainViewer.tsx` — 9 region labels/toggles
- `web/src/components/results/NeuralTimeline.tsx` — 9 track config
