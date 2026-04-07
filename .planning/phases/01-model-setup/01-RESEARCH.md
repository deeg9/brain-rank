# Phase 1: Model Setup - Research

**Researched:** 2026-04-07
**Domain:** ML model installation, dependency resolution, GPU inference validation
**Confidence:** HIGH

## Summary

Phase 1 is a pure infrastructure phase: clone TRIBE v2 from facebookresearch/tribev2, resolve all dependencies (including the Meta-published neuralset and neuraltrain PyPI packages), run inference on a 60-second test video, and log the raw output tensor shape. The primary risk is that the local development machine is macOS ARM64 (Apple Silicon) with NO NVIDIA GPU -- TRIBE v2 requires CUDA. All inference testing must happen on a remote GPU environment (RunPod pod, cloud VM, or Colab).

The secondary risk is dependency resolution: TRIBE v2 hard-pins numpy==2.2.6 and x_transformers==1.27.20, and depends on neuralset==0.0.2 and neuraltrain==0.0.2 (both published on PyPI by Meta FAIR on March 25, 2026). These are real packages, not Meta-internal -- but they are brand new (v0.0.2) and may have their own transitive dependency issues. Installation must be tested in a clean Python 3.11 environment early.

**Primary recommendation:** Use a RunPod GPU Pod (not serverless -- a dev pod with SSH access) or Google Colab with GPU to perform the initial clone, install, and inference test. Do NOT attempt to run TRIBE v2 locally on this Mac.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MODL-01 | TRIBE v2 cloned from facebookresearch/tribev2 and dependencies installed in a clean environment | Installation commands verified from demo notebook and PyPI; neuralset/neuraltrain confirmed on PyPI; known issues documented (numpy pin, pip-as-dependency bug) |
| MODL-02 | TRIBE v2 runs locally on a GPU and produces output for a 60-second test video | API pattern verified from demo notebook: `TribeModel.from_pretrained()` + `get_events_dataframe()` + `predict()`; output shape confirmed as `(n_timesteps, 20484)`; requires CUDA GPU -- local Mac has none |
</phase_requirements>

## Standard Stack

### Core (for this phase only -- installation and inference validation)

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| tribev2 | 0.1.0 (from git) | Brain activation prediction model | [VERIFIED: GitHub pyproject.toml] |
| neuralset | 0.0.2 | Neuroimaging data pipeline toolkit | [VERIFIED: PyPI, published 2026-03-25 by Meta FAIR] |
| neuraltrain | 0.0.2 | Deep learning for neuroimaging data | [VERIFIED: PyPI, published 2026-03-25 by Meta FAIR] |
| torch | 2.6.0+cu124 | Deep learning framework | [VERIFIED: TRIBE v2 pyproject.toml constraint >=2.5.1,<2.7] |
| torchvision | 0.21.0+cu124 | Vision transforms | [VERIFIED: pyproject.toml >=0.20,<0.22] |
| torchaudio | 2.6.0+cu124 | Audio processing (Wav2Vec-BERT) | [VERIFIED: pyproject.toml] |
| numpy | 2.2.6 | Array operations | [VERIFIED: pyproject.toml hard pin] |
| x_transformers | 1.27.20 | Transformer architecture | [VERIFIED: pyproject.toml hard pin] |
| moviepy | >=2.2.1 | Video/audio extraction | [VERIFIED: pyproject.toml] |
| spacy | >=3.7 | NLP pipeline | [VERIFIED: pyproject.toml] |
| transformers | >=4.45 | HuggingFace model loading | [VERIFIED: pyproject.toml] |
| huggingface_hub | >=0.20 | Model downloads from Hub | [VERIFIED: pyproject.toml] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ffmpeg | system package | Video/audio codec backend | Always -- moviepy depends on it |
| en_core_web_sm | latest | spaCy English model | After spacy install, `python -m spacy download en_core_web_sm` |

### Not Needed for This Phase

| Library | Why Not |
|---------|---------|
| tribev2[plotting] | Adds nibabel, matplotlib, pyvista, nilearn -- unnecessary for inference validation |
| tribev2[training] | Adds wandb, lightning -- not training |
| runpod SDK | Phase 1 is about model validation, not RunPod deployment |

**Installation command (verified from demo notebook):** [VERIFIED: tribe_demo.ipynb]
```bash
pip install "tribev2 @ git+https://github.com/facebookresearch/tribev2.git"
```

This single command resolves tribev2 + neuralset + neuraltrain + all other dependencies from pyproject.toml. PyTorch with CUDA should be installed FIRST to prevent pip from pulling CPU-only wheels.

**Full installation sequence:**
```bash
# 1. Create clean Python 3.11 environment
python3.11 -m venv .venv
source .venv/bin/activate

# 2. Install PyTorch with CUDA 12.4 FIRST (prevents CPU-only fallback)
pip install torch==2.6.0+cu124 torchvision==0.21.0+cu124 torchaudio==2.6.0+cu124 \
    --index-url https://download.pytorch.org/whl/cu124

# 3. Install TRIBE v2 from source (pulls neuralset, neuraltrain, and all deps)
pip install "tribev2 @ git+https://github.com/facebookresearch/tribev2.git"

# 4. Download spaCy model
python -m spacy download en_core_web_sm

# 5. Verify installation
python -c "from tribev2 import TribeModel; print('tribev2 OK')"
python -c "import neuralset; print('neuralset OK')"
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"
```

## Architecture Patterns

### Inference API Pattern (verified from demo notebook and README)

```python
# Source: https://github.com/facebookresearch/tribev2/blob/main/tribe_demo.ipynb
from tribev2 import TribeModel

# Load pretrained model (downloads ~1GB checkpoint + sub-models on first run)
model = TribeModel.from_pretrained("facebook/tribev2", cache_folder="./cache")

# Create events dataframe from video (extracts audio, transcribes with WhisperX)
df = model.get_events_dataframe(video_path="path/to/video.mp4")
# df columns: type, start, duration, filepath, text, context

# Run inference -- returns predictions and segments
preds, segments = model.predict(events=df)
# preds shape: (n_timesteps, 20484) -- one prediction per second, 20,484 cortical vertices
# segments: list of time segments with associated events
```

[VERIFIED: tribe_demo.ipynb shows this exact pattern producing n_timesteps=53 for the Sintel trailer]

### Output Format

| Property | Value | Source |
|----------|-------|--------|
| Output shape | `(n_timesteps, 20484)` | [VERIFIED: demo notebook output] |
| Temporal resolution | 1 prediction per second of stimulus | [VERIFIED: demo notebook] |
| Spatial resolution | 20,484 cortical vertices (fsaverage5 mesh, 10,242 per hemisphere) | [VERIFIED: PITFALLS.md, demo notebook] |
| Data type | numpy array (float) | [VERIFIED: demo notebook uses `.tolist()`] |
| Hemodynamic offset | 5 seconds -- prediction at time T corresponds to stimulus at T-5 | [CITED: PITFALLS.md, Meta blog] |

### What the Output Is NOT

The output is NOT "engagement scores" or "activation scores" per segment. It is raw predicted fMRI voxel activations across the cortical surface. Mapping these to psychological constructs (attention, arousal, valence) is Phase 2's problem and requires neuroscience domain knowledge. Phase 1 only needs to confirm the raw output is produced and log its shape.

### Recommended Project Structure (for this phase)

```
NeuroCut/
  scripts/
    test_inference.py      # Standalone script to run TRIBE v2 on test video
    verify_install.py      # Checks all imports and CUDA availability
  test_videos/
    .gitkeep               # Test video NOT committed (too large)
  docs/
    model_output_format.md # Document raw output shape and format
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video-to-events pipeline | Custom video/audio extraction | `model.get_events_dataframe()` | TRIBE v2 handles video splitting, audio extraction, WhisperX transcription internally |
| Model loading | Manual weight download + state_dict loading | `TribeModel.from_pretrained()` | Handles HuggingFace Hub auth, sub-model resolution, checkpoint loading |
| Audio transcription | Custom WhisperX setup | Let TRIBE v2's internal pipeline handle it | WhisperX is an implicit dependency loaded by TRIBE v2 |

## Common Pitfalls

### Pitfall 1: No Local NVIDIA GPU
**What goes wrong:** Developer attempts to run TRIBE v2 on this macOS ARM64 machine. TRIBE v2 requires CUDA -- there is no MPS/CPU fallback path for all sub-models.
**Why it happens:** Phase 1 says "runs locally on a GPU" but the development machine has no NVIDIA GPU.
**How to avoid:** Use a remote GPU environment from the start:
- **Option A (recommended):** RunPod GPU Pod (not serverless) -- SSH access, A40 48GB, ~$0.35/hr. Spin up, install, test, shut down.
- **Option B:** Google Colab with T4/A100 GPU -- free tier has T4 (16GB), may be tight but the demo notebook runs on Colab.
- **Option C:** Cloud VM (Lambda Labs, Vast.ai, AWS g5 instance)
**Warning signs:** `torch.cuda.is_available()` returns False.

### Pitfall 2: neuralset/neuraltrain Resolution Failure
**What goes wrong:** `pip install` fails to resolve neuralset==0.0.2 or neuraltrain==0.0.2.
**Why it happens:** These are brand-new packages (published 2026-03-25). They may have their own strict dependency pins that conflict with other packages in the environment.
**How to avoid:** Install in a clean Python 3.11 venv. Install PyTorch FIRST, then tribev2. If resolution fails, install neuralset and neuraltrain individually to isolate the conflict.
**Warning signs:** `ERROR: No matching distribution found` or `ERROR: ResolutionImpossible`.

### Pitfall 3: numpy==2.2.6 Hard Pin Conflict
**What goes wrong:** TRIBE v2 hard-pins numpy==2.2.6. Other packages in the environment may require a different numpy version, causing pip resolution failure.
**Why it happens:** Known issue (GitHub issue #6). The pin is unnecessarily strict.
**How to avoid:** Install tribev2 in a dedicated venv with no pre-existing packages. If conflict occurs, manually install numpy==2.2.6 first, then install tribev2 with `--no-deps` and manually install remaining deps.
**Warning signs:** `ERROR: Cannot install tribev2 because these package versions have conflicting dependencies`.

### Pitfall 4: LLaMA 3.2 Gated Model Access
**What goes wrong:** `TribeModel.from_pretrained()` downloads V-JEPA2 and Wav2Vec-BERT fine, but fails when loading LLaMA 3.2 because it's a gated model on HuggingFace requiring license acceptance.
**Why it happens:** User hasn't accepted the LLaMA 3.2 license on huggingface.co or hasn't set HF_TOKEN.
**How to avoid:**
1. Go to https://huggingface.co/meta-llama and accept the LLaMA 3.2 license
2. Create a HuggingFace token at https://huggingface.co/settings/tokens
3. Set `HF_TOKEN` environment variable or run `huggingface-cli login`
**Warning signs:** "access denied" or "gated repo" error during model loading.

### Pitfall 5: First Run Downloads 6-11GB of Sub-Models
**What goes wrong:** First call to `from_pretrained()` triggers download of V-JEPA2 (~1-2GB), LLaMA 3.2 (~3-6GB), Wav2Vec-BERT (~1-2GB), plus TRIBE v2 checkpoint (~1GB). On a slow connection or with limited disk, this fails silently or takes very long.
**Why it happens:** Sub-models are not bundled -- they download from HuggingFace Hub at runtime.
**How to avoid:** Ensure sufficient disk space (20GB free minimum). Use `cache_folder` parameter to control where weights are stored. On RunPod pod, use the persistent volume.
**Warning signs:** Inference hangs for 10+ minutes on first run.

### Pitfall 6: Windows Path Bug in from_pretrained
**What goes wrong:** On Windows, `TribeModel.from_pretrained("facebook/tribev2")` fails with HFValidationError because `pathlib.Path` converts forward slashes to backslashes.
**Why it happens:** Known bug (GitHub issue #10), PR #11 submitted but may not be merged yet.
**How to avoid:** Use Linux (RunPod pods are Linux). If testing on Windows, apply the fix from PR #11 manually.

## Code Examples

### Minimal Inference Test Script

```python
#!/usr/bin/env python3
"""
Phase 1 validation: Run TRIBE v2 on a test video and log output format.
Must be run on a machine with NVIDIA GPU and CUDA.
"""
import sys
import time
import torch

# Step 1: Verify CUDA
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if not torch.cuda.is_available():
    print("ERROR: CUDA not available. TRIBE v2 requires an NVIDIA GPU.")
    sys.exit(1)
print(f"GPU: {torch.cuda.get_device_name(0)}")
print(f"VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")

# Step 2: Load model
from tribev2 import TribeModel

print("\nLoading TRIBE v2 model...")
t0 = time.time()
model = TribeModel.from_pretrained("facebook/tribev2", cache_folder="./cache")
print(f"Model loaded in {time.time() - t0:.1f}s")

# Step 3: Run inference on test video
VIDEO_PATH = "test_video.mp4"  # 60-second test video
print(f"\nProcessing video: {VIDEO_PATH}")

t0 = time.time()
df = model.get_events_dataframe(video_path=VIDEO_PATH)
print(f"Events extracted in {time.time() - t0:.1f}s")
print(f"Events dataframe shape: {df.shape}")
print(f"Event types: {df['type'].unique().tolist()}")

t0 = time.time()
preds, segments = model.predict(events=df)
print(f"Inference completed in {time.time() - t0:.1f}s")

# Step 4: Log output format
print(f"\n=== OUTPUT FORMAT ===")
print(f"Predictions type: {type(preds)}")
print(f"Predictions shape: {preds.shape}")
print(f"Predictions dtype: {preds.dtype}")
print(f"Predictions min: {preds.min():.4f}")
print(f"Predictions max: {preds.max():.4f}")
print(f"Predictions mean: {preds.mean():.4f}")
print(f"Number of segments: {len(segments)}")
print(f"Segments type: {type(segments)}")
if len(segments) > 0:
    print(f"First segment: {segments[0]}")

# Step 5: Log VRAM usage
print(f"\n=== GPU MEMORY ===")
print(f"Max VRAM allocated: {torch.cuda.max_memory_allocated() / 1e9:.2f} GB")
print(f"Max VRAM reserved: {torch.cuda.max_memory_reserved() / 1e9:.2f} GB")

print("\n=== PHASE 1 VALIDATION COMPLETE ===")
```

[ASSUMED: The exact column names in the events dataframe (type, start, duration, filepath, text, context) are from the demo notebook but may vary by tribev2 version]

### Installation Verification Script

```python
#!/usr/bin/env python3
"""Verify all TRIBE v2 dependencies are installed correctly."""
import importlib

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

for pkg, attr in packages:
    try:
        mod = importlib.import_module(pkg)
        version = getattr(mod, "__version__", "unknown")
        status = "OK"
        if attr:
            getattr(mod, attr)
            status = f"OK (has {attr})"
        print(f"  {pkg:20s} {version:15s} {status}")
    except Exception as e:
        print(f"  {pkg:20s} {'FAILED':15s} {e}")

# CUDA check
import torch
print(f"\n  CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"  GPU: {torch.cuda.get_device_name(0)}")
    print(f"  VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.11 | TRIBE v2 (requires >=3.11) | NO | 3.9.6 installed | Install via Homebrew: `brew install python@3.11` (for local scripts only) |
| NVIDIA GPU + CUDA | TRIBE v2 inference | NO | macOS ARM64, no NVIDIA GPU | Use RunPod GPU Pod or Google Colab |
| Docker | Container build testing | YES | 29.2.1 | -- |
| ffmpeg | moviepy / TRIBE v2 | YES | 8.0 | -- |
| git | Clone tribev2 repo | YES | 2.50.1 | -- |
| HuggingFace account + HF_TOKEN | LLaMA 3.2 gated access | UNKNOWN | -- | Must verify before inference |

**Missing dependencies with no fallback:**
- NVIDIA GPU with CUDA -- this is a hard requirement for TRIBE v2. All inference testing MUST happen on a remote GPU machine. This is the single biggest constraint for Phase 1.

**Missing dependencies with fallback:**
- Python 3.11 -- can install locally via Homebrew for writing/testing scripts, but inference still needs remote GPU

**Implication for planning:** Phase 1 tasks must be split into:
1. Local tasks (script writing, repo cloning, dependency analysis) -- can run on this Mac
2. Remote GPU tasks (installation in clean env, inference test, output logging) -- must run on RunPod/Colab

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual validation scripts (no test framework needed for Phase 1) |
| Config file | None -- Phase 1 is infrastructure validation |
| Quick run command | `python scripts/verify_install.py` |
| Full suite command | `python scripts/test_inference.py` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MODL-01 | All dependencies install without errors | smoke | `python scripts/verify_install.py` | Wave 0 |
| MODL-02 | TRIBE v2 produces output for 60s test video | smoke | `python scripts/test_inference.py` | Wave 0 |

### Sampling Rate
- **Per task commit:** `python scripts/verify_install.py` (local checks only)
- **Per wave merge:** Full inference test on GPU
- **Phase gate:** Both MODL-01 and MODL-02 pass on remote GPU

### Wave 0 Gaps
- [ ] `scripts/verify_install.py` -- import verification for all deps
- [ ] `scripts/test_inference.py` -- inference test with output logging
- [ ] Test video acquisition -- need a 60-second MP4 video for testing

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TRIBE v1 (single modality) | TRIBE v2 (tri-modal: video + audio + text) | March 2026 | Output is now 20,484 vertices (fsaverage5) from multi-modal fusion |
| Custom feature extraction | Built-in `get_events_dataframe()` | March 2026 | Single function handles video decomposition, audio extraction, WhisperX transcription |
| Manual sub-model setup | `TribeModel.from_pretrained()` | March 2026 | Loads all sub-models (V-JEPA2, LLaMA 3.2, Wav2Vec-BERT) automatically from HuggingFace |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Events dataframe has columns: type, start, duration, filepath, text, context | Code Examples | Script may need column name adjustments -- low risk, easily fixed |
| A2 | WhisperX is loaded internally by TRIBE v2 and does not need separate installation | Don't Hand-Roll | If WhisperX needs separate install, add to installation sequence |
| A3 | RunPod GPU Pod with A40 (48GB VRAM) is sufficient for TRIBE v2 inference | Environment | If VRAM insufficient, upgrade to A100 80GB |
| A4 | Test video can be any MP4 file of ~60 seconds -- no specific format requirements beyond what ffmpeg can decode | Validation | May need specific resolution or codec |

## Open Questions

1. **WhisperX as implicit dependency**
   - What we know: Demo notebook shows WhisperX is used for speech transcription internally
   - What's unclear: Whether WhisperX is automatically installed as a transitive dependency of tribev2, or needs separate installation
   - Recommendation: Attempt install without explicit WhisperX first. If transcription fails at runtime, add `pip install whisperx` as a follow-up step

2. **Exact VRAM usage**
   - What we know: TRIBE v2 loads V-JEPA2 + LLaMA 3.2 + Wav2Vec-BERT + its own transformer. Estimated 15-30GB
   - What's unclear: Actual peak VRAM with a 60-second video
   - Recommendation: Start with A40 (48GB). Log `torch.cuda.max_memory_allocated()` after inference

3. **Test video source**
   - What we know: Demo notebook uses the Sintel trailer
   - What's unclear: Whether any 60-second video works or if there are format constraints
   - Recommendation: Use a freely available 60-second clip (e.g., download Sintel trailer segment, or use a Creative Commons video from archive.org)

4. **GitHub issue fixes**
   - What we know: Issue #6 (numpy pin) and #10 (Windows path) have PRs submitted
   - What's unclear: Whether these are merged yet
   - Recommendation: If install fails due to numpy conflict, use `--no-deps` and manually install. Windows path issue irrelevant (using Linux on RunPod)

## Sources

### Primary (HIGH confidence)
- [TRIBE v2 GitHub Repository](https://github.com/facebookresearch/tribev2) -- pyproject.toml dependencies, README installation instructions
- [TRIBE v2 Demo Notebook](https://github.com/facebookresearch/tribev2/blob/main/tribe_demo.ipynb) -- verified inference API pattern, output shape, installation command
- [neuralset on PyPI](https://pypi.org/project/neuralset/) -- confirmed v0.0.2, published 2026-03-25 by Meta FAIR
- [neuraltrain on PyPI](https://pypi.org/project/neuraltrain/) -- confirmed v0.0.2, published 2026-03-25 by Meta FAIR
- [TRIBE v2 GitHub Issues](https://github.com/facebookresearch/tribev2/issues) -- known installation bugs (#6 numpy pin, #10 Windows path, #24 HF Spaces)

### Secondary (MEDIUM confidence)
- [Meta AI Blog: TRIBE v2](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) -- architecture overview, sub-model descriptions
- [TRIBE v2 on HuggingFace](https://huggingface.co/facebook/tribev2) -- model card, gated access requirements

### Tertiary (LOW confidence)
- VRAM estimates (15-30GB) are extrapolated from sub-model parameter counts, not measured

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified from pyproject.toml and PyPI
- Architecture: HIGH -- inference API verified from demo notebook
- Pitfalls: HIGH -- informed by GitHub issues and PITFALLS.md research
- Environment: HIGH -- local machine probed directly

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (TRIBE v2 is actively maintained, check for new releases)
