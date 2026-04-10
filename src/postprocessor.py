"""
Raw predictions to OutputSchema mapper.

Takes TRIBE v2's raw (n_segments, 20484) predictions and converts them
into the NeuroCut OutputSchema with 2-second windows, region scores,
and summary statistics.

Applies hemodynamic delay correction before region scoring so segment
timestamps match video content.

Security note (T-07-03): Does not log raw prediction values or full
arrays -- only shapes and aggregate stats.
"""

import logging
from pathlib import Path
from typing import Optional

import numpy as np

from src.schema import OutputSchema, Segment, RegionScores, Summary
from src.region_mapping.temporal import align_to_stimulus
from src.region_mapping.scoring import compute_region_scores
from src.region_mapping.constants import SEGMENT_DURATION_S

logger = logging.getLogger("neurocut.postprocessor")


def robust_normalize(
    array: np.ndarray,
    axis: Optional[int] = None,
    percentile: int = 99,
    clip: bool = True,
    two_sided: bool = True,
) -> np.ndarray:
    """Normalize array to 0-1 using percentile-based scaling.

    Matches Meta's implementation from tribev2/plotting/utils.py.
    Uses 99th/1st percentile bounds to handle outliers gracefully.

    Parameters
    ----------
    array : np.ndarray
        Input array to normalize.
    axis : int or None
        Axis along which to compute percentiles. None = global.
    percentile : int
        Upper percentile for scaling (default 99).
    clip : bool
        Whether to clip output to [0, 1] (default True).
    two_sided : bool
        If True, use symmetric percentiles for lo/hi bounds.

    Returns
    -------
    np.ndarray
        Normalized array in [0, 1] range (when clip=True).
    """
    hi = np.percentile(array, percentile, axis=axis, keepdims=True)
    if two_sided:
        lo = np.percentile(array, 100 - percentile, axis=axis, keepdims=True)
    else:
        lo = np.min(array, axis=axis, keepdims=True)
    denom = hi - lo
    # Constant input: return 0.5 instead of NaN
    if np.all(denom == 0):
        return np.full_like(array, 0.5, dtype=np.float64)
    denom = np.where(denom == 0, 1.0, denom)
    out = (array - lo) / denom
    if clip:
        out = np.clip(out, 0, 1)
    return out


def postprocess(
    predictions: np.ndarray,
    segments: list,
    video_url: str,
    job_id: str,
) -> OutputSchema:
    """Convert raw TRIBE v2 predictions to OutputSchema.

    Parameters
    ----------
    predictions : np.ndarray
        Shape (n_segments, 20484). Raw TRIBE v2 vertex activations.
    segments : list
        Segment namedtuples from TRIBE v2 (used for duration calculation).
    video_url : str
        Original video URL for pass-through to output.
    job_id : str
        Unique job identifier for log correlation.

    Returns
    -------
    OutputSchema
        Fully populated output with 2-second windows, region scores, and summary.
    """
    raw_shape = list(predictions.shape)

    # Load region masks
    masks_path = Path(__file__).parent.parent / "data" / "region_masks.npz"
    masks = dict(np.load(str(masks_path)))

    # Apply hemodynamic delay correction
    aligned = align_to_stimulus(predictions)

    # Normalize to 0-1 range before all downstream computation
    aligned = robust_normalize(aligned)
    n_aligned = aligned.shape[0]

    # Compute per-region scores for all aligned segments
    region_scores = compute_region_scores(aligned, masks)

    # Build 2-second output windows
    output_segments = []
    i = 0
    while i < n_aligned:
        if i + 1 < n_aligned:
            # Full 2-second window: average two consecutive aligned segments
            window_preds = aligned[i : i + 2]
            activation_score = float(window_preds.mean())

            region_vals = {}
            for region_name in region_scores:
                region_vals[region_name] = float(
                    (region_scores[region_name][i] + region_scores[region_name][i + 1]) / 2.0
                )

            start = float(i * SEGMENT_DURATION_S)
            end = start + 2.0
            i += 2
        else:
            # Trailing odd segment: 1-second window
            window_preds = aligned[i : i + 1]
            activation_score = float(window_preds.mean())

            region_vals = {}
            for region_name in region_scores:
                region_vals[region_name] = float(region_scores[region_name][i])

            start = float(i * SEGMENT_DURATION_S)
            end = start + 1.0
            i += 1

        arousal = (region_vals["attention"] + region_vals["emotional_processing"]) / 2.0
        valence = (region_vals["reward"] + region_vals["social_cognition"]) / 2.0

        seg = Segment(
            start=start,
            end=end,
            activation_score=activation_score,
            arousal=arousal,
            valence=valence,
            regions=RegionScores(
                attention=region_vals["attention"],
                reward=region_vals["reward"],
                emotional_processing=region_vals["emotional_processing"],
                social_cognition=region_vals["social_cognition"],
            ),
        )
        output_segments.append(seg)

    logger.info(
        "Job %s: postprocessing — %d aligned segments -> %d output windows",
        job_id,
        n_aligned,
        len(output_segments),
    )

    # Build summary
    activations = [s.activation_score for s in output_segments]
    overall = float(np.mean(activations))
    hook_score = float(np.mean(activations[: min(5, len(activations))]))
    retention_score = float(np.mean(activations[-min(5, len(activations)) :]))

    peak_idx = int(np.argmax(activations))
    peak_second = output_segments[peak_idx].start
    peak_score = output_segments[peak_idx].activation_score

    summary = Summary(
        overall=overall,
        hook_score=hook_score,
        retention_score=retention_score,
        peak_second=peak_second,
        peak_score=peak_score,
    )

    duration_seconds = float(len(segments) * SEGMENT_DURATION_S)

    logger.info(
        "Job %s: postprocessing complete — %d windows, duration %.1fs",
        job_id,
        len(output_segments),
        duration_seconds,
    )

    return OutputSchema(
        video_url=video_url,
        duration_seconds=duration_seconds,
        segments=output_segments,
        summary=summary,
        raw_shape=raw_shape,
    )
