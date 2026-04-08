"""
Per-region score aggregation from vertex-level predictions.

Takes TRIBE v2's raw (n_segments, 20484) predictions and boolean region masks,
returns mean activation per region per segment.
"""
import numpy as np


def compute_region_scores(predictions, masks):
    """
    Compute per-region mean activation scores from vertex-level predictions.

    Parameters
    ----------
    predictions : np.ndarray
        Shape (n_segments, 20484), float32. Raw TRIBE v2 vertex activations.
    masks : dict
        {region_name: np.ndarray of bool, shape (20484,)} from build_region_masks().

    Returns
    -------
    dict
        {region_name: np.ndarray of float32, shape (n_segments,)}
        Mean activation across all vertices in each region, per segment.
    """
    scores = {}
    for region_name, mask in masks.items():
        # Extract activations for vertices in this region: (n_segments, n_region_vertices)
        region_activations = predictions[:, mask]
        # Mean across vertices for each segment: (n_segments,)
        scores[region_name] = region_activations.mean(axis=1).astype(np.float32)
    return scores
