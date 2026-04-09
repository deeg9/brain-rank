"""Tests for src/handler.py -- RunPod serverless handler with full pipeline.

handler.py has module-level side effects:
  - imports runpod (not installed in test env)
  - calls get_model() at module level
  - calls runpod.serverless.start() at module level

We mock these before importing the handler module.
"""

import sys
import os
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

# Pre-mock modules with module-level side effects BEFORE importing handler.
# handler.py imports runpod (not installed) and calls get_model() at module level
# which tries to import tribev2 (not installed). We replace both modules.
sys.modules["runpod"] = MagicMock()

_mock_model = MagicMock()
_mock_model_loader = MagicMock()
_mock_model_loader.get_model = MagicMock(return_value=_mock_model)
sys.modules["model_loader"] = _mock_model_loader
# Also mock src.model_loader for the `from src.model_loader import get_model` path
sys.modules["src.model_loader"] = _mock_model_loader

from schema import OutputSchema, Segment, RegionScores, Summary

# Force reimport if cached
if "handler" in sys.modules:
    del sys.modules["handler"]
import handler as handler_module

# Get the handler function
handler_fn = handler_module.handler


def _make_output_schema(video_url="https://example.com/video.mp4"):
    """Build a valid OutputSchema for test mocking."""
    seg = Segment(
        start=0.0,
        end=2.0,
        activation_score=0.5,
        arousal=0.4,
        valence=0.6,
        regions=RegionScores(
            attention=0.5,
            reward=0.6,
            emotional_processing=0.3,
            social_cognition=0.6,
        ),
    )
    summary = Summary(
        overall=0.5,
        hook_score=0.5,
        retention_score=0.5,
        peak_second=0.0,
        peak_score=0.5,
    )
    return OutputSchema(
        video_url=video_url,
        duration_seconds=60.0,
        segments=[seg],
        summary=summary,
        raw_shape=[61, 20484],
    )


@pytest.fixture
def mock_job():
    """Standard valid RunPod job."""
    return {
        "id": "test-job-123",
        "input": {"video_url": "https://example.com/video.mp4"},
    }


class TestHandlerSuccess:
    """Test the happy path: validate -> download -> infer -> postprocess -> return."""

    @patch.object(handler_module, "postprocess")
    @patch.object(handler_module, "run_inference")
    @patch.object(handler_module, "download_video")
    def test_success_returns_output_schema_dict(
        self, mock_download, mock_infer, mock_postproc, mock_job, tmp_path
    ):
        video_path = tmp_path / "video.mp4"
        video_path.write_bytes(b"fake")
        mock_download.return_value = video_path

        preds = np.zeros((10, 20484))
        segments = [SimpleNamespace(start=float(i), duration=1.0) for i in range(10)]
        timing = {"events_extract_s": 1.0, "inference_s": 5.0}
        mock_infer.return_value = (preds, segments, timing)

        output = _make_output_schema()
        mock_postproc.return_value = output

        result = handler_fn(mock_job)

        assert isinstance(result, dict)
        assert "video_url" in result
        assert "segments" in result
        assert "summary" in result
        assert "raw_shape" in result
        assert result["video_url"] == "https://example.com/video.mp4"

    @patch.object(handler_module, "postprocess")
    @patch.object(handler_module, "run_inference")
    @patch.object(handler_module, "download_video")
    def test_success_calls_run_inference(
        self, mock_download, mock_infer, mock_postproc, mock_job, tmp_path
    ):
        video_path = tmp_path / "video.mp4"
        video_path.write_bytes(b"fake")
        mock_download.return_value = video_path

        preds = np.zeros((10, 20484))
        segments = [SimpleNamespace(start=float(i), duration=1.0) for i in range(10)]
        mock_infer.return_value = (preds, segments, {"events_extract_s": 1.0, "inference_s": 5.0})
        mock_postproc.return_value = _make_output_schema()

        handler_fn(mock_job)
        mock_infer.assert_called_once()

    @patch.object(handler_module, "postprocess")
    @patch.object(handler_module, "run_inference")
    @patch.object(handler_module, "download_video")
    def test_success_calls_postprocess(
        self, mock_download, mock_infer, mock_postproc, mock_job, tmp_path
    ):
        video_path = tmp_path / "video.mp4"
        video_path.write_bytes(b"fake")
        mock_download.return_value = video_path

        preds = np.zeros((10, 20484))
        segments = [SimpleNamespace(start=float(i), duration=1.0) for i in range(10)]
        mock_infer.return_value = (preds, segments, {"events_extract_s": 1.0, "inference_s": 5.0})
        mock_postproc.return_value = _make_output_schema()

        handler_fn(mock_job)
        mock_postproc.assert_called_once()


class TestHandlerErrors:
    """Test all error paths return structured ErrorResponse."""

    def test_validation_error_bad_input(self):
        result = handler_fn({"id": "test-job-bad", "input": {"video_url": "not-a-url"}})
        assert isinstance(result, dict)
        assert result["error_type"] == "validation"
        assert "error" in result

    @patch.object(handler_module, "download_video")
    def test_download_error_returns_download_type(self, mock_download):
        import requests as req

        mock_download.side_effect = req.exceptions.RequestException("Connection failed")

        result = handler_fn({"id": "test-dl-err", "input": {"video_url": "https://example.com/video.mp4"}})
        assert result["error_type"] == "download"
        assert "Download failed" in result["error"]

    @patch.object(handler_module, "run_inference")
    @patch.object(handler_module, "download_video")
    def test_inference_error_returns_inference_type(
        self, mock_download, mock_infer, tmp_path
    ):
        video_path = tmp_path / "video.mp4"
        video_path.write_bytes(b"fake")
        mock_download.return_value = video_path

        mock_infer.side_effect = RuntimeError("CUDA out of memory")

        result = handler_fn({"id": "test-infer-err", "input": {"video_url": "https://example.com/video.mp4"}})
        assert result["error_type"] == "inference"

    @patch.object(handler_module, "postprocess")
    @patch.object(handler_module, "run_inference")
    @patch.object(handler_module, "download_video")
    def test_postprocess_error_returns_inference_type(
        self, mock_download, mock_infer, mock_postproc, tmp_path
    ):
        video_path = tmp_path / "video.mp4"
        video_path.write_bytes(b"fake")
        mock_download.return_value = video_path

        preds = np.zeros((10, 20484))
        segments = [SimpleNamespace(start=float(i), duration=1.0) for i in range(10)]
        mock_infer.return_value = (preds, segments, {"events_extract_s": 1.0, "inference_s": 5.0})
        mock_postproc.side_effect = ValueError("Bad prediction shape")

        result = handler_fn({"id": "test-pp-err", "input": {"video_url": "https://example.com/video.mp4"}})
        assert result["error_type"] == "inference"


class TestHandlerCleanup:
    """Test temp file cleanup on all code paths."""

    @patch.object(handler_module, "postprocess")
    @patch.object(handler_module, "run_inference")
    @patch.object(handler_module, "download_video")
    def test_cleanup_on_success(
        self, mock_download, mock_infer, mock_postproc, tmp_path
    ):
        video_path = tmp_path / "video.mp4"
        video_path.write_bytes(b"fake")
        mock_download.return_value = video_path

        preds = np.zeros((10, 20484))
        segments = [SimpleNamespace(start=float(i), duration=1.0) for i in range(10)]
        mock_infer.return_value = (preds, segments, {"events_extract_s": 1.0, "inference_s": 5.0})
        mock_postproc.return_value = _make_output_schema()

        handler_fn({"id": "test-cleanup-ok", "input": {"video_url": "https://example.com/video.mp4"}})
        assert not video_path.exists(), "Video file should be cleaned up after success"

    @patch.object(handler_module, "run_inference")
    @patch.object(handler_module, "download_video")
    def test_cleanup_on_inference_error(
        self, mock_download, mock_infer, tmp_path
    ):
        video_path = tmp_path / "video.mp4"
        video_path.write_bytes(b"fake")
        mock_download.return_value = video_path

        mock_infer.side_effect = RuntimeError("CUDA error")

        handler_fn({"id": "test-cleanup-err", "input": {"video_url": "https://example.com/video.mp4"}})
        assert not video_path.exists(), "Video file should be cleaned up after inference error"

    @patch.object(handler_module, "download_video")
    def test_cleanup_on_download_error(self, mock_download):
        import requests as req

        mock_download.side_effect = req.exceptions.RequestException("Timeout")

        # No video file created, so just verify no crash
        result = handler_fn({"id": "test-cleanup-dl", "input": {"video_url": "https://example.com/video.mp4"}})
        assert result["error_type"] == "download"


class TestHandlerLogging:
    """Test that every log line includes job_id."""

    @patch.object(handler_module, "postprocess")
    @patch.object(handler_module, "run_inference")
    @patch.object(handler_module, "download_video")
    def test_logs_include_job_id(
        self, mock_download, mock_infer, mock_postproc, tmp_path, caplog
    ):
        video_path = tmp_path / "video.mp4"
        video_path.write_bytes(b"fake")
        mock_download.return_value = video_path

        preds = np.zeros((10, 20484))
        segments = [SimpleNamespace(start=float(i), duration=1.0) for i in range(10)]
        mock_infer.return_value = (preds, segments, {"events_extract_s": 1.0, "inference_s": 5.0})
        mock_postproc.return_value = _make_output_schema()

        with caplog.at_level("INFO", logger="neurocut.handler"):
            handler_fn({"id": "log-test-42", "input": {"video_url": "https://example.com/video.mp4"}})

        handler_logs = [r for r in caplog.records if r.name == "neurocut.handler"]
        for record in handler_logs:
            assert "log-test-42" in record.message, (
                f"Log message missing job_id: {record.message}"
            )
