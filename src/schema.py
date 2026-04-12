"""
Input/output contract for the RunPod handler.

Defines Pydantic v2 models for:
- InputSchema: validated job input (video_url + options)
- OutputSchema: full inference response (segments, summary, raw shape)
- ErrorResponse: structured error reporting

These models are the contract that handler.py (Phase 6 Plan 02) and
the inference/postprocessor pipeline (Phase 7) build against.
"""

from __future__ import annotations

from typing import Literal, Optional
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class InputSchema(BaseModel):
    """Validated input from RunPod job queue.

    Supports video (default), image, text_spoken, and text_visual input types.
    video_url is required for video and image types.
    text_content is required for text_spoken and text_visual types.
    """

    model_config = ConfigDict(strict=False)

    video_url: Optional[str] = None
    include_raw: bool = False
    include_vertex_data: bool = True

    # Multi-modal fields
    input_type: Literal["video", "image", "text_spoken", "text_visual"] = "video"
    text_content: Optional[str] = None
    text_style: Optional[str] = None

    @field_validator("video_url")
    @classmethod
    def validate_video_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v or not v.strip():
            raise ValueError("video_url must not be empty")
        parsed = urlparse(v)
        if parsed.scheme not in ("http", "https"):
            raise ValueError(
                f"video_url must use http or https scheme, got '{parsed.scheme}'"
            )
        return v

    @model_validator(mode="after")
    def validate_input_combination(self) -> "InputSchema":
        if self.input_type == "video" and not self.video_url:
            raise ValueError("video_url required for video input")
        if self.input_type == "image" and not self.video_url:
            raise ValueError("video_url (media URL) required for image input")
        if self.input_type in ("text_spoken", "text_visual") and not self.text_content:
            raise ValueError("text_content required for text input")
        return self


class RegionScores(BaseModel):
    """Per-region brain activation scores for a segment."""

    model_config = ConfigDict(strict=False)

    attention: float
    reward: float
    emotional_processing: float
    social_cognition: float
    # New networks (Phase 33) -- default 0.0 for backward compatibility
    visual_processing: float = 0.0
    auditory_processing: float = 0.0
    language_narrative: float = 0.0
    default_mode: float = 0.0
    motion_processing: float = 0.0


class Segment(BaseModel):
    """A time window with activation scores and region breakdown."""

    model_config = ConfigDict(strict=False)

    start: float
    end: float
    activation_score: float
    arousal: float
    valence: float
    regions: RegionScores
    vertex_data: Optional[str] = None


class Summary(BaseModel):
    """Aggregate metrics across all segments."""

    model_config = ConfigDict(strict=False)

    overall: float
    hook_score: float
    retention_score: float
    peak_second: float
    peak_score: float


class OutputSchema(BaseModel):
    """Full inference response returned by the handler."""

    model_config = ConfigDict(strict=False)

    video_url: str
    duration_seconds: float
    segments: list[Segment]
    summary: Summary
    raw_shape: list[int]


class ErrorResponse(BaseModel):
    """Structured error returned when inference fails."""

    model_config = ConfigDict(strict=False)

    error: str
    error_type: Literal["validation", "download", "inference", "unknown"]
