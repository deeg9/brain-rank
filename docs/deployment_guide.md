# NeuroCut RunPod Deployment Guide

Complete step-by-step instructions for building the NeuroCut Docker image, pushing it to Docker Hub, creating a RunPod serverless endpoint, and running your first inference job.

## Prerequisites

- **Docker Desktop** installed and running (macOS)
- **Docker Hub account** (free tier is fine) at [hub.docker.com](https://hub.docker.com)
- **RunPod account** at [runpod.io](https://www.runpod.io)
- **HF_TOKEN** environment variable set -- a Hugging Face access token with gated model access (needed for LLaMA 3.2 and other Meta models)

## Step 1: Docker Hub Setup

1. Create an account at [hub.docker.com](https://hub.docker.com) if you don't have one
2. Log in from your terminal:
   ```bash
   docker login
   ```
   Enter your Docker Hub username and password (or access token).
3. Verify authentication:
   ```bash
   docker info | grep Username
   ```
   You should see your username printed.

## Step 2: Build and Push Docker Image

1. Set the required environment variables:
   ```bash
   export DOCKER_USERNAME=your-dockerhub-username
   export HF_TOKEN=your-huggingface-token
   ```

2. Make the build script executable and run it:
   ```bash
   chmod +x scripts/build_and_push.sh
   ./scripts/build_and_push.sh
   ```

3. What to expect:
   - **Build time:** 15-30 minutes (downloads PyTorch, TRIBE v2, spaCy, and all ML dependencies)
   - **Image size:** ~10-12 GB (CUDA runtime + PyTorch + TRIBE v2 + dependencies)
   - **Push time:** Depends on your upload speed -- the image is large
   - The script builds with `--platform linux/amd64` because RunPod runs Linux x86_64, even though your Mac uses ARM64

4. After the push completes, the script prints the full image URL. Copy it -- you'll need it in Step 3.

## Step 3: Create RunPod Serverless Endpoint

1. Go to [runpod.io](https://www.runpod.io) and log in
2. Navigate to **Serverless** > **+ New Endpoint**
3. Configure the endpoint:

   | Setting | Value | Notes |
   |---------|-------|-------|
   | **Endpoint Name** | `neurocut-worker` | Or any name you prefer |
   | **Container Image** | `your-dockerhub-username/neurocut-worker:latest` | The URL from Step 2 |
   | **GPU Type** | **A40** (48 GB VRAM, ~$0.35/hr) | Validated in Phase 3 benchmarks. A30 (24 GB) also works -- peak VRAM is only 11 GB |
   | **Container Disk** | 20 GB | For model weights cache and temp video files |

4. Set **Environment Variables**:

   | Variable | Value | Why |
   |----------|-------|-----|
   | `HF_TOKEN` | Your Hugging Face token | Required at runtime for gated model access |

5. Configure **Advanced Settings**:

   | Setting | Value | Rationale |
   |---------|-------|-----------|
   | **Execution Timeout** | 1200 seconds (20 min) | Inference takes 10-13 min per 60s video; 20 min provides headroom |
   | **Max Workers** | 1 | Start with 1 for validation; increase later for parallel jobs |
   | **Min Workers (Active)** | 0 | Scale to zero when idle -- no cost when not processing |
   | **Idle Timeout** | 5 seconds | Default is fine |
   | **FlashBoot** | Enable if available | Caches container image for faster cold starts |

6. Click **Create Endpoint**
7. Note the **Endpoint ID** from the endpoint details page -- you'll need it in Step 5

## Step 4: Get RunPod API Key

1. Go to [runpod.io](https://www.runpod.io) > **Settings** > **API Keys**
2. Click **Create API Key** (or use an existing one)
3. Copy the key -- it starts with `rp_`

## Step 5: Test the Endpoint

1. Set the required environment variables:
   ```bash
   export RUNPOD_API_KEY=your-api-key
   export RUNPOD_ENDPOINT_ID=your-endpoint-id
   ```

2. Run the test client:
   ```bash
   python scripts/test_endpoint.py
   ```

3. What to expect:
   - **Immediately:** Job submitted, prints job ID
   - **First 1-2 minutes:** Status `IN_QUEUE` (container starting, pulling image on first run)
   - **Next 10-13 minutes:** Status `IN_PROGRESS` (TRIBE v2 inference running)
   - **After ~12-15 minutes:** Status `COMPLETED` with full JSON output
   - Output is saved to `data/endpoint_test_result.json`

4. To test with a different video:
   ```bash
   python scripts/test_endpoint.py "https://example.com/your-video.mp4"
   ```

## Architecture: Why Async (/run + Polling)

NeuroCut uses the **async** endpoint pattern (`/run` + `/status`) instead of the synchronous `/runsync` endpoint. Here's why:

- TRIBE v2 inference takes **10-13 minutes** per 60-second video
- RunPod's `/runsync` endpoint has a **90-second timeout** -- it would always fail
- `/run` returns immediately with a job ID (no timeout risk)
- The client polls `/status/{job_id}` every 30 seconds until `COMPLETED` or `FAILED`

This is the standard pattern for long-running ML inference on RunPod serverless.

## Troubleshooting

### Job status: FAILED
- Check RunPod logs: **Serverless** > **Your Endpoint** > **Logs**
- Common causes: missing HF_TOKEN, video URL not accessible, video too long

### Image pull timeout
- The first pull of a ~10-12 GB image takes time. RunPod may need a few minutes.
- Retry the job -- the image is cached after the first pull.

### OOM (Out of Memory) error
- Unlikely on A40 (11 GB peak VRAM vs 48 GB available)
- If using A30 (24 GB) and hitting OOM, switch to A40
- Check if the video is unusually long -- memory scales with duration

### HF_TOKEN errors
- Verify your token has access to Meta's gated models (meta-llama/Llama-3.2)
- Go to [huggingface.co/meta-llama](https://huggingface.co/meta-llama) and accept the license agreement
- Regenerate the token if it has expired

### 20-minute timeout hit
- The video may be too long. Default practical limit is ~90 seconds of video.
- For 60-second videos, inference should complete in 11-13 minutes.
- See the scaling estimates below for longer videos.

### Test client shows "Poll error"
- Transient network issue. The client will retry on the next poll cycle.

## Cost Reference

Based on benchmarks from Phase 3 (see `docs/inference_benchmarks.md`):

| GPU | Hourly Rate | Cost per 60s Video | Inference Time |
|-----|------------|--------------------|--------------| 
| A40 (48 GB) | $0.35/hr | ~$0.07 | 11-13 min |
| A30 (24 GB) | $0.26/hr | ~$0.05 | 11-13 min (estimated) |

- **Scale-to-zero** (Min Workers = 0) means zero cost when idle
- Cold start adds ~30-60 seconds on the first request (image pull + container init)
- Model loading takes only ~2 seconds (weights cached after first download)

### Scaling Estimates

| Video Duration | Estimated Time | Estimated Cost (A40) |
|---------------|----------------|---------------------|
| 30s | ~5-7 min | ~$0.03-0.04 |
| 60s | 11-13 min (measured) | ~$0.06-0.08 |
| 90s | ~16-19 min | ~$0.09-0.11 |

Maximum practical video length with the 20-minute (1200s) timeout: **~90 seconds**.
