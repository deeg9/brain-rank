"""Region mapping module: converts TRIBE v2 cortical vertex output to per-region scores."""
from .constants import N_VERTICES, HEMISPHERE_SIZE, HRF_DELAY_S, SEGMENT_DURATION_S
from .regions import REGION_DEFINITIONS
from .atlas import build_region_masks
from .scoring import compute_region_scores
from .temporal import align_to_stimulus
