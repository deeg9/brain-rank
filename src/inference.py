"""
TRIBE v2 inference wrapper.

Wraps TribeModel's get_events_dataframe + predict API into a single
function that returns numpy predictions, segments, and timing metrics.

No torch import at module level -- torch is only needed conditionally
for tensor-to-numpy conversion.
"""

import logging
import time

import numpy as np

logger = logging.getLogger("neurocut.inference")


def run_inference(model, video_path: str, job_id: str) -> tuple[np.ndarray, list, dict]:
    """Run TRIBE v2 inference on a video file.

    Parameters
    ----------
    model : TribeModel
        Loaded TRIBE v2 model instance.
    video_path : str
        Path to the video file on disk.
    job_id : str
        Unique job identifier for log correlation.

    Returns
    -------
    tuple[np.ndarray, list, dict]
        - predictions: numpy ndarray of shape (n_segments, 20484)
        - segments: list of Segment namedtuples from TRIBE v2
        - timing: dict with "events_extract_s" and "inference_s" as floats
    """
    # Step 1: Extract events from video
    logger.info("Job %s: extracting events from %s", job_id, video_path)
    t0 = time.perf_counter()
    df = model.get_events_dataframe(video_path=video_path)
    t1 = time.perf_counter() - t0
    logger.info(
        "Job %s: events extracted — %d events in %.1fs",
        job_id,
        df.shape[0],
        t1,
    )

    # Step 2: Run inference
    logger.info("Job %s: running inference...", job_id)
    t0 = time.perf_counter()
    preds, segments = model.predict(events=df)
    t2 = time.perf_counter() - t0

    # Step 3: Convert torch tensor to numpy if needed
    # Use hasattr check to avoid importing torch at module level
    if hasattr(preds, "detach"):
        preds = preds.detach().cpu().numpy()

    logger.info(
        "Job %s: inference complete — %d segments, shape %s in %.1fs",
        job_id,
        len(segments),
        preds.shape,
        t2,
    )

    return (
        preds,
        segments,
        {
            "events_extract_s": round(t1, 2),
            "inference_s": round(t2, 2),
        },
    )
