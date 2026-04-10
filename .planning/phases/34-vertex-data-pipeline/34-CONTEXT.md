# Phase 34: Vertex Data Pipeline - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Per-vertex activation data is transmitted efficiently as quantized uint8 base64-encoded payloads instead of raw float arrays. The postprocessor quantizes 20,484 float32 vertex activations to uint8, base64-encodes them, and includes them in the API response. The frontend can decode this back to typed arrays for heatmap rendering.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

Key research findings to incorporate:
- Quantize float32 to uint8 (0-255) using percentile-based normalization (already used for region scores)
- Base64-encode the uint8 array for JSON transport (~28KB per segment vs ~80KB raw floats)
- Add `vertex_data` field to Segment schema (optional, list of base64 strings)
- Add `include_vertex_data` flag to InputSchema (default true for new jobs)
- Frontend needs a `vertex-codec.ts` utility to decode base64 → Uint8Array → Float32Array with colormap
- Existing API consumers that don't read vertex_data continue working unchanged

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/postprocessor.py` — already does percentile normalization on raw vertices
- `src/schema.py` — Pydantic models for input/output
- `src/region_mapping/scoring.py` — vertex-level operations

### Established Patterns
- Pydantic BaseModel with typed fields and defaults
- Postprocessor builds Segment objects with region scores
- Frontend fetches results JSON from /api/jobs/[id]

### Integration Points
- `src/postprocessor.py` — add vertex quantization after normalization
- `src/schema.py` — add vertex_data field to Segment
- `web/src/lib/` — new vertex-codec.ts utility
- Phase 36 (Heatmap Viewer) will consume the decoded vertex data

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
