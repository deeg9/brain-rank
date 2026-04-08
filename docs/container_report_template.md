# Container Verification Report

**Date:** [DATE]
**GPU:** [GPU model from nvidia-smi]
**Pod:** RunPod [pod type]

## Build Results

| Metric | Value |
|--------|-------|
| Build time | [X min Y sec] |
| Image size (no weights) | [X.XX GB] |
| Image size target (<15GB) | [PASS/FAIL] |

## Verification Results (CNTR-04)

All sub-models load on GPU and `torch.cuda.is_available()` returns `True`.

```
[Paste verify_container.py output here]
```

- torch.cuda.is_available(): [True/False]
- GPU detected: [GPU name]
- Critical checks passed: [X/Y]
- Non-critical checks passed: [X/Y]

## Model Load Test

- TribeModel.from_pretrained: [SUCCESS/FAIL]
- VRAM after load: [X.XX GB]
- Weight download time: [X min Y sec] (first run only)

## Image Size Analysis (CNTR-05)

| Component | Estimated Size |
|-----------|---------------|
| Base image (nvidia/cuda:12.4.1-cudnn-runtime) | ~4 GB |
| Python 3.11 + system deps | ~0.5 GB |
| PyTorch 2.6.0+cu124 | ~2.5 GB |
| TRIBE v2 + ML deps | ~2-3 GB |
| RunPod SDK + utils | ~0.1 GB |
| Application code + masks | <0.01 GB |
| **Total (no weights)** | **[ACTUAL] GB** |
| Model weights (if baked) | ~8-10 GB |
| **Total (with weights)** | **~[ESTIMATE] GB** |

## Weights Strategy Decision (CNTR-06)

**Decision:** [Network Volume / Bake into image]

**Rationale:**
[Fill in based on actual image size and build experience]

**Implementation:**
- RunPod endpoint config: Set `HF_HOME=/runpod-volume/huggingface`
- First cold start: Models download to network volume (~2-5 min)
- Subsequent starts: Cached weights load instantly
- Network volume size needed: ~15 GB (weights + HF cache overhead)

**Trade-offs:**

| Approach | Image Size | Cold Start | Subsequent Starts |
|----------|-----------|------------|-------------------|
| Network Volume (recommended) | [ACTUAL] GB | ~2-5 min (first download) | Near-instant |
| Bake into image | ~[ESTIMATE] GB | Longer pull time | No download needed |

## Status

- [ ] CNTR-04: All sub-models load on GPU -- [PASS/FAIL]
- [ ] CNTR-05: Image size under 15GB (excl. weights) -- [PASS/FAIL]
- [ ] CNTR-06: Weights strategy decided -- [DECIDED/PENDING]
