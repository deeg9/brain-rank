# NeuroCut Vertex-to-Region Mapping

## Overview

TRIBE v2 (Meta's brain-activation prediction model) outputs a numpy array of shape `(n_segments, 20484)` representing predicted cortical vertex activations for each 1-second segment of video input.

**20,484 vertices** correspond to the **fsaverage5 surface mesh**:
- **Left hemisphere:** 10,242 vertices (indices 0--10,241)
- **Right hemisphere:** 10,242 vertices (indices 10,242--20,483)

**Temporal resolution:** 1 second per segment.

**Values:** Predicted fMRI BOLD activations in z-score-like units, with a measured range of -1.48 to 1.80 (mean ~0.09, std ~0.23) from Phase 1 validation on a 60-second Sintel trailer.

NeuroCut maps these raw vertex activations to four functional brain regions to produce interpretable engagement scores.

## NeuroCut Regions

### 1. Attention

**Cognitive construct:** Sustained and selective visual attention, spatial orienting, and top-down attentional control.

**Parcels (7 Destrieux labels, both hemispheres):**

| Parcel | Anatomical Name | Network Role |
|--------|----------------|--------------|
| S_intrapariet_and_P_trans | Intraparietal sulcus (IPS) | Dorsal attention: spatial attention, saccade planning |
| G_front_middle | Middle frontal gyrus | Dorsal attention: frontal eye fields (FEF) |
| G_parietal_sup | Superior parietal lobule (SPL) | Dorsal attention: visuospatial processing |
| S_front_middle | Middle frontal sulcus | Dorsal attention: working memory, attention control |
| S_front_sup | Superior frontal sulcus | Dorsal attention: supplementary eye fields |
| G_pariet_inf-Supramar | Supramarginal gyrus | Ventral attention: TPJ component, reorienting |
| G_front_inf-Opercular | Opercular part of IFG | Ventral attention: inhibitory control |

**Coverage:** 2,905 vertices (14.2%) -- 1,499 left, 1,406 right.

**Citation:** Corbetta & Shulman (2002). Control of goal-directed and stimulus-driven attention in the brain. *Nature Reviews Neuroscience*, 3(3), 201--215.

### 2. Reward

**Cognitive construct:** Reward valuation, pleasure response, motivation, and reinforcement learning.

**Parcels (9 Destrieux labels, both hemispheres):**

| Parcel | Anatomical Name | Network Role |
|--------|----------------|--------------|
| G_rectus | Gyrus rectus | vmPFC component: value computation |
| G_subcallosal | Subcallosal area | vmPFC component: reward expectation |
| G_and_S_cingul-Ant | Anterior cingulate cortex (ACC) | Reward monitoring, conflict detection |
| G_and_S_cingul-Mid-Ant | Mid-anterior cingulate | Reward-effort integration |
| G_orbital | Orbital gyri | OFC: reward outcome evaluation |
| S_orbital-H_Shaped | H-shaped orbital sulcus | OFC component |
| S_orbital_lateral | Lateral orbital sulcus | OFC component |
| S_orbital_med-olfact | Medial orbital/olfactory sulcus | OFC: hedonic value |
| G_front_inf-Orbital | Orbital part of IFG | Reward-related decision making |

**Coverage:** 1,476 vertices (7.2%) -- 703 left, 773 right.

**Cortical-only limitation:** The ventral striatum (nucleus accumbens) and ventral tegmental area (VTA) are primary reward structures but are subcortical -- they do NOT appear on the cortical surface mesh. This region captures cortical reward processing (vmPFC, OFC, ACC) which correlates with but does not directly measure subcortical reward signals.

**Citation:** Bartra, McGuire & Kable (2013). The valuation system: A coordinate-based meta-analysis of BOLD fMRI experiments examining neural correlates of subjective value. *NeuroImage*, 76, 412--427.

### 3. Emotional Processing

**Cognitive construct:** Emotional salience detection, interoception, affective arousal, and emotional regulation.

**Parcels (9 Destrieux labels, both hemispheres):**

| Parcel | Anatomical Name | Network Role |
|--------|----------------|--------------|
| G_insular_short | Short insular gyri | Anterior insula: interoception, emotional awareness |
| G_Ins_lg_and_S_cent_ins | Long insular gyrus | Insula: sensory-affective integration |
| S_circular_insula_ant | Anterior circular sulcus of insula | Insula border: emotional processing |
| S_circular_insula_sup | Superior circular sulcus of insula | Insula border: salience detection |
| S_circular_insula_inf | Inferior circular sulcus of insula | Insula border: visceral-emotional processing |
| G_and_S_cingul-Mid-Post | Mid-posterior cingulate | Emotional monitoring, self-relevance |
| G_cingul-Post-dorsal | Posterior dorsal cingulate | Emotional memory retrieval |
| G_temp_sup-Plan_polar | Planum polare | Anterior STG: emotional prosody processing |
| Pole_temporal | Temporal pole | Semantic-emotional integration |

**Coverage:** 1,668 vertices (8.1%) -- 871 left, 797 right.

**Cortical-only limitation:** The amygdala is the primary subcortical emotion structure but does NOT appear on the cortical surface. The anterior insula and cingulate cortex serve as cortical proxies that are strongly functionally connected to the amygdala.

**Citation:** Lindquist, Wager, Kober, Bliss-Moreau & Barrett (2012). The brain basis of emotion: A meta-analytic review. *Behavioral and Brain Sciences*, 35(3), 121--143.

### 4. Social Cognition

**Cognitive construct:** Theory of mind, mentalizing, perspective taking, social perception, and self-other distinction.

**Parcels (8 Destrieux labels, both hemispheres):**

| Parcel | Anatomical Name | Network Role |
|--------|----------------|--------------|
| S_temporal_sup | Superior temporal sulcus (STS) | Social perception: biological motion, gaze |
| G_temp_sup-Lateral | Lateral superior temporal gyrus | Social perception: voice, speech processing |
| G_temp_sup-Plan_tempo | Planum temporale | Auditory-social processing |
| G_pariet_inf-Angular | Angular gyrus | TPJ component: mentalizing, perspective taking |
| G_precuneus | Precuneus | Self-referential processing, episodic memory |
| G_front_sup | Superior frontal gyrus | mPFC component: mentalizing, self-reflection |
| G_cingul-Post-ventral | Posterior ventral cingulate / isthmus | Default mode: self-referential processing |
| Pole_temporal | Temporal pole | Social-semantic knowledge |

**Coverage:** 3,561 vertices (17.4%) -- 1,704 left, 1,857 right.

**Citation:** Frith & Frith (2007). Social cognition in humans. *Current Biology*, 17(16), R724--R732. Saxe (2006). Uniquely human social cognition. *Current Opinion in Neurobiology*, 16(2), 235--239.

## Overlapping Parcels

One parcel appears in multiple regions:

| Parcel | Regions | Shared Vertices |
|--------|---------|-----------------|
| Pole_temporal | emotional_processing, social_cognition | 222 |

**Why this is valid:** Brain regions are not functionally exclusive. The temporal pole contributes to both emotional-semantic processing (linking emotions to concepts) and social cognition (social-semantic knowledge about people and social scripts). This dual membership reflects genuine neuroscience rather than a mapping error.

**How aggregation handles it:** Per-region scores are computed independently. Each region's mean activation is calculated only over its own vertices. The 222 shared vertices contribute to both the emotional_processing and social_cognition scores. There is no double-counting problem because the scores are not summed across regions.

## Hemodynamic Delay

### What It Is

The brain's hemodynamic response (measured by fMRI BOLD signal) peaks approximately **5 seconds** after the underlying neural activity. When TRIBE v2 predicts brain activation at time t, it is predicting the hemodynamic response to stimuli presented at time t - 5 seconds.

### How It Is Handled

Predictions are shifted backward by `HRF_DELAY_S = 5` positions (seconds):

```
aligned[t] = predictions[t + 5]
```

- `predictions[5]` was caused by stimulus at video second 0
- `predictions[6]` was caused by stimulus at video second 1
- ...
- `predictions[60]` was caused by stimulus at video second 55

### Effect on Segment Count

For a 60-second video producing 61 segments:
- **Before alignment:** 61 segments (shape `(61, 20484)`)
- **After alignment:** 56 segments (shape `(56, 20484)`)
- **Dropped:** The first 5 predictions have no corresponding prior stimulus

After alignment, `aligned[t]` corresponds to video content at second `t`.

### Implementation

```python
from src.region_mapping.temporal import align_to_stimulus

aligned = align_to_stimulus(predictions)  # (61, 20484) -> (56, 20484)
```

## Aggregation Method

### Approach: Mean Activation

For each region and each timestep, the score is the **arithmetic mean** of predicted activations across all vertices in that region:

```python
score[region][t] = mean(predictions[t, region_mask])
```

### Why Mean

Mean activation across a region of interest (ROI) is the standard approach in fMRI analysis. It treats all vertices within a region as equally contributing to the cognitive function.

### Known Limitation

Mean aggregation may **dilute focal activations**. If only a small cluster of vertices within a large region shows strong activation, the mean will be pulled toward zero by the inactive vertices. Alternative approaches (median, max, trimmed mean) could be considered in Phase 3 validation if differentiation is insufficient.

## Technical Details

| Property | Value |
|----------|-------|
| **Atlas** | Destrieux (2010), 76 parcels per hemisphere |
| **Source** | nilearn `fetch_atlas_surf_destrieux()` |
| **Surface mesh** | fsaverage5 (20,484 vertices total) |
| **Hemisphere ordering** | Left first (indices 0--10,241), right second (indices 10,242--20,483) |
| **Pre-computed masks** | `data/region_masks.npz` (no nilearn needed at runtime) |
| **Mask format** | Boolean numpy arrays, shape `(20484,)`, one per region |
| **Total regions** | 4 (attention, reward, emotional_processing, social_cognition) |
| **Total parcels assigned** | 33 (across all regions, with 1 shared) |
| **Total unique vertices covered** | 9,388 (45.8% of cortical surface) |
| **Overlapping vertices** | 222 (between emotional_processing and social_cognition) |

### Mask Generation

Masks are generated once by `scripts/generate_masks.py` and saved to `data/region_masks.npz`. This allows the RunPod Docker container to load region definitions at inference time using only numpy, without requiring nilearn as a runtime dependency.

To regenerate masks (e.g., after updating region definitions):

```bash
python scripts/generate_masks.py
```

### Mask Loading at Inference Time

```python
import numpy as np

data = np.load("data/region_masks.npz")
masks = {key: data[key] for key in data.files}
```

## Assumptions and Open Questions

### Assumptions (from Phase 2 Research)

| # | Assumption | Risk if Wrong | Mitigation |
|---|-----------|---------------|------------|
| A1 | TRIBE v2 vertex ordering follows fsaverage5 convention (left hemisphere first) | All region masks map to wrong hemisphere | Phase 3: test with lateralized stimuli (e.g., speech should activate left-hemisphere language regions) |
| A2 | Selected Destrieux parcels appropriately represent each NeuroCut cognitive construct | Region scores may not meaningfully reflect intended constructs | Phase 3: validate differentiation across different video content types |
| A3 | Mean aggregation is appropriate (vs. median, max, weighted) | Could miss focal activations | Phase 3: compare aggregation methods if differentiation is poor |
| A4 | 5-second integer shift is sufficient for hemodynamic delay (vs. HRF convolution) | Minor temporal misalignment of 1--2 seconds | Acceptable for NeuroCut's use case; HRF peak varies by region (4--6s) |
| A5 | Overlapping parcels between regions are acceptable | Per-region scores remain independent; only affects combined "overall" score | Document and handle in scoring layer |

### Open Questions for Phase 3

1. **Hemisphere verification:** Does TRIBE v2 follow exact fsaverage5 left-first ordering? Verify with lateralized stimulus.
2. **Parcel refinement:** Do the selected parcels produce meaningful differentiation for video content engagement? May need to add/remove parcels based on validation.
3. **Aggregation comparison:** If mean produces poor differentiation, compare with median or trimmed mean.
