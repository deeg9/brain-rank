"""
One-time script to generate pre-computed region masks from the Destrieux atlas.

Saves boolean masks as data/region_masks.npz so that the RunPod Docker container
can load region definitions at inference time WITHOUT requiring nilearn as a
runtime dependency (saves Docker image size).

Usage:
    python scripts/generate_masks.py

Requirements:
    - nilearn (for atlas fetching; not needed at inference time)
    - numpy
"""
import sys
from pathlib import Path

import numpy as np

# Ensure project root is on sys.path for imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.region_mapping.atlas import build_region_masks
from src.region_mapping.regions import REGION_DEFINITIONS
from src.region_mapping.constants import N_VERTICES


def generate_and_save(output_path="data/region_masks.npz"):
    """Fetch atlas, build boolean masks, save to .npz file."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print("Building region masks from Destrieux atlas...")
    masks = build_region_masks(REGION_DEFINITIONS)

    # Print per-region statistics
    print(f"\n{'Region':<25} {'Vertices':>10} {'Coverage':>10}")
    print("-" * 47)
    total_covered = np.zeros(N_VERTICES, dtype=bool)
    for region_name, mask in masks.items():
        count = mask.sum()
        pct = count / N_VERTICES * 100
        print(f"{region_name:<25} {count:>10,} {pct:>9.1f}%")
        total_covered |= mask

    print("-" * 47)
    print(f"{'Total unique vertices':<25} {total_covered.sum():>10,} {total_covered.sum() / N_VERTICES * 100:>9.1f}%")
    print(f"{'Total vertices':<25} {N_VERTICES:>10,}")

    # Identify overlapping vertices (in 2+ regions)
    overlap_count = np.zeros(N_VERTICES, dtype=int)
    for mask in masks.values():
        overlap_count += mask.astype(int)
    overlapping = (overlap_count >= 2).sum()
    print(f"\nOverlapping vertices (in 2+ regions): {overlapping}")

    # Show which regions share overlapping vertices
    region_names = list(masks.keys())
    for i in range(len(region_names)):
        for j in range(i + 1, len(region_names)):
            shared = (masks[region_names[i]] & masks[region_names[j]]).sum()
            if shared > 0:
                print(f"  {region_names[i]} & {region_names[j]}: {shared} shared vertices")

    # Save masks
    np.savez(str(output_path), **{k: v for k, v in masks.items()})
    print(f"\nMasks saved to {output_path}")
    print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")

    return masks


def load_masks(path="data/region_masks.npz"):
    """
    Load pre-computed region masks from .npz file.

    This function requires only numpy -- no nilearn dependency needed.
    Intended for use in the Docker container at inference time.

    Parameters
    ----------
    path : str
        Path to the .npz file containing boolean masks.

    Returns
    -------
    dict
        {region_name: np.ndarray of bool, shape (20484,)} for each region.
    """
    data = np.load(path)
    return {key: data[key] for key in data.files}


if __name__ == "__main__":
    generate_and_save()
