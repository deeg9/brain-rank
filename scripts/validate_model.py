#!/usr/bin/env python3
"""
Two-video validation: Run TRIBE v2 on high-engagement and low-engagement videos,
compute per-region activation scores, and output a structured comparison.

Purpose: Proves the model differentiates engagement levels (MODL-05) and documents
inference timing (MODL-07).

Usage:
    python scripts/validate_model.py /path/to/high_engagement.mp4 /path/to/low_engagement.mp4

Outputs:
    - data/predictions_high.npy  (raw vertex predictions for high-engagement video)
    - data/predictions_low.npy   (raw vertex predictions for low-engagement video)
    - data/validation_comparison.json  (structured comparison with effect sizes)
"""
import json
import math
import os
import sys
import time
from pathlib import Path

import numpy as np

# Ensure project root is on sys.path for imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.region_mapping.constants import HRF_DELAY_S, NEUROCUT_REGIONS
from src.region_mapping.scoring import compute_region_scores
from src.region_mapping.temporal import align_to_stimulus


def load_masks(path="data/region_masks.npz"):
    """Load pre-computed region masks (numpy only, no nilearn)."""
    data = np.load(path)
    return {key: data[key] for key in data.files}


def run_inference(model, video_path, label):
    """
    Run TRIBE v2 inference on a single video and return predictions + timing.

    Parameters
    ----------
    model : TribeModel
        Pre-loaded TRIBE v2 model instance.
    video_path : str
        Path to the video file.
    label : str
        Human-readable label for logging (e.g. "high-engagement").

    Returns
    -------
    tuple (np.ndarray, dict)
        predictions array (n_segments, 20484) and timing dict.
    """
    import torch

    print()
    print("=" * 60)
    print(f"=== INFERENCE: {label} ===")
    print("=" * 60)
    print(f"Video: {video_path}")
    print(f"Size: {os.path.getsize(video_path) / 1e6:.1f} MB")

    # Events extraction
    t_events_start = time.time()
    df = model.get_events_dataframe(video_path=video_path)
    t_events_end = time.time()
    events_s = t_events_end - t_events_start
    print(f"Events extracted in {events_s:.1f}s ({df.shape[0]} events)")

    # Inference
    t_infer_start = time.time()
    preds, segments = model.predict(events=df)
    t_infer_end = time.time()
    inference_s = t_infer_end - t_infer_start
    print(f"Inference completed in {inference_s:.1f}s")

    # Convert to numpy if tensor
    if isinstance(preds, torch.Tensor):
        preds = preds.detach().cpu().numpy()

    print(f"Predictions shape: {preds.shape}")
    print(f"Predictions range: [{preds.min():.4f}, {preds.max():.4f}]")

    timing = {
        "events_extract_s": round(events_s, 2),
        "inference_s": round(inference_s, 2),
        "total_s": round(events_s + inference_s, 2),
    }

    return preds, timing


def compute_cohens_d(scores_high, scores_low):
    """
    Compute Cohen's d effect size between two score arrays.

    Parameters
    ----------
    scores_high : np.ndarray
        Per-segment scores for high-engagement video.
    scores_low : np.ndarray
        Per-segment scores for low-engagement video.

    Returns
    -------
    float
        Cohen's d value. Positive means high > low.
    """
    mean_high = float(np.mean(scores_high))
    mean_low = float(np.mean(scores_low))
    std_high = float(np.std(scores_high, ddof=1)) if len(scores_high) > 1 else 0.0
    std_low = float(np.std(scores_low, ddof=1)) if len(scores_low) > 1 else 0.0

    pooled_std = math.sqrt((std_high ** 2 + std_low ** 2) / 2)

    if pooled_std == 0:
        return 0.0

    return (mean_high - mean_low) / pooled_std


def interpret_effect_size(d):
    """
    Interpret Cohen's d using standard conventions.

    |d| > 0.2 = small, > 0.5 = medium, > 0.8 = large
    """
    abs_d = abs(d)
    if abs_d >= 0.8:
        return "large"
    elif abs_d >= 0.5:
        return "medium"
    elif abs_d >= 0.2:
        return "small"
    else:
        return "negligible"


def main():
    # =========================================================================
    # ARGUMENT PARSING
    # =========================================================================
    if len(sys.argv) != 3:
        print("Usage: python scripts/validate_model.py <high_engagement.mp4> <low_engagement.mp4>")
        print()
        print("Example:")
        print("  python scripts/validate_model.py test_videos/high_engagement.mp4 test_videos/low_engagement.mp4")
        sys.exit(1)

    high_video = sys.argv[1]
    low_video = sys.argv[2]

    for path, label in [(high_video, "high-engagement"), (low_video, "low-engagement")]:
        if not os.path.isfile(path):
            print(f"ERROR: {label} video not found: {path}")
            sys.exit(1)

    # =========================================================================
    # CUDA CHECK
    # =========================================================================
    print("=" * 60)
    print("=== CUDA CHECK ===")
    print("=" * 60)

    import torch

    if not torch.cuda.is_available():
        print("ERROR: CUDA not available. TRIBE v2 requires an NVIDIA GPU.")
        sys.exit(1)

    gpu_name = torch.cuda.get_device_name(0)
    gpu_vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f"GPU: {gpu_name}")
    print(f"VRAM: {gpu_vram_gb:.1f} GB")

    # =========================================================================
    # MODEL LOADING (once, reused for both videos)
    # =========================================================================
    print()
    print("=" * 60)
    print("=== MODEL LOADING ===")
    print("=" * 60)

    from tribev2 import TribeModel

    t_model_start = time.time()
    model = TribeModel.from_pretrained("facebook/tribev2", cache_folder="./cache")
    t_model_end = time.time()
    model_load_s = round(t_model_end - t_model_start, 2)
    print(f"Model loaded in {model_load_s:.1f}s")

    # =========================================================================
    # RUN INFERENCE ON BOTH VIDEOS
    # =========================================================================
    preds_high, timing_high = run_inference(model, high_video, "HIGH-ENGAGEMENT")
    preds_low, timing_low = run_inference(model, low_video, "LOW-ENGAGEMENT")

    # Record peak GPU memory after both runs
    vram_peak_gb = round(torch.cuda.max_memory_allocated() / 1e9, 2)

    # Add model_load_s to timing dicts
    timing_high["model_load_s"] = model_load_s
    timing_low["model_load_s"] = model_load_s

    # =========================================================================
    # SAVE RAW PREDICTIONS
    # =========================================================================
    print()
    print("=" * 60)
    print("=== SAVING RAW PREDICTIONS ===")
    print("=" * 60)

    os.makedirs("data", exist_ok=True)
    np.save("data/predictions_high.npy", preds_high)
    np.save("data/predictions_low.npy", preds_low)
    print(f"Saved data/predictions_high.npy: {preds_high.shape}")
    print(f"Saved data/predictions_low.npy: {preds_low.shape}")

    # =========================================================================
    # REGION SCORING WITH HEMODYNAMIC ALIGNMENT
    # =========================================================================
    print()
    print("=" * 60)
    print("=== REGION SCORING ===")
    print("=" * 60)

    masks = load_masks()
    print(f"Loaded {len(masks)} region masks")

    # Apply hemodynamic delay correction
    aligned_high = align_to_stimulus(preds_high)
    aligned_low = align_to_stimulus(preds_low)
    print(f"Aligned high: {preds_high.shape[0]} -> {aligned_high.shape[0]} segments (HRF delay={HRF_DELAY_S}s)")
    print(f"Aligned low:  {preds_low.shape[0]} -> {aligned_low.shape[0]} segments (HRF delay={HRF_DELAY_S}s)")

    # Compute per-region scores
    scores_high = compute_region_scores(aligned_high, masks)
    scores_low = compute_region_scores(aligned_low, masks)

    # =========================================================================
    # COMPARISON: EFFECT SIZES
    # =========================================================================
    print()
    print("=" * 60)
    print("=== COMPARISON: Per-Region Effect Sizes ===")
    print("=" * 60)

    comparison = {}
    regions_with_effect = 0

    print(f"{'Region':<25} {'High Mean':>10} {'Low Mean':>10} {'Diff':>10} {'Cohen d':>10} {'Effect':>12}")
    print("-" * 77)

    for region in NEUROCUT_REGIONS:
        if region not in scores_high or region not in scores_low:
            print(f"{region:<25} {'(no mask)':>10}")
            continue

        high_mean = float(np.mean(scores_high[region]))
        low_mean = float(np.mean(scores_low[region]))
        diff = high_mean - low_mean
        d = compute_cohens_d(scores_high[region], scores_low[region])
        interpretation = interpret_effect_size(d)

        if abs(d) >= 0.2:
            regions_with_effect += 1

        comparison[region] = {
            "high_mean": round(high_mean, 6),
            "low_mean": round(low_mean, 6),
            "diff": round(diff, 6),
            "cohens_d": round(d, 4),
            "interpretation": interpretation,
        }

        print(f"{region:<25} {high_mean:>10.4f} {low_mean:>10.4f} {diff:>+10.4f} {d:>+10.4f} {interpretation:>12}")

    # Overall differentiation: at least 2 of 4 regions show |d| > 0.2
    overall_diff = regions_with_effect >= 2
    diff_summary = (
        f"{regions_with_effect} of {len(NEUROCUT_REGIONS)} regions show |Cohen's d| >= 0.2. "
        f"{'Model differentiates engagement levels.' if overall_diff else 'Insufficient differentiation detected.'}"
    )

    print()
    print(f"Overall differentiation: {'YES' if overall_diff else 'NO'}")
    print(f"Summary: {diff_summary}")

    # =========================================================================
    # WRITE JSON OUTPUT
    # =========================================================================
    print()
    print("=" * 60)
    print("=== WRITING COMPARISON JSON ===")
    print("=" * 60)

    output = {
        "high_engagement": {
            "video": os.path.basename(high_video),
            "n_segments": int(preds_high.shape[0]),
            "n_aligned_segments": int(aligned_high.shape[0]),
            "timing": timing_high,
            "region_means": {
                region: round(float(np.mean(scores_high[region])), 6)
                for region in NEUROCUT_REGIONS
                if region in scores_high
            },
        },
        "low_engagement": {
            "video": os.path.basename(low_video),
            "n_segments": int(preds_low.shape[0]),
            "n_aligned_segments": int(aligned_low.shape[0]),
            "timing": timing_low,
            "region_means": {
                region: round(float(np.mean(scores_low[region])), 6)
                for region in NEUROCUT_REGIONS
                if region in scores_low
            },
        },
        "comparison": {
            "per_region": comparison,
            "overall_differentiation": overall_diff,
            "differentiation_summary": diff_summary,
        },
        "gpu": {
            "name": gpu_name,
            "vram_peak_gb": vram_peak_gb,
        },
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    json_path = "data/validation_comparison.json"
    with open(json_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Written to: {json_path}")

    # =========================================================================
    # DONE
    # =========================================================================
    print()
    print("=" * 60)
    print("=== VALIDATION COMPLETE ===")
    print("=" * 60)
    print(f"Results: {json_path}")
    print(f"Raw predictions: data/predictions_high.npy, data/predictions_low.npy")


if __name__ == "__main__":
    main()
