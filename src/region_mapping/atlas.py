"""
Atlas-based vertex mask generation for NeuroCut brain regions.

Uses nilearn's Destrieux surface atlas (fetch_atlas_surf_destrieux) to build
boolean masks mapping each of the 20,484 fsaverage5 cortical vertices to
NeuroCut functional brain regions.

IMPORTANT: Uses the SURFACE atlas (fetch_atlas_surf_destrieux), NOT the
volumetric version (fetch_atlas_destrieux_2009). TRIBE v2 outputs on
fsaverage5 surface mesh, not in MNI volumetric space.
"""
import logging

import numpy as np
from nilearn.datasets import fetch_atlas_surf_destrieux

from .constants import N_VERTICES, HEMISPHERE_SIZE
from .regions import REGION_DEFINITIONS

logger = logging.getLogger(__name__)


def build_region_masks(region_definitions=None):
    """
    Build boolean vertex masks for each NeuroCut region from the Destrieux atlas.

    Parameters
    ----------
    region_definitions : dict, optional
        Mapping of region names to lists of Destrieux label names.
        Defaults to REGION_DEFINITIONS from regions.py.

    Returns
    -------
    dict
        {region_name: np.ndarray of bool, shape (20484,)} for each region.

    Raises
    ------
    ValueError
        If any label name in region_definitions is not found in the atlas.
    """
    if region_definitions is None:
        region_definitions = REGION_DEFINITIONS

    atlas = fetch_atlas_surf_destrieux()
    labels = atlas["labels"]
    map_left = atlas["map_left"]    # shape (10242,)
    map_right = atlas["map_right"]  # shape (10242,)

    # Combine hemispheres: LEFT first, RIGHT second (fsaverage5 convention)
    full_map = np.concatenate([map_left, map_right])

    # Verify expected dimensions
    assert full_map.shape == (N_VERTICES,), (
        f"Unexpected combined shape: {full_map.shape}, expected ({N_VERTICES},)"
    )
    assert np.array_equal(full_map[:HEMISPHERE_SIZE], map_left), (
        "Left hemisphere mismatch after concatenation"
    )
    assert np.array_equal(full_map[HEMISPHERE_SIZE:], map_right), (
        "Right hemisphere mismatch after concatenation"
    )

    masks = {}
    for region_name, parcel_names in region_definitions.items():
        mask = np.zeros(N_VERTICES, dtype=bool)
        for parcel_name in parcel_names:
            if parcel_name not in labels:
                raise ValueError(
                    f"Unknown Destrieux label: '{parcel_name}' "
                    f"(region '{region_name}'). "
                    f"Available labels: {labels}"
                )
            label_idx = labels.index(parcel_name)
            mask |= (full_map == label_idx)

        masks[region_name] = mask
        logger.info(
            "%s: %d vertices (%.1f%%)",
            region_name, mask.sum(), mask.sum() / N_VERTICES * 100,
        )

    return masks
