"""Shared test fixtures for region mapping tests."""
import sys
import os
from types import SimpleNamespace

import numpy as np
import pytest

# Add src to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


@pytest.fixture
def mock_predictions():
    """Mock TRIBE v2 predictions: shape (61, 20484), float32, values in documented range."""
    rng = np.random.default_rng(42)
    return rng.uniform(-1.48, 1.80, (61, 20484)).astype(np.float32)


@pytest.fixture
def mock_segments():
    """Mock segment objects: 61 segments, each 1.0 second duration."""
    return [
        SimpleNamespace(start=float(i), duration=1.0)
        for i in range(61)
    ]
