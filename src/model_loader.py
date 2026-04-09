"""
Singleton loader for TribeModel. Call get_model() at module level in handler.py.

Loads TribeModel.from_pretrained("facebook/tribev2") on first call and caches
the instance for subsequent calls. TribeModel import is deferred to avoid
import errors on machines without GPU/tribev2 installed.

Model load failure is intentionally unhandled -- a broken model should crash
the container at startup rather than silently serving failed requests.
"""

import logging
import time

logger = logging.getLogger(__name__)

_model = None


def get_model():
    """Return the singleton TribeModel instance, loading on first call.

    Uses default HuggingFace cache (respects HF_HOME / TRANSFORMERS_CACHE
    env vars), which works with RunPod network volumes.
    """
    global _model
    if _model is None:
        logger.info("Loading TribeModel...")
        t0 = time.perf_counter()

        from tribev2 import TribeModel

        _model = TribeModel.from_pretrained("facebook/tribev2")

        elapsed = time.perf_counter() - t0
        logger.info("TribeModel loaded in %.1fs", elapsed)

    return _model
