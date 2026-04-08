# TRIBE v2 Model Validation Report

**Date:** 2026-04-08
**GPU:** NVIDIA A40 (48 GB VRAM)
**Videos Tested:** 2 (high-engagement vs low-engagement, each 60 seconds)
**Data Source:** `data/validation_comparison.json`

## Test Setup

### Videos

| Property | High-Engagement | Low-Engagement |
|----------|----------------|----------------|
| **Video** | Sintel trailer | Big Buck Bunny opening |
| **Content** | Action, emotion, dramatic music, fight scenes | Static nature scene, no dialogue, minimal action |
| **Duration** | 60 seconds | 60 seconds |
| **Segments** | 60 (55 aligned after HRF) | 61 (56 aligned after HRF) |

### Processing Configuration

- **GPU:** NVIDIA A40 (48 GB), RunPod GPU Pod
- **Region mapping:** 4 cortical regions derived from fsaverage5 atlas masks (Phase 2)
  - `attention` -- dorsal attention network vertices
  - `reward` -- orbitofrontal/ventromedial prefrontal cortex vertices
  - `emotional_processing` -- insula/anterior cingulate cortex vertices
  - `social_cognition` -- superior temporal sulcus/temporoparietal junction vertices
- **Hemodynamic correction:** 5-second HRF delay applied (fMRI convention -- brain response lags stimulus by ~5 seconds)
- **Model output:** 20,484 cortical vertices per 1-second segment, mapped to regions via pre-computed `.npz` masks

## Per-Region Comparison

| Region | High Mean | Low Mean | Difference | Cohen's d | Effect Size |
|--------|-----------|----------|------------|-----------|-------------|
| Attention | 0.1797 | 0.0711 | 0.1086 | 1.0179 | Large |
| Reward | 0.0537 | 0.0247 | 0.0290 | 0.7522 | Medium |
| Emotional Processing | 0.0625 | 0.0362 | 0.0263 | 0.3966 | Small |
| Social Cognition | 0.0616 | 0.0078 | 0.0538 | 0.6453 | Medium |

**All values sourced from `data/validation_comparison.json` (timestamp: 2026-04-08T23:06:48Z).**

Summary: 4 of 4 regions show |Cohen's d| >= 0.2. The model differentiates engagement levels across all measured brain regions.

## Interpretation

### Attention (Cohen's d = 1.0179 -- Large)

The attention network shows the strongest differentiation. The Sintel trailer (action sequences, rapid scene changes, fight choreography) produces 2.5x higher predicted activation than the Big Buck Bunny opening (static pastoral scene). This is the expected direction: visual salience and dynamic content should drive dorsal attention network engagement. A large effect size here indicates the model meaningfully captures attentional demands.

### Reward (Cohen's d = 0.7522 -- Medium)

Reward-associated cortical regions show medium differentiation. The Sintel trailer's emotionally compelling narrative (character conflict, dramatic stakes) produces higher predicted reward circuit activation than the low-arousal nature footage. This suggests the model detects hedonic and motivational valence differences between content types.

### Emotional Processing (Cohen's d = 0.3966 -- Small)

Emotional processing regions show the smallest but still meaningful differentiation. The Sintel trailer's dramatic music, tension, and fight scenes produce modestly higher predicted activation than Big Buck Bunny's calm opening. The smaller effect size may reflect that Big Buck Bunny is not emotionally "flat" -- the nature scene has aesthetic qualities that engage some emotional processing. Alternatively, TRIBE v2's cortical-surface-only architecture cannot capture subcortical emotional centers (amygdala), which may limit sensitivity in this region.

### Social Cognition (Cohen's d = 0.6453 -- Medium)

Social cognition regions show medium differentiation with the largest absolute difference ratio (7.9x). The Sintel trailer features human characters, social interactions, and implied social threats, while the Big Buck Bunny opening has no characters or social content. The near-zero activation for low-engagement social cognition (0.0078) is especially notable -- the model correctly predicts minimal social brain engagement for a scene with no social agents.

## Go/No-Go Decision

### Criteria Applied

- **GO** if: At least 2 of 4 regions show meaningful differentiation (|Cohen's d| > 0.2), AND the direction makes neuroscientific sense
- **NO-GO** if: Fewer than 2 regions differentiate, OR activations go in the wrong direction
- **CONDITIONAL GO** if: Results are mixed

### Assessment

| Criterion | Result |
|-----------|--------|
| Regions with \|Cohen's d\| > 0.2 | **4 of 4** |
| Direction neuroscientifically correct | **Yes** -- all regions show higher activation for high-engagement content |
| Strongest region matches expectation | **Yes** -- attention is highest (action video vs nature scene) |
| Weakest region explainable | **Yes** -- emotional processing limited by cortical-only architecture |

### Decision: **GO**

**Rationale:** TRIBE v2 clearly differentiates high-engagement from low-engagement video content across all four measured brain regions. Effect sizes range from small (0.40) to large (1.02), with all directions consistent with neuroscientific expectations. The model is viable as the inference engine for NeuroCut engagement scoring. Containerization and deployment (Phases 4-10) should proceed.

**Confidence:** High. While only 2 videos were tested, the effect sizes are strong and the pattern across all 4 regions is internally consistent. The attention region alone (d = 1.02) would justify proceeding.

## Limitations

1. **Small sample size:** Only 2 videos tested (1 high-engagement, 1 low-engagement). Broader validation across genres, durations, and engagement levels would strengthen confidence. The current test establishes proof-of-concept, not production-grade validation.

2. **Cortical surface only:** TRIBE v2 predicts activation on the fsaverage5 cortical mesh (20,484 vertices). Subcortical structures critical for emotion and reward (amygdala, ventral striatum, nucleus accumbens) are not represented. This limits the model's sensitivity to deep emotional and motivational processes.

3. **Approximate hemodynamic delay:** A fixed 5-second HRF delay was applied. Actual hemodynamic response varies between 4-6 seconds across brain regions and individuals. This introduces temporal alignment uncertainty of +/- 1 second.

4. **Effect size thresholds are conventional:** Cohen's d thresholds (0.2 = small, 0.5 = medium, 0.8 = large) are social science conventions. Neuroscience-specific thresholds for predicted fMRI activation differences have not been established.

5. **Region mapping is approximate:** The 4-region mapping from Phase 2 uses fsaverage5 atlas parcellations. These are standard neuroimaging regions but represent a simplification of the full cortical activation pattern. Different atlas choices or finer parcellation could yield different results.

6. **No ground-truth fMRI:** These are model predictions, not actual brain measurements. TRIBE v2 was trained on real fMRI data, but the predictions for these specific videos have not been validated against actual neural recordings.

7. **Video selection bias:** Sintel trailer and Big Buck Bunny were chosen as deliberately contrasting stimuli. Real-world content differences (e.g., two product advertisements with subtle engagement differences) may produce smaller effect sizes.
