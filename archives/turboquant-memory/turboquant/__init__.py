"""
TurboQuant: 2-bit KV Cache Compression for LLMs

Based on "Online Vector Quantization with Near-optimal Distortion Rate" (ICLR 2026)
https://arxiv.org/abs/2504.19874

Core features:
- Lloyd-Max quantization with Beta distribution codebook
- Precomputed QR rotation matrix (not slow Hadamard transform)
- 2-bit compression with cosine similarity > 0.94
- Triton fused attention kernels for direct computation from compressed indices
- GQA (Grouped Query Attention) support
- No training required, no per-block normalization constants
"""

from turboquant.core import TurboQuantMSE, build_lloyd_max_codebook
from turboquant.kv_cache import patch_dynamic_cache, unpatch_dynamic_cache
from turboquant.attention import FusedAttentionKernel

__version__ = "1.0.0"
__all__ = [
    "TurboQuantMSE",
    "build_lloyd_max_codebook",
    "patch_dynamic_cache",
    "unpatch_dynamic_cache",
    "FusedAttentionKernel",
]
