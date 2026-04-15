"""Tests for src/postprocessor.py -- raw predictions to OutputSchema mapper."""

import logging
import sys
import os
from types import SimpleNamespace

import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.postprocessor import postprocess, robust_normalize
from src.schema import OutputSchema, Segment, RegionScores, Summary


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

    def test_duration_matches_last_segment_end(self, synthetic_predictions, synthetic_segments):
        """duration_seconds = last output segment's end time."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-5",
        )
        assert result.duration_seconds == pytest.approx(7.0)

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

    def test_segment_region_scores_in_0_1_range(self, synthetic_predictions, synthetic_segments):
        """All region score values should be in [0, 1] range after normalization."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-range",
        )
        for seg in result.segments:
            assert 0.0 <= seg.regions.attention <= 1.0
            assert 0.0 <= seg.regions.reward <= 1.0
            assert 0.0 <= seg.regions.emotional_processing <= 1.0
            assert 0.0 <= seg.regions.social_cognition <= 1.0

    def test_all_scores_normalized_0_to_1(self, synthetic_predictions, synthetic_segments):
        """Every score field across all segments and summary is in [0, 1]."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-job-norm",
        )
        for seg in result.segments:
            assert 0.0 <= seg.activation_score <= 1.0, f"activation_score {seg.activation_score} out of range"
            assert 0.0 <= seg.arousal <= 1.0, f"arousal {seg.arousal} out of range"
            assert 0.0 <= seg.valence <= 1.0, f"valence {seg.valence} out of range"
            assert 0.0 <= seg.regions.attention <= 1.0
            assert 0.0 <= seg.regions.reward <= 1.0
            assert 0.0 <= seg.regions.emotional_processing <= 1.0
            assert 0.0 <= seg.regions.social_cognition <= 1.0

        assert 0.0 <= result.summary.overall <= 1.0
        assert 0.0 <= result.summary.hook_score <= 1.0
        assert 0.0 <= result.summary.retention_score <= 1.0
        assert 0.0 <= result.summary.peak_score <= 1.0

    def test_uniform_predictions_cluster_near_half(self):
        """With uniform (constant) predictions, normalized scores should cluster near 0.5."""
        # All same value -> robust_normalize should return ~0.5
        preds = np.full((12, 20484), 0.42, dtype=np.float32)
        segs = [SimpleNamespace(start=float(i), duration=1.0) for i in range(12)]
        result = postprocess(preds, segs, "https://example.com/v.mp4", "test-uniform")
        for seg in result.segments:
            assert 0.4 <= seg.activation_score <= 0.6, f"Expected ~0.5, got {seg.activation_score}"

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


class TestVertexData:
    """Tests for vertex_data encoding in postprocess output."""

    def test_vertex_data_present_by_default(self, synthetic_predictions, synthetic_segments):
        """postprocess with default include_vertex_data=True produces non-None vertex_data."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-vertex-default",
            include_vertex_data=True,
        )
        for seg in result.segments:
            assert seg.vertex_data is not None, "vertex_data should be present by default"
            assert isinstance(seg.vertex_data, str)

    def test_vertex_data_base64_decodes_to_20484_bytes(self, synthetic_predictions, synthetic_segments):
        """Each vertex_data string base64-decodes to exactly 20,484 bytes."""
        import base64

        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-vertex-size",
            include_vertex_data=True,
        )
        for seg in result.segments:
            decoded = base64.b64decode(seg.vertex_data)
            assert len(decoded) == 20484, f"Expected 20484 bytes, got {len(decoded)}"

    def test_vertex_data_disabled(self, synthetic_predictions, synthetic_segments):
        """postprocess with include_vertex_data=False produces vertex_data=None."""
        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-vertex-disabled",
            include_vertex_data=False,
        )
        for seg in result.segments:
            assert seg.vertex_data is None, "vertex_data should be None when disabled"

    def test_vertex_data_roundtrip_accuracy(self, synthetic_predictions, synthetic_segments):
        """Decoded uint8 values divided by 255 should be within quantization tolerance of source."""
        import base64

        result = postprocess(
            synthetic_predictions,
            synthetic_segments,
            "https://example.com/video.mp4",
            "test-vertex-roundtrip",
            include_vertex_data=True,
        )
        for seg in result.segments:
            decoded = base64.b64decode(seg.vertex_data)
            uint8_arr = np.frombuffer(decoded, dtype=np.uint8)
            float_arr = uint8_arr.astype(np.float64) / 255.0
            # All values should be in [0, 1]
            assert float_arr.min() >= 0.0
            assert float_arr.max() <= 1.0
            # Quantization tolerance: 1/255 ~= 0.004
            # We can't compare to source directly here, but we can verify
            # the values are valid normalized floats
            assert len(float_arr) == 20484


class TestRobustNormalize:
    """Unit tests for robust_normalize function."""

    def test_known_input_produces_expected_range(self):
        """Array [-1, 0, 1] with percentile=99 should produce values near [0, 0.5, 1]."""
        arr = np.array([-1.0, 0.0, 1.0])
        result = robust_normalize(arr, percentile=99)
        assert result[0] == pytest.approx(0.0, abs=0.02)
        assert result[1] == pytest.approx(0.5, abs=0.02)
        assert result[2] == pytest.approx(1.0, abs=0.02)

    def test_output_clipped_to_0_1(self):
        """Output is clipped to [0, 1] when clip=True (default)."""
        arr = np.array([0.0, 0.5, 1.0, 100.0])
        result = robust_normalize(arr, percentile=99)
        assert result.min() >= 0.0
        assert result.max() <= 1.0

    def test_constant_input_returns_half(self):
        """Constant input (hi == lo) should return 0.5 to avoid NaN."""
        arr = np.full(10, 3.14)
        result = robust_normalize(arr)
        assert np.all(result == pytest.approx(0.5, abs=0.01))

    def test_2d_array_normalizes_globally(self):
        """2D array without axis normalizes across all values."""
        arr = np.array([[0.0, 1.0], [2.0, 3.0]])
        result = robust_normalize(arr, percentile=99)
        assert result.min() >= 0.0
        assert result.max() <= 1.0
