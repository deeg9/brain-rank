# Phase 33: Functional Network Expansion - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The backend maps all 9 functional networks from Destrieux atlas parcels and the API schema supports them while staying backward-compatible with existing 4-region jobs.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key research findings to incorporate:
- 5 new networks: visual processing, auditory processing, language/narrative, default mode, motion processing
- Map to Destrieux atlas parcels (same pattern as existing 4 regions in regions.py)
- Schema evolution must be additive — old jobs with 4 regions must still parse
- Validate parcel names against nilearn's fetch_atlas_surf_destrieux() labels
- Handle potential parcel overlap between networks (existing precedent: Pole_temporal shared between emotional_processing and social_cognition)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/region_mapping/regions.py` — existing REGION_DEFINITIONS dict with 4 regions
- `src/region_mapping/scoring.py` — build_region_masks() and score_regions() functions
- `src/region_mapping/constants.py` — Destrieux atlas parcel definitions
- `src/schema.py` — RegionScores and Segment Pydantic models

### Established Patterns
- Regions defined as dict of region_name → list of Destrieux parcel names
- Masks built at startup via build_region_masks()
- Region scores computed as mean activation across masked vertices
- Schema uses Pydantic BaseModel with typed fields

### Integration Points
- `src/postprocessor.py` — calls score_regions(), assembles Segment objects
- `src/schema.py` — RegionScores model consumed by API response
- Frontend `SegmentTable.tsx` — SegmentRegionScores type must match

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
