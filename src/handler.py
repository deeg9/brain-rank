"""RunPod serverless handler for NeuroCut inference pipeline.

Entry point: runpod.serverless.start() at module level.
Model loaded once at container startup via get_model().
Phase 7 will add inference and output mapping.
"""

import logging

import requests
import runpod

from src.model_loader import get_model
from src.schema import ErrorResponse, InputSchema
from src.video_fetcher import download_video

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("neurocut.handler")

# Load model once at container startup (HDLR-02)
model = get_model()
logger.info("NeuroCut handler ready")


def handler(job):
    """Process a RunPod serverless job.

    Steps:
        1. Validate input via InputSchema
        2. Download video from URL
        3. (Phase 7) Run inference and return OutputSchema

    Args:
        job: RunPod job dict with "input" and "id" keys.

    Returns:
        dict: Phase 7 placeholder response or ErrorResponse on failure.
    """
    job_input = job["input"]
    job_id = job.get("id", "unknown")
    logger.info("Job %s: received", job_id)

    # Step 1: Validate input
    try:
        params = InputSchema(**job_input)
    except Exception as e:
        logger.warning("Job %s: validation failed: %s", job_id, e)
        return ErrorResponse(error=str(e), error_type="validation").model_dump()

    # Step 2: Download video (with cleanup in finally)
    video_path = None
    try:
        video_path = download_video(params.video_url, job_id)
        logger.info("Job %s: video downloaded to %s", job_id, video_path)

        # TODO Phase 7: run inference and return OutputSchema
        return {
            "status": "video_downloaded",
            "video_path": str(video_path),
            "video_url": params.video_url,
        }

    except requests.exceptions.RequestException as e:
        return ErrorResponse(
            error=f"Download failed: {e}", error_type="download"
        ).model_dump()

    except ValueError as e:
        return ErrorResponse(error=str(e), error_type="validation").model_dump()

    except Exception as e:
        return ErrorResponse(
            error=f"Unexpected error: {e}", error_type="unknown"
        ).model_dump()

    finally:
        if video_path is not None and video_path.exists():
            video_path.unlink(missing_ok=True)
            logger.info("Job %s: cleaned up %s", job_id, video_path)


runpod.serverless.start({"handler": handler})
