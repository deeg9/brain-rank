"""Tests for src/inference.py -- TRIBE v2 inference wrapper."""

import logging
from types import SimpleNamespace
from unittest.mock import MagicMock

import numpy as np
import pandas as pd
import pytest

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from inference import run_inference


@pytest.fixture
def mock_model():
    """Create a mock TribeModel that returns numpy predictions."""
    model = MagicMock()
    # get_events_dataframe returns a DataFrame
    model.get_events_dataframe.return_value = pd.DataFrame({
        "type": ["Audio", "Video"],
        "start": [0.0, 0.0],
        "duration": [60.0, 60.0],
        "filepath": ["/tmp/audio.wav", "/tmp/video.mp4"],
        "frequency": [44100, 24],
    })
    # predict returns (numpy array, list of segments)
    preds = np.random.randn(5, 20484).astype(np.float32)
    segments = [
        SimpleNamespace(start=float(i), duration=1.0)
        for i in range(5)
    ]
    model.predict.return_value = (preds, segments)
    return model


@pytest.fixture
def mock_model_torch_tensor():
    """Create a mock TribeModel that returns a torch-like tensor."""
    model = MagicMock()
    model.get_events_dataframe.return_value = pd.DataFrame({
        "type": ["Audio"],
        "start": [0.0],
        "duration": [10.0],
        "filepath": ["/tmp/audio.wav"],
        "frequency": [44100],
    })

    # Create an object that behaves like a torch tensor (has .detach().cpu().numpy())
    class FakeTensor:
        def __init__(self, data):
            self._data = data
            self.shape = data.shape

        def detach(self):
            return self

        def cpu(self):
            return self

        def numpy(self):
            return self._data

    fake_preds = FakeTensor(np.random.randn(3, 20484).astype(np.float32))
    segments = [SimpleNamespace(start=float(i), duration=1.0) for i in range(3)]
    model.predict.return_value = (fake_preds, segments)
    return model


class TestRunInference:
    """Tests for the run_inference function."""

    def test_returns_correct_tuple_structure(self, mock_model):
        """run_inference returns (ndarray, list, dict)."""
        result = run_inference(mock_model, "/tmp/video.mp4", "test-job-1")

        assert isinstance(result, tuple)
        assert len(result) == 3

        preds, segments, timing = result
        assert isinstance(preds, np.ndarray)
        assert isinstance(segments, list)
        assert isinstance(timing, dict)

    def test_predictions_shape(self, mock_model):
        """Predictions maintain expected shape."""
        preds, segments, timing = run_inference(mock_model, "/tmp/video.mp4", "test-job-2")
        assert preds.shape == (5, 20484)

    def test_timing_dict_keys(self, mock_model):
        """Timing dict contains expected keys as floats."""
        _, _, timing = run_inference(mock_model, "/tmp/video.mp4", "test-job-3")
        assert "events_extract_s" in timing
        assert "inference_s" in timing
        assert isinstance(timing["events_extract_s"], float)
        assert isinstance(timing["inference_s"], float)

    def test_torch_tensor_converted_to_numpy(self, mock_model_torch_tensor):
        """Torch tensor predictions are converted to numpy ndarray."""
        preds, _, _ = run_inference(mock_model_torch_tensor, "/tmp/video.mp4", "test-job-4")
        assert isinstance(preds, np.ndarray)
        assert preds.shape == (3, 20484)

    def test_model_api_calls(self, mock_model):
        """Model methods are called with correct arguments."""
        run_inference(mock_model, "/tmp/video.mp4", "test-job-5")

        mock_model.get_events_dataframe.assert_called_once_with(video_path="/tmp/video.mp4")
        mock_model.predict.assert_called_once()
        # Verify events df was passed to predict
        call_kwargs = mock_model.predict.call_args
        assert "events" in call_kwargs.kwargs or len(call_kwargs.args) > 0

    def test_logging_includes_job_id(self, mock_model, caplog):
        """All log messages include the job_id."""
        with caplog.at_level(logging.DEBUG, logger="neurocut.inference"):
            run_inference(mock_model, "/tmp/video.mp4", "test-job-log")

        # Should have at least 3 log messages with job_id
        job_messages = [r for r in caplog.records if "test-job-log" in r.message]
        assert len(job_messages) >= 3, (
            f"Expected at least 3 log messages with job_id, got {len(job_messages)}: "
            f"{[r.message for r in caplog.records]}"
        )

    def test_exception_propagates(self, mock_model):
        """If model.predict raises, exception propagates."""
        mock_model.predict.side_effect = RuntimeError("GPU OOM")
        with pytest.raises(RuntimeError, match="GPU OOM"):
            run_inference(mock_model, "/tmp/video.mp4", "test-job-err")

    def test_no_torch_import_at_module_level(self):
        """inference.py does not import torch at module level."""
        import inference
        import importlib
        # Re-check the module's source for 'import torch' at top level
        import inspect
        source = inspect.getsource(inference)
        lines = source.split("\n")
        for line in lines:
            stripped = line.strip()
            # Skip comments and lines inside functions/methods
            if stripped.startswith("#"):
                continue
            # Only check top-level imports (no indentation)
            if not line.startswith(" ") and not line.startswith("\t"):
                if stripped.startswith("import torch") or stripped.startswith("from torch"):
                    pytest.fail(f"Found torch import at module level: {stripped}")
