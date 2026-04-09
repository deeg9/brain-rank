"""Tests for src/postprocessor.py -- raw predictions to OutputSchema mapper."""

import logging
import sys
import os
from types import SimpleNamespace

import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from postprocessor import postprocess
from schema import OutputSchema, Segment, RegionScores, Summary


@pytest.fixture
def synthetic_predictions():
    """12 segments of TRIBE v2 output -> 7 aligned after HRF drop -> 3 full + 1 trailing window."""
    rng = np.random.default_rng(42)
    return rng.uniform(-1.48, 1.80, (12, 20484)).astype(np.float32)


@pytest.fixture
def synthetic_segments():
    """12 mock TRIBE segments (1 second each)."""
    return [SimpleNamespace(start=float(i), duration=1.0) for i in range(12)]


class TestPostprocess:
    """Tests for the postprocess function."""

    def test_returns_output_schema(self, synthetic_predictions, synthetic_segments):
        """postprocess returns a valid OutputSchema instance."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-1",
        )
        assert isinstance(result, OutputSchema)

    def test_correct_number_of_segments(self, synthetic_predictions, synthetic_segments):
        """12 raw -> 7 aligned -> 3 full windows + 1 trailing = 4 output segments."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-2",
        )
        # 12 - 5 (HRF) = 7 aligned; 7 // 2 = 3 full + 7 % 2 = 1 trailing = 4
        assert len(result.segments) == 4

    def test_segment_timestamps_sequential(self, synthetic_predictions, synthetic_segments):
        """Segment timestamps should be sequential and non-overlapping."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-3",
        )
        segments = result.segments
        # Check sequential: [0,2), [2,4), [4,6), [6,7)
        assert segments[0].start == pytest.approx(0.0)
        assert segments[0].end == pytest.approx(2.0)
        assert segments[1].start == pytest.approx(2.0)
        assert segments[1].end == pytest.approx(4.0)
        assert segments[2].start == pytest.approx(4.0)
        assert segments[2].end == pytest.approx(6.0)
        # Trailing odd segment is 1 second
        assert segments[3].start == pytest.approx(6.0)
        assert segments[3].end == pytest.approx(7.0)

    def test_raw_shape_is_original(self, synthetic_predictions, synthetic_segments):
        """raw_shape reflects original prediction shape, not aligned."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-4",
        )
        assert result.raw_shape == [12, 20484]

    def test_duration_from_original_segments(self, synthetic_predictions, synthetic_segments):
        """duration_seconds = len(segments) * SEGMENT_DURATION_S."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-5",
        )
        assert result.duration_seconds == pytest.approx(12.0)

    def test_summary_overall_equals_mean_of_activations(
        self, synthetic_predictions, synthetic_segments
    ):
        """Summary.overall = mean of all segment activation_scores."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-6",
        )
        activations = [s.activation_score for s in result.segments]
        expected_overall = float(np.mean(activations))
        assert result.summary.overall == pytest.approx(expected_overall, rel=1e-4)

    def test_summary_hook_score(self, synthetic_predictions, synthetic_segments):
        """hook_score = mean of first 5 segments (or all if fewer)."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-7",
        )
        activations = [s.activation_score for s in result.segments]
        # Only 4 segments total, so hook_score = mean of all 4
        expected_hook = float(np.mean(activations[:5]))
        assert result.summary.hook_score == pytest.approx(expected_hook, rel=1e-4)

    def test_summary_peak(self, synthetic_predictions, synthetic_segments):
        """peak_second = start of highest activation segment, peak_score = that score."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-8",
        )
        segments = result.segments
        peak_seg = max(segments, key=lambda s: s.activation_score)
        assert result.summary.peak_second == pytest.approx(peak_seg.start)
        assert result.summary.peak_score == pytest.approx(peak_seg.activation_score)

    def test_segment_region_scores_are_floats(self, synthetic_predictions, synthetic_segments):
        """Each segment has RegionScores with float values."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-9",
        )
        for seg in result.segments:
            assert isinstance(seg.regions, RegionScores)
            assert isinstance(seg.regions.attention, float)
            assert isinstance(seg.regions.reward, float)
            assert isinstance(seg.regions.emotional_processing, float)
            assert isinstance(seg.regions.social_cognition, float)

    def test_video_url_passthrough(self, synthetic_predictions, synthetic_segments):
        """video_url is passed through to output."""
        url = "https://example.com/video.mp4"
        result = postprocess(
            synthetic_predictions, synthetic_segments, url, "test-job-10"
        )
        assert result.video_url == url

    def test_logging_includes_job_id(self, synthetic_predictions, synthetic_segments, caplog):
        """Log messages include job_id."""
        with caplog.at_level(logging.DEBUG, logger="neurocut.postprocessor"):
            postprocess(
                synthetic_predictions,
                synthetic_segments,
                "https://example.com/video.mp4",
                "test-job-log",
            )
        job_messages = [r for r in caplog.records if "test-job-log" in r.message]
        assert len(job_messages) >= 1

    def test_even_aligned_segments_no_trailing(self):
        """Even number of aligned segments produces no trailing 1-second window."""
        rng = np.random.default_rng(99)
        # 11 raw -> 6 aligned -> 3 full windows, no trailing
        preds = rng.uniform(-1.0, 1.0, (11, 20484)).astype(np.float32)
        segs = [SimpleNamespace(start=float(i), duration=1.0) for i in range(11)]
        result = postprocess(preds, segs, "https://example.com/v.mp4", "test-even")
        assert len(result.segments) == 3
        # All segments should be 2 seconds
        for seg in result.segments:
            assert seg.end - seg.start == pytest.approx(2.0)
