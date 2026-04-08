"""Tests for region_mapping module."""
import numpy as np
import pytest


# --- Task 1: Constants tests ---

def test_output_constants():
    """MODL-03: Output format constants match Phase 1 documented values."""
    from region_mapping.constants import (
        N_VERTICES, HEMISPHERE_SIZE, HRF_DELAY_S, SEGMENT_DURATION_S,
    )
    assert N_VERTICES == 20484
    assert HEMISPHERE_SIZE == 10242
    assert HRF_DELAY_S == 5
    assert SEGMENT_DURATION_S == 1.0


def test_value_range():
    """MODL-03: Value range constants match Phase 1 measured output."""
    from region_mapping.constants import VALUE_RANGE_MIN, VALUE_RANGE_MAX
    assert abs(VALUE_RANGE_MIN - (-1.48)) < 0.01
    assert abs(VALUE_RANGE_MAX - 1.80) < 0.01


# --- Task 2: Region definitions tests ---

def test_region_definitions_keys():
    """MODL-04: REGION_DEFINITIONS has exactly 4 NeuroCut target regions."""
    from region_mapping.regions import REGION_DEFINITIONS
    expected = {"attention", "reward", "emotional_processing", "social_cognition"}
    assert set(REGION_DEFINITIONS.keys()) == expected


def test_region_definitions_nonempty():
    """MODL-04: Each region has at least 3 Destrieux parcel names."""
    from region_mapping.regions import REGION_DEFINITIONS
    for region, parcels in REGION_DEFINITIONS.items():
        assert len(parcels) >= 3, f"{region} has only {len(parcels)} parcels"


# --- Task 2: Atlas mask tests ---

def test_label_names_valid():
    """MODL-04: Every label in REGION_DEFINITIONS exists in the nilearn Destrieux atlas."""
    pytest.importorskip("nilearn")
    from nilearn.datasets import fetch_atlas_surf_destrieux
    from region_mapping.regions import REGION_DEFINITIONS

    atlas = fetch_atlas_surf_destrieux()
    atlas_labels = atlas["labels"]

    for region, parcels in REGION_DEFINITIONS.items():
        for parcel in parcels:
            assert parcel in atlas_labels, (
                f"Label '{parcel}' (region '{region}') not found in atlas. "
                f"Available: {atlas_labels}"
            )


def test_region_masks_valid():
    """MODL-04: build_region_masks() returns dict with 4 keys, each bool ndarray (20484,) with sum > 0."""
    pytest.importorskip("nilearn")
    from region_mapping.atlas import build_region_masks

    masks = build_region_masks()
    assert set(masks.keys()) == {"attention", "reward", "emotional_processing", "social_cognition"}

    for region, mask in masks.items():
        assert mask.dtype == np.bool_, f"{region} mask dtype is {mask.dtype}, expected bool"
        assert mask.shape == (20484,), f"{region} mask shape is {mask.shape}"
        assert mask.sum() > 0, f"{region} mask is empty (no vertices)"


def test_hemisphere_ordering():
    """MODL-04: full_map[0:10242] matches map_left and full_map[10242:] matches map_right."""
    pytest.importorskip("nilearn")
    from nilearn.datasets import fetch_atlas_surf_destrieux

    atlas = fetch_atlas_surf_destrieux()
    full_map = np.concatenate([atlas["map_left"], atlas["map_right"]])

    assert np.array_equal(full_map[:10242], atlas["map_left"])
    assert np.array_equal(full_map[10242:], atlas["map_right"])


# --- Task 2: Scoring tests ---

def test_region_scores_shape(mock_predictions):
    """MODL-04: compute_region_scores returns dict with 4 keys, each value shape (61,)."""
    pytest.importorskip("nilearn")
    from region_mapping.atlas import build_region_masks
    from region_mapping.scoring import compute_region_scores

    masks = build_region_masks()
    scores = compute_region_scores(mock_predictions, masks)

    assert set(scores.keys()) == {"attention", "reward", "emotional_processing", "social_cognition"}
    for region, values in scores.items():
        assert values.shape == (61,), f"{region} scores shape is {values.shape}"


def test_region_scores_values():
    """MODL-04: For uniform predictions, all region scores equal the uniform value."""
    pytest.importorskip("nilearn")
    from region_mapping.atlas import build_region_masks
    from region_mapping.scoring import compute_region_scores

    uniform_val = 0.5
    predictions = np.full((10, 20484), uniform_val, dtype=np.float32)
    masks = build_region_masks()
    scores = compute_region_scores(predictions, masks)

    for region, values in scores.items():
        np.testing.assert_allclose(
            values, uniform_val, atol=1e-5,
            err_msg=f"{region} scores should all be {uniform_val} for uniform input",
        )


# --- Task 2: Temporal alignment tests ---

def test_hrf_alignment(mock_predictions):
    """MODL-06: align_to_stimulus on (61, 20484) returns (56, 20484) array."""
    from region_mapping.temporal import align_to_stimulus
    aligned = align_to_stimulus(mock_predictions)
    assert aligned.shape == (56, 20484)


def test_hrf_alignment_values(mock_predictions):
    """MODL-06: aligned[0] equals raw predictions[5]."""
    from region_mapping.temporal import align_to_stimulus
    aligned = align_to_stimulus(mock_predictions)
    np.testing.assert_array_equal(aligned[0], mock_predictions[5])
