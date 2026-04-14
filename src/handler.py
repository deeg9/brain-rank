"""RunPod serverless handler for NeuroCut inference pipeline.

Entry point: runpod.serverless.start() at module level.
Model loaded once at container startup via get_model().
Full pipeline: validate -> download -> infer -> postprocess -> return JSON.
"""

import glob as _glob
import logging
from pathlib import Path

import requests
import runpod
from moviepy import ImageClip

from src.image_converter import convert_image_to_video, resize_and_pad
from src.inference import run_inference, run_text_inference
from src.text_renderer import render_text_card
from src.model_loader import get_model
from src.postprocessor import postprocess
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
        3. Run TRIBE v2 inference
        4. Map predictions to NeuroCut OutputSchema
        5. Return structured JSON response

    Args:
        job: RunPod job dict with "input" and "id" keys.

    Returns:
        dict: OutputSchema.model_dump() on success, ErrorResponse on failure.
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

    # Steps 2-4: Download/convert, infer, postprocess (with cleanup in finally)
    video_path = None
    text_path = None
    card_path = None
    stage = "download"
    try:
        # Step 2: Download/convert media based on input type
        if params.input_type == "text_visual":
            stage = "text_rendering"
            card_path = render_text_card(
                params.text_content,
                params.text_style or "general",
                job_id,
            )
            logger.info("Job %s: text card rendered at %s", job_id, card_path)

            # Convert rendered card to video (same pattern as image branch but from local file)
            stage = "conversion"
            frame = resize_and_pad(card_path)  # Already 1280x720 but keeps pipeline consistent
            resized_path = Path(f"/tmp/resized_{job_id}.png")
            from PIL import Image as PILImage
            PILImage.fromarray(frame).save(resized_path, format="PNG")

            video_path = Path(f"/tmp/video_{job_id}.mp4")
            clip = ImageClip(str(resized_path), duration=6.0)
            clip.write_videofile(
                str(video_path),
                fps=10,
                codec="libx264",
                audio=False,
                logger=None,
            )
            clip.close()
            resized_path.unlink(missing_ok=True)
            logger.info("Job %s: text card converted to 6s video", job_id)

            # Clean up card image
            card_path.unlink(missing_ok=True)

            stage = "inference"
            logger.info("Job %s: running inference...", job_id)
            predictions, segments, timing = run_inference(model, str(video_path), job_id)
            logger.info("Job %s: inference complete — %d segments", job_id, len(segments))

        elif params.input_type == "text_spoken":
            stage = "text_preparation"
            text_path = Path(f"/tmp/text_{job_id}.txt")
            text_path.write_text(params.text_content, encoding="utf-8")
            logger.info("Job %s: text saved to %s", job_id, text_path)

            # Step 3: Run text inference via TRIBE v2 native text_path
            stage = "inference"
            logger.info("Job %s: running text spoken inference...", job_id)
            try:
                predictions, segments, timing = run_text_inference(model, str(text_path), job_id)
            except Exception as e:
                error_msg = str(e).lower()
                if "gtts" in error_msg or "tts" in error_msg or "connection" in error_msg:
                    raise RuntimeError(
                        "Text-to-speech failed. TRIBE v2 requires internet for text analysis."
                    ) from e
                raise
            logger.info("Job %s: text inference complete — %d segments", job_id, len(segments))
        elif params.input_type == "image":
            stage = "conversion"
            video_path = convert_image_to_video(
                params.video_url, job_id, duration=params.image_duration
            )
            logger.info("Job %s: image converted to video at %s", job_id, video_path)

            stage = "inference"
            logger.info("Job %s: running inference...", job_id)
            predictions, segments, timing = run_inference(model, str(video_path), job_id)
            logger.info("Job %s: inference complete — %d segments", job_id, len(segments))
        else:
            video_path = download_video(params.video_url, job_id)
            logger.info("Job %s: video downloaded to %s", job_id, video_path)

            # Step 3: Run inference (HDLR-05)
            stage = "inference"
            logger.info("Job %s: running inference...", job_id)
            predictions, segments, timing = run_inference(model, str(video_path), job_id)
            logger.info("Job %s: inference complete — %d segments", job_id, len(segments))

        # Step 4: Map to NeuroCut schema (HDLR-06)
        stage = "postprocessing"
        logger.info("Job %s: postprocessing...", job_id)
        media_url = params.video_url or f"text://{job_id}"
        output = postprocess(predictions, segments, media_url, job_id, include_vertex_data=params.include_vertex_data)
        logger.info("Job %s: complete", job_id)

        return output.model_dump()

    except requests.exceptions.RequestException as e:
        return ErrorResponse(
            error=f"Download failed: {e}", error_type="download"
        ).model_dump()

    except ValueError as e:
        error_type = "validation" if stage == "download" else "inference"
        return ErrorResponse(error=str(e), error_type=error_type).model_dump()

    except Exception as e:
        error_type = "inference" if stage in ("inference", "postprocessing") else "unknown"
        logger.exception("Job %s: %s failed", job_id, stage)
        return ErrorResponse(
            error=f"{stage.capitalize()} failed: {e}", error_type=error_type
        ).model_dump()

    finally:
        # Clean up downloaded video (HDLR-08 / T-07-06)
        if video_path is not None and video_path.exists():
            video_path.unlink(missing_ok=True)
            logger.info("Job %s: cleaned up %s", job_id, video_path)

        # Clean up text temp file
        if text_path is not None and text_path.exists():
            text_path.unlink(missing_ok=True)
            logger.info("Job %s: cleaned up %s", job_id, text_path)

        # Clean up rendered card image (safety net for text_visual)
        if card_path is not None and card_path.exists():
            card_path.unlink(missing_ok=True)
            logger.info("Job %s: cleaned up %s", job_id, card_path)

        # Clean up TRIBE v2 temp files (extracted audio, frames)
        for pattern in [f"/tmp/*{job_id}*", "/tmp/tribe_*"]:
            for f in _glob.glob(pattern):
                try:
                    Path(f).unlink(missing_ok=True)
                except OSError:
                    pass


runpod.serverless.start({"handler": handler})
