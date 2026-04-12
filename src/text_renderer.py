"""
Pillow-based text card renderer for text_visual inference mode.

Renders user text as a styled 1280x720 PNG image card with one of
three style templates: Billboard, Social Post, or General.

The rendered card is then converted to video for TRIBE v2 inference.
"""

import logging
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

CARD_WIDTH = 1280
CARD_HEIGHT = 720

# Font path available in the Docker container (DejaVu Sans Bold)
_FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def _load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Load DejaVu Sans Bold at requested size, fall back to default."""
    try:
        return ImageFont.truetype(_FONT_PATH, size)
    except (OSError, IOError):
        logger.warning("DejaVu font not found, using Pillow default font")
        return ImageFont.load_default()


def _draw_centered_text(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    color: tuple[int, int, int],
    area_top: int,
    area_bottom: int,
) -> None:
    """Draw multiple lines of text centered horizontally and vertically within area."""
    # Measure total text block height
    line_heights = []
    line_widths = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_widths.append(bbox[2] - bbox[0])
        line_heights.append(bbox[3] - bbox[1])

    line_spacing = 8
    total_height = sum(line_heights) + line_spacing * (len(lines) - 1)
    area_height = area_bottom - area_top

    # Vertical centering
    y = area_top + (area_height - total_height) // 2

    for i, line in enumerate(lines):
        w = line_widths[i]
        x = (CARD_WIDTH - w) // 2
        draw.text((x, y), line, fill=color, font=font)
        y += line_heights[i] + line_spacing


def _fit_font_size(
    draw: ImageDraw.ImageDraw,
    text: str,
    max_width: int,
    start_size: int,
    min_size: int = 24,
) -> tuple[ImageFont.FreeTypeFont | ImageFont.ImageFont, int]:
    """Find the largest font size where single-line text fits within max_width."""
    for size in range(start_size, min_size - 1, -2):
        font = _load_font(size)
        bbox = draw.textbbox((0, 0), text, font=font)
        if (bbox[2] - bbox[0]) <= max_width:
            return font, size
    return _load_font(min_size), min_size


def _render_billboard(img: Image.Image, draw: ImageDraw.ImageDraw, text: str) -> None:
    """Billboard: large white text on dark gradient background."""
    # Dark navy/charcoal base
    img.paste((15, 15, 35), [0, 0, CARD_WIDTH, CARD_HEIGHT])

    # Subtle radial-ish highlight in center (lighter overlay rectangle)
    highlight = Image.new("RGBA", (600, 300), (60, 60, 100, 40))
    # Paste onto RGB image by compositing
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    overlay.paste(highlight, (340, 210))
    img_rgba = img.convert("RGBA")
    composited = Image.alpha_composite(img_rgba, overlay)
    img.paste(composited.convert("RGB"))

    text_color = (255, 255, 255)
    max_text_width = CARD_WIDTH - 160  # 80px padding each side

    if len(text) > 60:
        # Multi-line: wrap and use smaller font
        lines = textwrap.wrap(text, width=30)
        font = _load_font(56)
    else:
        # Single line: fit font dynamically starting at 72px
        font, _ = _fit_font_size(draw, text, max_text_width, start_size=72)
        lines = [text]

    # Redraw on final composited image
    draw = ImageDraw.Draw(img)
    _draw_centered_text(draw, lines, font, text_color, 0, CARD_HEIGHT)


def _render_social_post(img: Image.Image, draw: ImageDraw.ImageDraw, text: str) -> None:
    """Social Post: card rectangle with decorative accent line."""
    # Dark surface background
    img.paste((20, 20, 30), [0, 0, CARD_WIDTH, CARD_HEIGHT])

    # Card rectangle inset 80px from each edge
    card_left, card_top = 80, 80
    card_right, card_bottom = CARD_WIDTH - 80, CARD_HEIGHT - 80

    # Fill card with lighter color
    draw.rectangle(
        [card_left, card_top, card_right, card_bottom],
        fill=(35, 35, 50),
    )
    # 2px border
    draw.rectangle(
        [card_left, card_top, card_right, card_bottom],
        outline=(80, 80, 120),
        width=2,
    )

    # Decorative line centered above text block
    accent_color = (100, 130, 255)
    line_width_px = 60
    line_x = (CARD_WIDTH - line_width_px) // 2
    line_y = card_top + 40
    draw.rectangle(
        [line_x, line_y, line_x + line_width_px, line_y + 4],
        fill=accent_color,
    )

    # Text inside card area
    lines = textwrap.wrap(text, width=35)
    font = _load_font(48)
    text_color = (255, 255, 255)

    # Text area starts below decorative line
    text_top = line_y + 20
    _draw_centered_text(draw, lines, font, text_color, text_top, card_bottom - 20)


def _render_general(img: Image.Image, draw: ImageDraw.ImageDraw, text: str) -> None:
    """General: centered text on solid dark background."""
    img.paste((18, 18, 24), [0, 0, CARD_WIDTH, CARD_HEIGHT])

    lines = textwrap.wrap(text, width=32)
    font = _load_font(56)
    text_color = (220, 220, 230)

    _draw_centered_text(draw, lines, font, text_color, 0, CARD_HEIGHT)


_RENDERERS = {
    "billboard": _render_billboard,
    "social_post": _render_social_post,
    "general": _render_general,
}


def render_text_card(text: str, style: str, job_id: str) -> Path:
    """Render text as a styled 1280x720 PNG image card.

    Args:
        text: User text content (up to 500 chars).
        style: Template name - "billboard", "social_post", or "general".
        job_id: RunPod job ID for temp file naming.

    Returns:
        Path to the saved PNG at /tmp/card_{job_id}.png.
    """
    # Default to general for unknown styles
    renderer = _RENDERERS.get(style, _render_general)

    img = Image.new("RGB", (CARD_WIDTH, CARD_HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)

    renderer(img, draw, text[:500])

    output_path = Path(f"/tmp/card_{job_id}.png")
    img.save(output_path, "PNG")

    logger.info(
        "Job %s: rendered text card (style=%s, %d chars) to %s",
        job_id, style, len(text), output_path,
    )
    return output_path
