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

from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, field_validator


class InputSchema(BaseModel):
    """Validated input from RunPod job queue.

    video_url must be a non-empty HTTP(S) URL. Uses str type (not HttpUrl)
    to avoid serialization issues with RunPod's dict-based input.
    """

    model_config = ConfigDict(strict=False)

    video_url: str
    include_raw: bool = False

    @field_validator("video_url")
    @classmethod
    def validate_video_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("video_url must not be empty")
        parsed = urlparse(v)
        if parsed.scheme not in ("http", "https"):
            raise ValueError(
                f"video_url must use http or https scheme, got '{parsed.scheme}'"
            )
        return v


class RegionScores(BaseModel):
    """Per-region brain activation scores for a segment."""

    model_config = ConfigDict(strict=False)

    attention: float
    reward: float
    emotional_processing: float
    social_cognition: float


class Segment(BaseModel):
    """A time window with activation scores and region breakdown."""

    model_config = ConfigDict(strict=False)

    start: float
    end: float
    activation_score: float
    arousal: float
    valence: float
    regions: RegionScores


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
