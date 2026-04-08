# Phase 2: Output Mapping - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

The raw cortical vertex output is fully understood and a vertex-to-region mapping is defined for NeuroCut's target constructs. This phase takes the (61, 20484) numpy array from Phase 1 and creates a Python module that maps the 20,484 fsaverage5 cortical vertices to four brain regions: attention, reward, emotional processing, and social cognition. It also documents the temporal alignment including the 5-second hemodynamic delay.

Key inputs from Phase 1:
- Output shape: (61, 20484) — 61 one-second segments, 20,484 cortical vertices
- Value range: -1.48 to 1.80 (float32)
- Hemodynamic delay: ~5 seconds (fMRI convention)
- Actual inference results in docs/inference_output.json

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions. Key decisions include:
- Which neuroanatomical atlas to use for vertex-to-region mapping (Destrieux, Desikan-Killiany, or custom)
- How to obtain fsaverage5 ROI masks for the four target regions
- Whether to use nilearn, FreeSurfer labels, or manual vertex indices
- How to aggregate per-vertex activations to per-region scores (mean, median, weighted)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- docs/inference_output.json — actual measured values from Phase 1
- docs/model_output_format.md — documents the raw output format
- scripts/test_inference.py — reference for how TRIBE v2 outputs data

### Established Patterns
- Python scripts in scripts/ directory
- Documentation in docs/ directory

### Integration Points
- Output from this phase feeds into Phase 3 (Model Validation) — mapped scores used to test content differentiation
- Also feeds into Phase 7 (Handler Inference and Output) — postprocessor module for the RunPod worker

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. The four target brain regions are from the architecture doc:
1. Attention
2. Reward
3. Emotional processing
4. Social cognition

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
