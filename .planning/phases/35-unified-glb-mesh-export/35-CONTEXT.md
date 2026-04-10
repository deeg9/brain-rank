# Phase 35: Unified GLB Mesh Export - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

A unified GLB mesh with 20,484 vertices preserving fsaverage5 ordering is created for heatmap rendering. This is a build-tool phase — a Python script generates a static GLB asset.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

Key research findings:
- The existing export_brain_glb.py splits vertices into 5 submeshes with remapped indices via extract_submesh()
- Per-vertex heatmaps require a SINGLE unified mesh where vertex i matches TRIBE v2 output index i
- Must NOT remap vertex indices — preserve the original fsaverage5 ordering
- Output: brain-fsaverage5-unified.glb alongside the existing brain-fsaverage5.glb
- Both GLB files should coexist — existing region-blob view uses the split meshes, heatmap uses unified
- Use trimesh with process=False to avoid automatic vertex deduplication

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/export_brain_glb.py` — existing script that exports split meshes
- `web/public/models/brain-fsaverage5.glb` — existing split mesh GLB
- nilearn's fetch_atlas_surf_destrieux() for fsaverage5 surface data

### Established Patterns
- Python script reads fsaverage5 surfaces from nilearn
- Uses trimesh to construct meshes and export as GLB
- Output goes to web/public/models/

### Integration Points
- Phase 36 (Heatmap Viewer) will load this unified GLB via useGLTF
- Vertex ordering must match TRIBE v2 output: left hemisphere 0-10241, right 10242-20483

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
