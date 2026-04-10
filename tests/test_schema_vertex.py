"""Tests for vertex_data schema additions."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.schema import Segment, InputSchema, RegionScores


def _make_region_scores(**overrides):
    defaults = dict(
        attention=0.5,
        reward=0.5,
        emotional_processing=0.5,
        social_cognition=0.5,
    )
    defaults.update(overrides)
    return RegionScores(**defaults)


class TestSegmentVertexData:
    """Tests for the optional vertex_data field on Segment."""

    def test_segment_without_vertex_data_defaults_to_none(self):
        """Backward compat: vertex_data defaults to None when not provided."""
        seg = Segment(
            start=0, end=2, activation_score=0.5,
            arousal=0.3, valence=0.4, regions=_make_region_scores(),
        )
        assert seg.vertex_data is None

    def test_segment_with_vertex_data_string(self):
        """vertex_data can be set to a base64 string."""
        seg = Segment(
            start=0, end=2, activation_score=0.5,
            arousal=0.3, valence=0.4, regions=_make_region_scores(),
            vertex_data="abc123base64==",
        )
        assert seg.vertex_data == "abc123base64=="

    def test_model_dump_excludes_vertex_data_when_none(self):
        """When vertex_data is None, model_dump still works (field present but None)."""
        seg = Segment(
            start=0, end=2, activation_score=0.5,
            arousal=0.3, valence=0.4, regions=_make_region_scores(),
        )
        dumped = seg.model_dump()
        assert "vertex_data" in dumped
        assert dumped["vertex_data"] is None


class TestInputSchemaVertexFlag:
    """Tests for the include_vertex_data flag on InputSchema."""

    def test_include_vertex_data_defaults_to_true(self):
        """include_vertex_data defaults to True."""
        schema = InputSchema(video_url="https://example.com/v.mp4")
        assert schema.include_vertex_data is True

    def test_include_vertex_data_false(self):
        """include_vertex_data=False validates successfully."""
        schema = InputSchema(
            video_url="https://example.com/v.mp4",
            include_vertex_data=False,
        )
        assert schema.include_vertex_data is False
