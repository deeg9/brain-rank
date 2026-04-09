"""
Secure video download with SSRF prevention and size limits.

Downloads a video from an HTTP(S) URL to a temporary path for inference.
Rejects private/internal IP addresses, enforces a 500MB size limit, and
applies a 120-second download timeout.

Exceptions are NOT caught here -- they propagate to handler.py which wraps
them in ErrorResponse.
"""

import ipaddress
import logging
import socket
from pathlib import Path
from urllib.parse import urlparse

import requests

logger = logging.getLogger(__name__)

MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB
DOWNLOAD_TIMEOUT = 120  # seconds
CHUNK_SIZE = 8192


def _validate_url(url: str) -> str:
    """Validate URL scheme and reject private/internal IP addresses (SSRF prevention).

    Args:
        url: The URL to validate.

    Returns:
        The original URL if valid.

    Raises:
        ValueError: If the URL uses a non-HTTP(S) scheme or resolves to a private IP.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError(
            f"URL must use http or https scheme, got '{parsed.scheme}'"
        )

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL has no hostname")

    # Resolve hostname to IP addresses
    try:
        addr_infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror as e:
        raise ValueError(f"Cannot resolve hostname '{hostname}': {e}")

    for addr_info in addr_infos:
        ip_str = addr_info[4][0]
        ip = ipaddress.ip_address(ip_str)
        if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
            raise ValueError("URL resolves to a private IP address")

    return url


def download_video(url: str, job_id: str) -> Path:
    """Download a video from a URL to a temporary file.

    Args:
        url: HTTP(S) URL to download from.
        job_id: RunPod job ID, used for temp file naming.

    Returns:
        Path to the downloaded video file.

    Raises:
        ValueError: If the URL is invalid, resolves to a private IP, or the
            file exceeds MAX_VIDEO_SIZE.
        requests.exceptions.RequestException: On HTTP errors or timeouts.
    """
    _validate_url(url)

    output_path = Path(f"/tmp/video_{job_id}.mp4")
    logger.info("Downloading video for job %s...", job_id)

    response = requests.get(
        url, stream=True, timeout=DOWNLOAD_TIMEOUT, allow_redirects=True
    )
    response.raise_for_status()

    # Check Content-Length header if present
    content_length = response.headers.get("content-length")
    if content_length is not None:
        content_length = int(content_length)
        if content_length > MAX_VIDEO_SIZE:
            raise ValueError(
                f"Video too large: {content_length} bytes "
                f"(limit: {MAX_VIDEO_SIZE} bytes)"
            )

    # Stream download, tracking total bytes
    total_bytes = 0
    try:
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=CHUNK_SIZE):
                total_bytes += len(chunk)
                if total_bytes > MAX_VIDEO_SIZE:
                    raise ValueError(
                        f"Video exceeds size limit during download: "
                        f"{total_bytes} bytes (limit: {MAX_VIDEO_SIZE} bytes)"
                    )
                f.write(chunk)
    except Exception:
        # Clean up partial file on any error
        if output_path.exists():
            output_path.unlink(missing_ok=True)
        raise

    size_mb = total_bytes / (1024 * 1024)
    logger.info("Video downloaded: %.1fMB", size_mb)

    return output_path
