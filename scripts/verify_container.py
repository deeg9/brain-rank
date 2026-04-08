#!/usr/bin/env python3
"""
NeuroCut Container Verification Script

Checks all dependencies required for TRIBE v2 inference are correctly installed
inside the Docker container. This is the default CMD of the Dockerfile and is
also used by Phase 5 for container verification.

Exit code 0: all critical checks pass
Exit code 1: one or more critical checks failed

Note: CUDA availability is non-critical (container may be built/tested without GPU).
"""

import importlib
import os
import shutil
import sys


def check(name, fn, critical=True):
    """Run a check function and return (name, passed, message, critical)."""
    try:
        passed, msg = fn()
        return name, passed, msg, critical
    except Exception as e:
        return name, False, str(e), critical


def check_python_version():
    v = sys.version_info
    ok = v.major == 3 and v.minor == 11
    return ok, f"Python {v.major}.{v.minor}.{v.micro}"


def check_torch_version():
    import torch
    ok = torch.__version__.startswith("2.6")
    return ok, f"torch {torch.__version__}"


def check_cuda_version():
    import torch
    cuda_ver = torch.version.cuda or "None"
    ok = cuda_ver.startswith("12.4")
    return ok, f"CUDA {cuda_ver} (compiled)"


def check_cuda_available():
    import torch
    available = torch.cuda.is_available()
    if available:
        gpu = torch.cuda.get_device_name(0)
        return True, f"GPU: {gpu}"
    else:
        return False, "No GPU detected (expected in CPU-only build)"


def check_import(module_name, attr=None):
    """Return a check function that imports a module."""
    def _check():
        mod = importlib.import_module(module_name)
        ver = getattr(mod, "__version__", "ok")
        if attr:
            if not hasattr(mod, attr):
                return False, f"{module_name} {ver} (missing {attr})"
        return True, f"{module_name} {ver}"
    return _check


def check_spacy_model():
    import spacy
    nlp = spacy.load("en_core_web_sm")
    return True, f"en_core_web_sm loaded ({len(nlp.pipe_names)} pipes)"


def check_ffmpeg():
    found = shutil.which("ffmpeg") is not None
    return found, "ffmpeg on PATH" if found else "ffmpeg NOT found"


def check_uv():
    uv_found = shutil.which("uv") is not None
    uvx_found = shutil.which("uvx") is not None
    if uv_found or uvx_found:
        parts = []
        if uv_found:
            parts.append("uv")
        if uvx_found:
            parts.append("uvx")
        return True, f"{', '.join(parts)} on PATH"
    return False, "Neither uv nor uvx found on PATH"


def check_hf_token():
    token = os.environ.get("HF_TOKEN")
    if not token:
        return False, "HF_TOKEN not set (gated models like LLaMA 3.2 will not be accessible)"
    # Token is set — verify authentication without printing the token value
    try:
        from huggingface_hub import HfApi
        api = HfApi()
        user_info = api.whoami(token=token)
        username = user_info.get("name", "unknown")
        return True, f"HF_TOKEN set, authenticated as '{username}'"
    except Exception as e:
        return False, f"HF_TOKEN set but auth failed: {e}"


def check_file_exists(path, description):
    def _check():
        exists = os.path.exists(path)
        return exists, f"{description}: {'found' if exists else 'NOT found'} at {path}"
    return _check


def check_directory_exists(path, description):
    def _check():
        exists = os.path.isdir(path)
        return exists, f"{description}: {'found' if exists else 'NOT found'} at {path}"
    return _check


def main():
    print("=" * 65)
    print("NeuroCut Container Verification")
    print("=" * 65)

    checks = [
        # 1. Python version
        ("Python 3.11", check_python_version, True),

        # 2. PyTorch + CUDA
        ("PyTorch version", check_torch_version, True),
        ("CUDA version (compiled)", check_cuda_version, True),
        ("CUDA GPU available", check_cuda_available, False),  # non-critical

        # 3. TRIBE v2 core
        ("tribev2 import", check_import("tribev2"), True),
        ("TribeModel import", check_import("tribev2", "TribeModel"), True),

        # 4. TRIBE v2 sub-dependencies
        ("neuralset", check_import("neuralset"), True),
        ("neuraltrain", check_import("neuraltrain"), True),
        ("transformers", check_import("transformers"), True),
        ("einops", check_import("einops"), True),
        ("x_transformers", check_import("x_transformers"), True),

        # 5. Video/audio processing
        ("moviepy", check_import("moviepy"), True),
        ("soundfile", check_import("soundfile"), True),
        ("julius", check_import("julius"), True),
        ("ffmpeg", check_ffmpeg, True),

        # 6. Text processing
        ("spacy", check_import("spacy"), True),
        ("spacy en_core_web_sm", check_spacy_model, True),
        ("langdetect", check_import("langdetect"), True),

        # 7. uv/uvx
        ("uv/uvx", check_uv, True),

        # 8. HuggingFace token
        ("HF_TOKEN", check_hf_token, False),  # non-critical (may not be set in CI)

        # 9. Application files
        ("region_masks.npz", check_file_exists("data/region_masks.npz", "Region masks"), True),
        ("src/region_mapping/", check_directory_exists("src/region_mapping", "Region mapping package"), True),

        # 10. RunPod SDK
        ("runpod", check_import("runpod"), True),
    ]

    results = []
    for name, fn, critical in checks:
        result = check(name, fn, critical)
        results.append(result)

    # Print results
    passed = 0
    failed_critical = 0
    failed_noncritical = 0
    total = len(results)

    print()
    for name, ok, msg, critical in results:
        tag = "[PASS]" if ok else "[FAIL]"
        crit_tag = "" if critical else " (non-critical)"
        print(f"  {tag} {name}: {msg}{crit_tag}")
        if ok:
            passed += 1
        elif critical:
            failed_critical += 1
        else:
            failed_noncritical += 1

    # Summary
    print()
    print("=" * 65)
    print(f"Results: {passed}/{total} checks passed")
    if failed_critical > 0:
        print(f"  {failed_critical} critical check(s) FAILED")
    if failed_noncritical > 0:
        print(f"  {failed_noncritical} non-critical check(s) failed (warnings only)")
    print("=" * 65)

    if failed_critical > 0:
        print(f"\n{failed_critical} critical failure(s). Container is NOT ready for inference.")
        sys.exit(1)
    else:
        if failed_noncritical > 0:
            print("\nAll critical checks passed. Non-critical warnings above are expected outside GPU environment.")
        else:
            print("\nAll checks passed! Container is ready for inference.")
        sys.exit(0)


if __name__ == "__main__":
    main()
