#!/usr/bin/env python3
"""
Phase 1 validation: Run TRIBE v2 inference on a test video and log output format.

This script is the primary Phase 1 deliverable. It:
1. Verifies CUDA availability
2. Loads TribeModel from HuggingFace
3. Extracts events from a test video
4. Runs brain activation prediction
5. Logs the complete output format (shapes, dtypes, ranges, segments)
6. Writes machine-readable results to docs/inference_output.json

Must be run on a machine with NVIDIA GPU and CUDA.

Usage:
    python scripts/test_inference.py [/path/to/video.mp4]

If no video path is provided, looks for any .mp4 in test_videos/ directory.
"""

import glob
import json
import os
import sys
import time


def main():
    # =========================================================================
    # SECTION 1: CUDA GATE
    # =========================================================================
    print("=" * 60)
    print("=== CUDA CHECK ===")
    print("=" * 60)

    import torch

    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")

    if not torch.cuda.is_available():
        print()
        print("ERROR: CUDA not available. TRIBE v2 requires an NVIDIA GPU.")
        print("This script must be run on a machine with a CUDA-capable GPU.")
        sys.exit(1)

    gpu_name = torch.cuda.get_device_name(0)
    gpu_vram_gb = torch.cuda.get_device_properties(0).total_mem / 1e9
    print(f"GPU: {gpu_name}")
    print(f"VRAM: {gpu_vram_gb:.1f} GB")

    # =========================================================================
    # SECTION 2: TEST VIDEO RESOLUTION
    # =========================================================================
    print()
    print("=" * 60)
    print("=== VIDEO RESOLUTION ===")
    print("=" * 60)

    video_path = None

    if len(sys.argv) > 1:
        video_path = sys.argv[1]
        if not os.path.isfile(video_path):
            print(f"ERROR: Video file not found: {video_path}")
            sys.exit(1)
    else:
        # Look for any .mp4 in test_videos/
        mp4_files = glob.glob("test_videos/*.mp4")
        if mp4_files:
            video_path = mp4_files[0]
            print(f"Found test video: {video_path}")
        else:
            print("No test video found. Download a test video:")
            print()
            print("  wget -O test_videos/test_video.mp4 \\")
            print('    "https://download.blender.org/demo/movies/Sintel.2010.720p.mkv"')
            print()
            print("Or provide path as argument:")
            print("  python scripts/test_inference.py /path/to/video.mp4")
            sys.exit(1)

    print(f"Using video: {video_path}")
    print(f"Video size: {os.path.getsize(video_path) / 1e6:.1f} MB")

    # =========================================================================
    # SECTION 3: MODEL LOADING
    # =========================================================================
    print()
    print("=" * 60)
    print("=== MODEL LOADING ===")
    print("=" * 60)

    from tribev2 import TribeModel

    t_model_start = time.time()
    model = TribeModel.from_pretrained("facebook/tribev2", cache_folder="./cache")
    t_model_end = time.time()
    model_load_s = t_model_end - t_model_start

    print(f"Model loaded in {model_load_s:.1f}s")

    # =========================================================================
    # SECTION 4: EVENTS EXTRACTION
    # =========================================================================
    print()
    print("=" * 60)
    print("=== EVENTS EXTRACTION ===")
    print("=" * 60)

    t_events_start = time.time()
    df = model.get_events_dataframe(video_path=video_path)
    t_events_end = time.time()
    events_extract_s = t_events_end - t_events_start

    print(f"Events extracted in {events_extract_s:.1f}s")
    print(f"Events dataframe shape: {df.shape}")
    print(f"Column names: {df.columns.tolist()}")
    if "type" in df.columns:
        print(f"Event types: {df['type'].unique().tolist()}")
    print()
    print("First 3 rows:")
    print(df.head(3).to_string())

    # =========================================================================
    # SECTION 5: INFERENCE
    # =========================================================================
    print()
    print("=" * 60)
    print("=== INFERENCE ===")
    print("=" * 60)

    t_infer_start = time.time()
    preds, segments = model.predict(events=df)
    t_infer_end = time.time()
    inference_s = t_infer_end - t_infer_start

    print(f"Inference completed in {inference_s:.1f}s")

    # =========================================================================
    # SECTION 6: OUTPUT LOGGING
    # =========================================================================
    print()
    print("=" * 60)
    print("=== OUTPUT FORMAT (critical for Phase 2) ===")
    print("=" * 60)

    # Determine if preds is numpy or torch tensor
    import numpy as np

    is_numpy = isinstance(preds, np.ndarray)
    is_tensor = isinstance(preds, torch.Tensor)

    print(f"Predictions type: {type(preds).__name__}")
    print(f"Is numpy array: {is_numpy}")
    print(f"Is torch tensor: {is_tensor}")

    # Convert to numpy for consistent stats if needed
    if is_tensor:
        preds_np = preds.detach().cpu().numpy()
    else:
        preds_np = preds

    print(f"Predictions shape: {preds_np.shape}")
    print(f"Predictions dtype: {preds_np.dtype}")
    print(f"Predictions min: {float(preds_np.min()):.6f}")
    print(f"Predictions max: {float(preds_np.max()):.6f}")
    print(f"Predictions mean: {float(preds_np.mean()):.6f}")
    print(f"Predictions std: {float(preds_np.std()):.6f}")

    print()
    print(f"Number of segments: {len(segments)}")
    print(f"Segments type: {type(segments).__name__}")

    if len(segments) > 0:
        first_seg = segments[0]
        print(f"First segment type: {type(first_seg).__name__}")
        print(f"First segment content: {first_seg}")

    # =========================================================================
    # SECTION 7: GPU MEMORY
    # =========================================================================
    print()
    print("=" * 60)
    print("=== GPU MEMORY ===")
    print("=" * 60)

    max_allocated_gb = torch.cuda.max_memory_allocated() / 1e9
    max_reserved_gb = torch.cuda.max_memory_reserved() / 1e9

    print(f"Max VRAM allocated: {max_allocated_gb:.2f} GB")
    print(f"Max VRAM reserved: {max_reserved_gb:.2f} GB")

    # =========================================================================
    # SECTION 8: TIMING SUMMARY
    # =========================================================================
    print()
    print("=" * 60)
    print("=== TIMING SUMMARY ===")
    print("=" * 60)

    total_s = model_load_s + events_extract_s + inference_s

    print(f"Model loading:     {model_load_s:8.1f}s")
    print(f"Events extraction: {events_extract_s:8.1f}s")
    print(f"Inference:         {inference_s:8.1f}s")
    print(f"Total:             {total_s:8.1f}s")

    # =========================================================================
    # SECTION 9: JSON OUTPUT
    # =========================================================================
    print()
    print("=" * 60)
    print("=== WRITING JSON OUTPUT ===")
    print("=" * 60)

    output = {
        "gpu_name": gpu_name,
        "gpu_vram_gb": round(gpu_vram_gb, 1),
        "predictions_shape": list(preds_np.shape),
        "predictions_dtype": str(preds_np.dtype),
        "predictions_min": round(float(preds_np.min()), 6),
        "predictions_max": round(float(preds_np.max()), 6),
        "predictions_mean": round(float(preds_np.mean()), 6),
        "predictions_std": round(float(preds_np.std()), 6),
        "predictions_is_numpy": is_numpy,
        "predictions_is_tensor": is_tensor,
        "n_segments": len(segments),
        "events_shape": list(df.shape),
        "events_columns": df.columns.tolist(),
        "model_load_s": round(model_load_s, 2),
        "events_extract_s": round(events_extract_s, 2),
        "inference_s": round(inference_s, 2),
        "total_s": round(total_s, 2),
        "max_vram_allocated_gb": round(max_allocated_gb, 2),
        "max_vram_reserved_gb": round(max_reserved_gb, 2),
        "video_path": video_path,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    os.makedirs("docs", exist_ok=True)
    json_path = "docs/inference_output.json"
    with open(json_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"JSON output written to: {json_path}")

    # =========================================================================
    # DONE
    # =========================================================================
    print()
    print("=" * 60)
    print("=== PHASE 1 VALIDATION COMPLETE ===")
    print("=" * 60)


if __name__ == "__main__":
    main()
