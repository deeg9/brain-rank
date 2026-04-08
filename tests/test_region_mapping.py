"""Tests for region_mapping module."""
import numpy as np
import pytest


# --- Task 1: Constants tests ---

def test_output_constants():
    """MODL-03: Output format constants match Phase 1 documented values."""
    from region_mapping.constants import (
        N_VERTICES, HEMISPHERE_SIZE, HRF_DELAY_S, SEGMENT_DURATION_S,
    )
    assert N_VERTICES == 20484
    assert HEMISPHERE_SIZE == 10242
    assert HRF_DELAY_S == 5
    assert SEGMENT_DURATION_S == 1.0


def test_value_range():
    """MODL-03: Value range constants match Phase 1 measured output."""
    from region_mapping.constants import VALUE_RANGE_MIN, VALUE_RANGE_MAX
    assert abs(VALUE_RANGE_MIN - (-1.48)) < 0.01
    assert abs(VALUE_RANGE_MAX - 1.80) < 0.01
