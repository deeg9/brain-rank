#!/usr/bin/env python3
"""
Verify all TRIBE v2 dependencies are installed correctly.

Checks all 13 required packages, CUDA availability, and numpy version pin.
Exit code 0 if all pass, 1 if any fail.
"""

import importlib
import sys


def check_package(name, attribute=None):
    """Import a package and optionally check for a specific attribute."""
    try:
        mod = importlib.import_module(name)
        version = getattr(mod, "__version__", "unknown")
        status = "OK"
        if attribute:
            if hasattr(mod, attribute):
                status = f"OK (has {attribute})"
            else:
                return name, version, f"FAILED (missing {attribute})"
        return name, version, status
    except ImportError as e:
        return name, "not installed", f"FAILED ({e})"
    except Exception as e:
        return name, "error", f"FAILED ({e})"


def check_cuda():
    """Check CUDA availability and print GPU info if available."""
    try:
        import torch

        available = torch.cuda.is_available()
        if available:
            gpu_name = torch.cuda.get_device_name(0)
            vram_gb = torch.cuda.get_device_properties(0).total_mem / 1e9
            return True, f"{gpu_name} ({vram_gb:.1f} GB VRAM)"
        else:
            return False, "No CUDA-capable GPU detected"
    except Exception as e:
        return False, f"Error checking CUDA: {e}"


def check_numpy_version():
    """Check that numpy version matches the required 2.2.6 pin."""
    try:
        import numpy

        actual = numpy.__version__
        expected = "2.2.6"
        if actual == expected:
            return True, f"numpy {actual} == {expected}"
        else:
            return False, f"numpy {actual} != {expected} (expected {expected})"
    except ImportError:
        return False, "numpy not installed"


def main():
    print("=" * 60)
    print("TRIBE v2 Installation Verification")
    print("=" * 60)

    # Define all 13 required packages
    packages = [
        ("tribev2", "TribeModel"),
        ("neuralset", None),
        ("neuraltrain", None),
        ("torch", None),
        ("torchvision", None),
        ("torchaudio", None),
        ("transformers", None),
        ("moviepy", None),
        ("spacy", None),
        ("soundfile", None),
        ("julius", None),
        ("einops", None),
        ("huggingface_hub", None),
    ]

    print(f"\n{'Package':<20s} {'Version':<15s} {'Status'}")
    print("-" * 55)

    passed = 0
    failed = 0

    for pkg_name, attr in packages:
        name, version, status = check_package(pkg_name, attr)
        print(f"  {name:<20s} {version:<15s} {status}")
        if status.startswith("OK"):
            passed += 1
        else:
            failed += 1

    # Check numpy version pin
    print(f"\n{'='*60}")
    print("Numpy Version Check")
    print(f"{'='*60}")
    numpy_ok, numpy_msg = check_numpy_version()
    print(f"  {numpy_msg}")
    if not numpy_ok:
        failed += 1

    # Check CUDA availability
    print(f"\n{'='*60}")
    print("CUDA Check")
    print(f"{'='*60}")
    cuda_available, cuda_msg = check_cuda()
    print(f"  CUDA available: {cuda_available}")
    print(f"  {cuda_msg}")

    # Summary
    total = len(packages)
    print(f"\n{'='*60}")
    print(f"Summary: {passed}/{total} packages OK")
    if cuda_available:
        print("CUDA: Available")
    else:
        print("CUDA: NOT available (required for inference)")
    if not numpy_ok:
        print("WARNING: numpy version mismatch")
    print(f"{'='*60}")

    if failed > 0:
        print(f"\n{failed} check(s) failed. Please resolve before running inference.")
        sys.exit(1)
    else:
        print("\nAll checks passed!")
        sys.exit(0)


if __name__ == "__main__":
    main()
