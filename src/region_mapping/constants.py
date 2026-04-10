"""
Output format constants for TRIBE v2 predictions.

All values sourced from Phase 1 validation (docs/model_output_format.md, docs/inference_output.json).
Validated on NVIDIA A40, Sintel trailer 60s.
"""

# Cortical surface mesh dimensions (fsaverage5)
N_VERTICES: int = 20484
HEMISPHERE_SIZE: int = 10242

# Temporal parameters
HRF_DELAY_S: int = 5  # Hemodynamic response peak delay in seconds
SEGMENT_DURATION_S: float = 1.0  # Each segment is 1 second

# Data type
DTYPE: str = "float32"

# Measured value range from Phase 1 inference (Sintel trailer)
VALUE_RANGE_MIN: float = -1.48
VALUE_RANGE_MAX: float = 1.80

# Target brain regions for NeuroCut (9 functional networks)
NEUROCUT_REGIONS: list = [
    "attention",
    "reward",
    "emotional_processing",
    "social_cognition",
    "visual_processing",
    "auditory_processing",
    "language_narrative",
    "default_mode",
    "motion_processing",
]
