"""
Image-to-video conversion for TRIBE v2 inference.

Downloads a static image, resizes/pads to 1280x720 (16:9),
and converts to a static video using MoviePy ImageClip.
"""

import logging
from pathlib import Path

import numpy as np
import requests
from moviepy import ImageClip
from PIL import Image

logger = logging.getLogger(__name__)

TARGET_WIDTH = 1280
TARGET_HEIGHT = 720
FPS = 10
MAX_IMAGE_SIZE = 50 * 1024 * 1024  # 50MB server-side limit (generous)
DOWNLOAD_TIMEOUT = 30


def download_image(url: str, job_id: str) -> Path:
    """Download image from URL with SSRF checks reused from video_fetcher pattern."""
    from src.video_fetcher import _validate_url

    _validate_url(url)

    # Determine extension from URL or default to .jpg
    ext = Path(url.split("?")[0]).suffix or ".jpg"
    if ext.lower() not in (".jpg", ".jpeg", ".png"):
        ext = ".jpg"

    output_path = Path(f"/tmp/image_{job_id}{ext}")

    response = requests.get(url, stream=True, timeout=DOWNLOAD_TIMEOUT, allow_redirects=True)
    response.raise_for_status()

    content_length = response.headers.get("content-length")
    if content_length and int(content_length) > MAX_IMAGE_SIZE:
        raise ValueError(f"Image too large: {content_length} bytes")

    total_bytes = 0
    with open(output_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            total_bytes += len(chunk)
            if total_bytes > MAX_IMAGE_SIZE:
                output_path.unlink(missing_ok=True)
                raise ValueError(f"Image exceeds size limit: {total_bytes} bytes")
            f.write(chunk)

    logger.info("Job %s: image downloaded (%.1fKB)", job_id, total_bytes / 1024)
    return output_path


def resize_and_pad(image_path: Path) -> np.ndarray:
    """Resize image to fit within 1280x720, pad to exact 16:9 with black bars."""
    img = Image.open(image_path).convert("RGB")
    w, h = img.size

    # Scale to fit within TARGET dimensions while preserving aspect ratio
    scale = min(TARGET_WIDTH / w, TARGET_HEIGHT / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)

    # Pad to exact 1280x720 with black
    canvas = Image.new("RGB", (TARGET_WIDTH, TARGET_HEIGHT), (0, 0, 0))
    offset_x = (TARGET_WIDTH - new_w) // 2
    offset_y = (TARGET_HEIGHT - new_h) // 2
    canvas.paste(img, (offset_x, offset_y))

    return np.array(canvas)


def convert_image_to_video(
    image_url: str, job_id: str, duration: float = 6.0
) -> Path:
    """Download image, resize/pad to 1280x720, convert to static video.

    Args:
        image_url: Public URL of the uploaded image.
        job_id: RunPod job ID for temp file naming.
        duration: How long to hold the image as video (seconds).

    Returns:
        Path to the generated MP4 video file.
    """
    image_path = download_image(image_url, job_id)
    resized_path = Path(f"/tmp/resized_{job_id}.png")

    try:
        # Resize/pad and save to disk as PNG
        frame = resize_and_pad(image_path)
        Image.fromarray(frame).save(resized_path, format="PNG")

        video_path = Path(f"/tmp/video_{job_id}.mp4")

        # Pass file path string (not numpy array) — more reliable across moviepy versions
        clip = ImageClip(str(resized_path), duration=duration)
        clip.write_videofile(
            str(video_path),
            fps=FPS,
            codec="libx264",
            audio=False,
            logger=None,
        )
        clip.close()

        logger.info(
            "Job %s: image converted to %ds video at %dfps",
            job_id, int(duration), FPS
        )
        return video_path
    finally:
        # Clean up temp files
        if image_path.exists():
            image_path.unlink(missing_ok=True)
        if resized_path.exists():
            resized_path.unlink(missing_ok=True)
