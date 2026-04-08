# Phase 2: Output Mapping - Research

**Researched:** 2026-04-07
**Domain:** Neuroimaging parcellation (fsaverage5 cortical surface to named brain regions)
**Confidence:** HIGH

## Summary

Phase 2 takes the raw `(61, 20484)` numpy array from TRIBE v2 inference and creates a Python module that (1) maps each of the 20,484 cortical vertices to one of four functional brain regions (attention, reward, emotional processing, social cognition), (2) aggregates per-vertex activations into per-region scores, and (3) documents the 5-second hemodynamic delay for temporal alignment.

The mapping is achievable using nilearn's `fetch_atlas_surf_destrieux()` function, which returns per-vertex integer labels for all 20,484 vertices in fsaverage5 space (10,242 per hemisphere). The Destrieux atlas provides 76 anatomical parcels per hemisphere with names like `G_front_sup`, `S_temporal_sup`, etc. The task is to group these anatomical parcels into the four functional constructs NeuroCut needs. This is a neuroscience mapping problem with well-established literature support but requires careful parcel selection.

**Primary recommendation:** Use nilearn 0.13.1 with `fetch_atlas_surf_destrieux()` to get vertex-level labels, then define a Python dictionary mapping Destrieux label names to each of the four target regions based on established neuroscience functional anatomy.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MODL-03 | Raw TRIBE v2 output format (20,484 cortical vertices per timestep) is documented and understood | Phase 1 already documented this in `docs/model_output_format.md`. This phase codifies it in a Python module with constants. |
| MODL-04 | Vertex-to-region mapping defined for target brain regions (attention, reward, emotional processing, social cognition) | Destrieux atlas via nilearn provides vertex-level labels; research below provides the parcel-to-region mapping. |
| MODL-06 | Hemodynamic delay (5-second offset) accounted for in temporal alignment | Standard HRF peaks at 5-6s; simple index shift of 5 positions aligns predictions to stimuli. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nilearn | 0.13.1 | Fetch Destrieux atlas parcellation for fsaverage5 | The standard neuroimaging library for Python. `fetch_atlas_surf_destrieux()` returns vertex-to-label arrays for both hemispheres in fsaverage5 space -- exactly the 10,242+10,242 = 20,484 vertices TRIBE v2 outputs. [VERIFIED: PyPI shows 0.13.1 released 2026-02-10] |
| numpy | (already pinned by TRIBE v2) | Array operations for masking and aggregation | Already a project dependency. Used for boolean indexing into vertex arrays. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pandas | (already available via TRIBE v2) | Optional: label lookup tables | Only if needed for exploration/debugging of atlas labels |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Destrieux atlas (76 parcels/hemi) | Desikan-Killiany atlas (34 parcels/hemi) | DK is coarser -- fewer parcels means less precise ROI definition. nilearn has `fetch_atlas_surf_destrieux` built in; DK surface atlas is NOT available as a built-in nilearn function. Destrieux is the better choice. [VERIFIED: nilearn docs] |
| nilearn atlas fetch | Manual FreeSurfer annot file parsing | Requires FreeSurfer installed. nilearn handles download and parsing automatically. |
| nilearn atlas fetch | Hardcoded vertex index arrays | Brittle, unverifiable, no provenance. Using the atlas makes the mapping auditable. |

**Installation (runtime dependency for postprocessor):**
```bash
pip install nilearn==0.13.1
```

**Note:** nilearn is needed only at build/setup time to generate the vertex masks. The generated masks (numpy boolean arrays) can be serialized and loaded at inference time WITHOUT nilearn as a runtime dependency. This keeps the Docker image smaller (see Architecture Patterns below).

## Architecture Patterns

### Recommended Project Structure
```
src/
  region_mapping/
    __init__.py           # Public API: get_region_masks(), REGION_DEFINITIONS
    atlas.py              # Fetches Destrieux atlas, builds vertex masks
    regions.py            # Defines which Destrieux parcels map to each NeuroCut region
    temporal.py           # Hemodynamic delay alignment utilities
    constants.py          # N_VERTICES, HRF_DELAY_S, HEMISPHERE_SIZE, etc.
data/
  region_masks.npz        # Pre-computed boolean masks (optional, for Docker)
scripts/
  generate_masks.py       # One-time script: fetch atlas, build masks, save to data/
  validate_mapping.py     # Visual/statistical validation of region assignments
docs/
  vertex_mapping.md       # Documentation of which parcels map to which regions and why
```

### Pattern 1: Destrieux Parcel-to-Region Mapping
**What:** A Python dictionary mapping each NeuroCut functional region to a list of Destrieux atlas label names.
**When to use:** Always -- this IS the core deliverable of Phase 2.
**Example:**
```python
# Source: Destrieux et al. 2010 (PMC2937159) + functional neuroanatomy literature
# Each key is a NeuroCut region; values are Destrieux label names (applied to BOTH hemispheres)

REGION_DEFINITIONS = {
    "attention": [
        # Dorsal attention network (Corbetta & Shulman 2002)
        "S_intrapariet_and_P_trans",  # Intraparietal sulcus (IPS)
        "G_front_middle",              # Frontal eye fields (FEF) -- middle frontal gyrus
        "G_parietal_sup",              # Superior parietal lobule (SPL)
        "S_front_middle",              # Middle frontal sulcus
        "S_front_sup",                 # Superior frontal sulcus
        # Ventral attention network
        "G_pariet_inf-Supramar",       # Supramarginal gyrus (TPJ component)
        "G_front_inf-Opercular",       # Ventral frontal cortex
    ],
    "reward": [
        # Reward/valuation network (Bartra et al. 2013)
        # Note: Ventral striatum is subcortical -- NOT on cortical surface
        # Cortical reward regions only:
        "G_rectus",                     # Gyrus rectus (vmPFC component)
        "G_subcallosal",                # Subcallosal area (vmPFC component)
        "G_and_S_cingul-Ant",           # Anterior cingulate (ACC)
        "G_and_S_cingul-Mid-Ant",       # Mid-anterior cingulate
        "G_orbital",                    # Orbital gyri (OFC)
        "S_orbital-H_Shaped",           # H-shaped orbital sulcus
        "S_orbital_lateral",            # Lateral orbital sulcus
        "S_orbital_med-olfact",         # Medial orbital/olfactory sulcus
        "G_front_inf-Orbital",          # Orbital part of IFG
    ],
    "emotional_processing": [
        # Emotion network (Lindquist et al. 2012)
        # Note: Amygdala is subcortical -- NOT on cortical surface
        # Cortical emotion regions:
        "G_insular_short",              # Short insular gyri (anterior insula)
        "G_Ins_lg_and_S_cent_ins",      # Long insular gyrus
        "S_circular_insula_ant",        # Anterior circular sulcus of insula
        "S_circular_insula_sup",        # Superior circular sulcus of insula
        "S_circular_insula_inf",        # Inferior circular sulcus of insula
        "G_and_S_cingul-Mid-Post",      # Mid-posterior cingulate
        "G_cingul-Post-dorsal",         # Posterior dorsal cingulate
        "G_temp_sup-Plan_polar",        # Planum polare (anterior STG)
        "Pole_temporal",                # Temporal pole
    ],
    "social_cognition": [
        # Social brain network (Frith & Frith 2007; Saxe 2006)
        "S_temporal_sup",               # Superior temporal sulcus (STS)
        "G_temp_sup-Lateral",           # Lateral superior temporal gyrus
        "G_temp_sup-Plan_tempo",        # Planum temporale
        "G_pariet_inf-Angular",         # Angular gyrus (TPJ component)
        "G_precuneus",                  # Precuneus
        "G_front_sup",                  # Superior frontal gyrus (mPFC component)
        "G_cingul-Post-ventral",        # Posterior ventral cingulate / isthmus
        "Pole_temporal",                # Temporal pole (shared with emotion)
    ],
}
```

**Critical caveat:** Some parcels appear in multiple regions (e.g., `Pole_temporal` in both emotional_processing and social_cognition). This is neuroanatomically valid -- brain regions serve multiple functions. The aggregation math must handle this (vertices counted in both region means). [ASSUMED]

### Pattern 2: Vertex Mask Generation from Atlas
**What:** Convert Destrieux label names into boolean numpy arrays indexing into the 20,484 vertex array.
**When to use:** Once at setup, result cached.
**Example:**
```python
# Source: nilearn official docs (fetch_atlas_surf_destrieux)
from nilearn.datasets import fetch_atlas_surf_destrieux
import numpy as np

def build_region_masks(region_definitions):
    """Build boolean masks for each NeuroCut region from Destrieux atlas."""
    atlas = fetch_atlas_surf_destrieux()
    labels = atlas["labels"]  # list of 76 str label names
    map_left = atlas["map_left"]    # shape (10242,) int array
    map_right = atlas["map_right"]  # shape (10242,) int array

    # Combine hemispheres: left first, right second (fsaverage5 convention)
    full_map = np.concatenate([map_left, map_right])  # shape (20484,)

    masks = {}
    for region_name, parcel_names in region_definitions.items():
        mask = np.zeros(20484, dtype=bool)
        for parcel_name in parcel_names:
            if parcel_name in labels:
                label_idx = labels.index(parcel_name)
                mask |= (full_map == label_idx)
            else:
                raise ValueError(f"Unknown Destrieux label: {parcel_name}")
        masks[region_name] = mask
        # Log coverage: how many vertices in this region
        print(f"  {region_name}: {mask.sum()} vertices ({mask.sum()/20484*100:.1f}%)")

    return masks
```

### Pattern 3: Per-Region Score Aggregation
**What:** Compute a single score per region per timestep from vertex-level predictions.
**When to use:** In the postprocessor, every inference call.
**Example:**
```python
def compute_region_scores(predictions, masks):
    """
    predictions: np.ndarray shape (n_segments, 20484), float32
    masks: dict of {region_name: np.ndarray shape (20484,) bool}
    returns: dict of {region_name: np.ndarray shape (n_segments,) float32}
    """
    scores = {}
    for region_name, mask in masks.items():
        # Mean activation across all vertices in the region
        region_activations = predictions[:, mask]  # (n_segments, n_region_vertices)
        scores[region_name] = region_activations.mean(axis=1)  # (n_segments,)
    return scores
```

### Pattern 4: Hemodynamic Delay Correction
**What:** Shift prediction indices by 5 positions to align brain response with stimulus.
**When to use:** Before returning scores to the caller.
**Example:**
```python
HRF_DELAY_SECONDS = 5  # Standard hemodynamic response peak delay

def align_to_stimulus(predictions, segments, hrf_delay=HRF_DELAY_SECONDS):
    """
    Shift predictions backward by hrf_delay to align with video content.

    predictions[t] corresponds to brain response to stimulus at t - hrf_delay.
    After alignment: aligned[t] = predictions[t + hrf_delay]

    The last hrf_delay segments have no corresponding prediction and are NaN.
    """
    n_segments = predictions.shape[0]
    aligned = np.full_like(predictions[:n_segments - hrf_delay], np.nan)

    # predictions[5] was caused by stimulus at t=0
    # predictions[6] was caused by stimulus at t=1
    # So aligned[0] = predictions[5], aligned[1] = predictions[6], etc.
    aligned = predictions[hrf_delay:]  # shape (n_segments - hrf_delay, 20484)

    # Trim segments list to match
    aligned_segments = segments[:n_segments - hrf_delay]

    return aligned, aligned_segments
```

### Pattern 5: Pre-computed Masks for Docker (No nilearn at Runtime)
**What:** Generate masks once, save as .npz, load at inference time without nilearn.
**When to use:** In the Docker container to avoid installing nilearn (saves image size).
**Example:**
```python
# scripts/generate_masks.py -- run once locally or in CI
import numpy as np
from region_mapping.atlas import build_region_masks
from region_mapping.regions import REGION_DEFINITIONS

masks = build_region_masks(REGION_DEFINITIONS)
np.savez("data/region_masks.npz", **{k: v for k, v in masks.items()})
print("Masks saved to data/region_masks.npz")

# In Docker / postprocessor:
def load_masks(path="data/region_masks.npz"):
    data = np.load(path)
    return {key: data[key] for key in data.files}
```

### Anti-Patterns to Avoid
- **Hardcoding vertex indices:** Never write `attention_vertices = [0, 1, 2, ..., 500]`. Use the atlas for provenance and auditability.
- **Using volumetric (MNI) atlases for surface data:** TRIBE v2 outputs on fsaverage5 surface mesh, not in MNI volumetric space. Do NOT use `fetch_atlas_destrieux_2009()` (that is the volumetric version). Use `fetch_atlas_surf_destrieux()` (surface version).
- **Ignoring hemisphere ordering:** The 20,484 vertices are left hemisphere first (indices 0-10241), right hemisphere second (indices 10242-20483). The atlas returns separate `map_left` and `map_right` arrays that must be concatenated in this order.
- **Normalizing raw values to 0-100 prematurely:** Keep raw z-score-like values during this phase. Normalization to 0-100 is a presentation concern for Phase 7 (Handler Output).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vertex-to-parcel assignment | Manual vertex index lists | nilearn `fetch_atlas_surf_destrieux()` | Atlas provides validated, published parcellation. Hand-rolled indices are unverifiable. |
| fsaverage5 mesh data | Download and parse FreeSurfer files manually | nilearn `load_fsaverage(mesh_name="fsaverage5")` | Handles download, caching, parsing. |
| Hemodynamic response function | Complex HRF convolution model | Simple 5-second integer shift | TRIBE v2 already accounts for HRF shape internally. We only need the peak delay offset. |

**Key insight:** The hard part of this phase is NOT code -- it is the neuroscience decision of which brain parcels correspond to "attention", "reward", etc. The code is straightforward numpy boolean masking. Get the mapping right first, then the code is trivial.

## Common Pitfalls

### Pitfall 1: Using the Volumetric Atlas Instead of Surface Atlas
**What goes wrong:** nilearn has TWO Destrieux functions: `fetch_atlas_destrieux_2009()` (volumetric, MNI space) and `fetch_atlas_surf_destrieux()` (surface, fsaverage5). Using the volumetric version produces labels that cannot be applied to TRIBE v2's surface vertices.
**Why it happens:** The volumetric version appears first in many tutorials and search results.
**How to avoid:** Always use `fetch_atlas_surf_destrieux()`. The return has `map_left` and `map_right` keys (surface). The volumetric version has `maps` key (3D volume).
**Warning signs:** Return object has no `map_left`/`map_right` keys; data shape is 3D instead of 1D.

### Pitfall 2: Wrong Hemisphere Concatenation Order
**What goes wrong:** If right hemisphere is placed before left, every vertex gets mapped to the wrong brain region. All scores are nonsensical.
**Why it happens:** The ordering convention (left-first) is implicit in fsaverage5 but not always documented clearly.
**How to avoid:** Verify by checking that `full_map[0:10242]` matches `map_left` and `full_map[10242:]` matches `map_right`. Add an assertion.
**Warning signs:** Region scores are identical when they should differ; attention score suspiciously correlates with reward score.

### Pitfall 3: Subcortical Regions Not on Cortical Surface
**What goes wrong:** Trying to find amygdala, hippocampus, ventral striatum, or nucleus accumbens in the Destrieux surface atlas. These are subcortical structures -- they do NOT appear on the cortical surface mesh.
**Why it happens:** Neuroscience literature associates reward heavily with ventral striatum and emotion with amygdala. Developers assume these must be in the atlas.
**How to avoid:** Accept that cortical surface parcellation only covers the cortex. Use cortical proxies: vmPFC/OFC for reward valuation, anterior insula for emotion, mPFC for social cognition.
**Warning signs:** Cannot find expected label name in the atlas labels list.

### Pitfall 4: Hemodynamic Delay Applied in Wrong Direction
**What goes wrong:** Shifting predictions forward instead of backward, or shifting stimuli instead of predictions. Result: scores are misaligned by 10 seconds instead of aligned.
**Why it happens:** The delay is confusing: brain responds AFTER stimulus, so prediction at t=10 was caused by stimulus at t=5. "Shift predictions back by 5" vs "align stimulus forward by 5" can be confused.
**How to avoid:** Use clear variable naming. Test with known stimuli: if a loud event happens at t=20 in the video, the auditory cortex activation should peak at t=20 after alignment (not t=25).
**Warning signs:** Region activations peak 10 seconds before or after expected events.

### Pitfall 5: Overlapping Region Parcels Causing Double-Counting
**What goes wrong:** If a vertex appears in both "emotional_processing" and "social_cognition" masks, the overall activation (mean of all regions) double-counts that vertex.
**Why it happens:** Brain regions genuinely overlap in function. The temporal pole contributes to both emotion and social cognition.
**How to avoid:** Document overlaps explicitly. For per-region scores, overlap is fine (each region's mean is independent). For an "overall" score, either use all vertices (ignoring regions) or use a union of region masks.

## Code Examples

### Complete Atlas Loading and Mask Generation
```python
# Source: nilearn docs (fetch_atlas_surf_destrieux) + TRIBE v2 output format
from nilearn.datasets import fetch_atlas_surf_destrieux
import numpy as np

# Fetch the atlas (downloads ~2MB on first call, cached after)
atlas = fetch_atlas_surf_destrieux()

# atlas["labels"] is a list of 76 strings
# atlas["map_left"] is np.ndarray of shape (10242,) with int values 0-75
# atlas["map_right"] is np.ndarray of shape (10242,) with int values 0-75

# Verify expected shapes
assert atlas["map_left"].shape == (10242,), f"Unexpected left shape: {atlas['map_left'].shape}"
assert atlas["map_right"].shape == (10242,), f"Unexpected right shape: {atlas['map_right'].shape}"

# Combine: left hemisphere first (indices 0-10241), right second (10242-20483)
full_map = np.concatenate([atlas["map_left"], atlas["map_right"]])
assert full_map.shape == (20484,), f"Unexpected combined shape: {full_map.shape}"

# Build a mask for a specific label
label_names = atlas["labels"]
print(f"Number of labels: {len(label_names)}")
print(f"First 5 labels: {label_names[:5]}")

# Example: find all vertices in the intraparietal sulcus
ips_label = "S_intrapariet_and_P_trans"
ips_idx = label_names.index(ips_label)
ips_mask = (full_map == ips_idx)
print(f"IPS vertices: {ips_mask.sum()} of 20484 ({ips_mask.sum()/20484*100:.1f}%)")
```

### Hemodynamic Delay Alignment
```python
# Source: fMRI hemodynamic response literature (Buxton et al. 2004)
import numpy as np

HRF_DELAY = 5  # seconds (peak of canonical HRF)

# predictions shape: (61, 20484) -- 61 one-second segments
# After alignment: (56, 20484) -- first 5 seconds have no aligned prediction
# predictions[5] was caused by stimulus at video second 0
# predictions[6] was caused by stimulus at video second 1

aligned = predictions[HRF_DELAY:]  # (56, 20484)
# aligned[i] now corresponds to video second i
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Desikan-Killiany (34 parcels) | Destrieux (76 parcels) for finer ROIs | 2009 (Destrieux paper) | More precise region definitions, better separation of gyri and sulci |
| Manual FreeSurfer annot parsing | nilearn `fetch_atlas_surf_destrieux()` | nilearn 0.3+ | No FreeSurfer installation needed |
| nilearn `fetch_surf_fsaverage` | nilearn `load_fsaverage` | nilearn 0.11+ | Newer API, but both work. `fetch_atlas_surf_destrieux()` still uses old API internally. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | TRIBE v2 vertex ordering is left hemisphere first (0-10241), right hemisphere second (10242-20483) in fsaverage5 convention | Architecture Patterns | All region masks would be assigned to wrong hemisphere. Verify by checking if known lateralized activation (e.g., language in left hemisphere) maps correctly. |
| A2 | The specific Destrieux parcels listed for each NeuroCut region are appropriate based on functional neuroanatomy literature | Architecture Patterns, Pattern 1 | Region scores would not meaningfully reflect the intended cognitive construct. Mitigated by Phase 3 (Model Validation) which tests content differentiation. |
| A3 | Mean aggregation across vertices within a region is appropriate (vs. median, max, or weighted) | Architecture Patterns, Pattern 3 | Could miss focal activations if mean dilutes them. Mean is standard in fMRI ROI analysis but can be refined later. |
| A4 | A simple 5-second integer shift is sufficient for hemodynamic delay (vs. HRF convolution/deconvolution) | Architecture Patterns, Pattern 4 | Minor temporal misalignment of 1-2 seconds for some brain regions. The HRF peak varies by region (4-6s). Acceptable for NeuroCut's 2-second window output. |
| A5 | Overlapping parcels between regions (e.g., Pole_temporal in both emotion and social) are acceptable | Pitfall 5 | Per-region scores remain independent and valid. Only affects an "overall" combined score if naively averaged. |

## Open Questions

1. **Hemisphere ordering verification**
   - What we know: fsaverage5 convention is left-first, confirmed by nilearn's separate `map_left`/`map_right` returns.
   - What's unclear: Whether TRIBE v2 follows this exact convention or has its own ordering.
   - Recommendation: In Phase 3 validation, present a known lateralized stimulus (speech) and verify that left-hemisphere language regions activate more strongly. If they don't, try swapping hemispheres.

2. **Region parcel selection refinement**
   - What we know: The parcels listed are based on established neuroscience functional anatomy.
   - What's unclear: Whether these specific parcels produce the best differentiation for NeuroCut's use case (video content engagement).
   - Recommendation: Start with the proposed mapping. Phase 3 validation will test differentiation. Refine if needed.

3. **Aggregation method**
   - What we know: Mean is the standard in fMRI ROI analysis.
   - What's unclear: Whether TRIBE v2's predicted activations behave like real fMRI data (they are model predictions, not measured data).
   - Recommendation: Start with mean. If Phase 3 shows poor differentiation, try median or trimmed mean.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest (standard Python) |
| Config file | None -- Wave 0 will create pytest.ini |
| Quick run command | `pytest tests/test_region_mapping.py -x` |
| Full suite command | `pytest tests/ -x` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MODL-03 | Output format constants match Phase 1 documented values (shape, dtype, range) | unit | `pytest tests/test_region_mapping.py::test_output_constants -x` | No -- Wave 0 |
| MODL-04 | Region masks cover >0 vertices each, total < 20484, no empty regions | unit | `pytest tests/test_region_mapping.py::test_region_masks_valid -x` | No -- Wave 0 |
| MODL-04 | All Destrieux label names in REGION_DEFINITIONS exist in atlas | unit | `pytest tests/test_region_mapping.py::test_label_names_valid -x` | No -- Wave 0 |
| MODL-04 | Region score computation produces correct shape output | unit | `pytest tests/test_region_mapping.py::test_region_scores_shape -x` | No -- Wave 0 |
| MODL-06 | Hemodynamic alignment reduces segment count by HRF_DELAY | unit | `pytest tests/test_region_mapping.py::test_hrf_alignment -x` | No -- Wave 0 |
| MODL-06 | Aligned predictions[0] equals raw predictions[HRF_DELAY] | unit | `pytest tests/test_region_mapping.py::test_hrf_alignment_values -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pytest tests/test_region_mapping.py -x`
- **Per wave merge:** `pytest tests/ -x`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/test_region_mapping.py` -- covers MODL-03, MODL-04, MODL-06
- [ ] `tests/conftest.py` -- shared fixtures (mock predictions array, mock atlas)
- [ ] `pytest.ini` -- basic pytest configuration
- [ ] Framework install: `pip install pytest` -- if not present

## Security Domain

Security enforcement is not applicable to this phase. This is a pure data-processing module with no user input, no network access, no authentication, and no secrets. The only external data is the Destrieux atlas downloaded from nilearn's CDN (a trusted academic source).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.11 | All code | Assumed (project constraint) | 3.11 | -- |
| nilearn | Atlas fetching | Needs install | 0.13.1 target | -- |
| numpy | Array operations | Available (TRIBE v2 dep) | pinned by TRIBE v2 | -- |
| pytest | Validation tests | Needs install | latest | -- |
| Internet access | First atlas download (~2MB) | Required once | -- | Pre-download and commit atlas data |

**Missing dependencies with no fallback:** None (nilearn is installable via pip).

**Missing dependencies with fallback:**
- Internet access for atlas download: Can pre-download in CI/local and ship the .npz masks in the repo.

## Sources

### Primary (HIGH confidence)
- [nilearn `fetch_atlas_surf_destrieux` docs](https://nilearn.github.io/stable/modules/generated/nilearn.datasets.fetch_atlas_surf_destrieux.html) -- API, return structure, label format [VERIFIED: WebFetch]
- [Destrieux et al. 2010 (PMC2937159)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2937159/) -- Complete 74-label parcellation with anatomical descriptions [VERIFIED: WebFetch]
- [nilearn PyPI](https://pypi.org/project/nilearn/) -- Version 0.13.1, released 2026-02-10 [VERIFIED: WebFetch]
- [docs/model_output_format.md](../../../docs/model_output_format.md) -- Phase 1 output: (61, 20484), float32, fsaverage5 [VERIFIED: local file]
- [docs/inference_output.json](../../../docs/inference_output.json) -- Actual measured values from Phase 1 [VERIFIED: local file]

### Secondary (MEDIUM confidence)
- [Dorsal attention network (Wikipedia)](https://en.wikipedia.org/wiki/Dorsal_attention_network) -- FEF, IPS, SPL as attention network components [CITED: Wikipedia + Corbetta & Shulman 2002]
- [Hemodynamic response (ScienceDirect)](https://www.sciencedirect.com/topics/psychology/hemodynamic-response) -- HRF peaks at 5-6 seconds post-stimulus [CITED: standard neuroscience textbook knowledge]
- [Ventromedial PFC in social cognition and emotion (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S0006322317322035) -- vmPFC role in emotion, decision making, social cognition [CITED: Hiser & Koenigs 2018]

### Tertiary (LOW confidence)
- Specific Destrieux label-to-functional-region assignments are based on neuroscience literature consensus but have not been validated against TRIBE v2's specific activation patterns [ASSUMED -- see A2 in Assumptions Log]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- nilearn is the established tool, API is documented and verified
- Architecture: HIGH -- boolean mask approach is standard fMRI ROI analysis
- Region mapping: MEDIUM -- parcel selection is neuroscience-informed but needs Phase 3 validation
- Hemodynamic delay: HIGH -- 5-second peak delay is textbook fMRI knowledge
- Pitfalls: HIGH -- hemisphere ordering and surface-vs-volume atlas confusion are well-documented issues

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable domain; atlas definitions don't change)
