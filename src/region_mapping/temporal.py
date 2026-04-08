"""
Hemodynamic delay correction for temporal alignment of predictions to stimuli.

The brain's hemodynamic response peaks ~5 seconds after neural activity.
TRIBE v2 predictions at time t reflect brain activity caused by stimuli at t - 5s.
This module shifts predictions backward to align with video content.

Example:
    predictions[5] was caused by stimulus at video second 0
    predictions[6] was caused by stimulus at video second 1
    After alignment: aligned[0] = predictions[5], aligned[1] = predictions[6]

For a 60-second video with 61 segments, alignment produces 56 segments
(the first 5 predictions have no corresponding prior stimulus).
"""
import numpy as np

from .constants import HRF_DELAY_S


def align_to_stimulus(predictions, hrf_delay=None):
    """
    Shift predictions backward by hrf_delay to align with video content.

    Parameters
    ----------
    predictions : np.ndarray
        Shape (n_segments, n_vertices). Raw TRIBE v2 predictions.
    hrf_delay : int, optional
        Number of seconds (segments) to shift. Defaults to HRF_DELAY_S (5).

    Returns
    -------
    np.ndarray
        Shape (n_segments - hrf_delay, n_vertices). Aligned predictions where
        aligned[t] corresponds to the stimulus at video second t.
    """
    if hrf_delay is None:
        hrf_delay = HRF_DELAY_S

    # predictions[hrf_delay] was caused by stimulus at t=0
    # So aligned[0] = predictions[hrf_delay], aligned[1] = predictions[hrf_delay+1], etc.
    return predictions[hrf_delay:]
