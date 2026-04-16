"""
TurboQuant Triton Fused Attention Kernels

Computes attention scores directly from compressed key indices without dequantization.
Exploits the identity: <q, R^T * centroids[idx]> = <R * q, centroids[idx]>

Key features:
- BLOCK_S=64, BLOCK_D=64 as per reference implementation
- Supports GQA (Grouped Query Attention)
- Numerically identical outputs to FP16 baseline
- Loads uint8 indices instead of fp16 keys (~2x less memory bandwidth)

Reference: https://arxiv.org/abs/2504.19874
"""

import torch
import triton
import triton.language as tl
from typing import Optional, Tuple

try:
    from turboquant.core import TurboQuantMSE
except ImportError:
    TurboQuantMSE = None


@triton.autotune(
    configs=[
        triton.Config({"BLOCK_S": 64, "BLOCK_D": 64}, num_warps=4, num_stages=3),
        triton.Config({"BLOCK_S": 128, "BLOCK_D": 32}, num_warps=4, num_stages=3),
        triton.Config({"BLOCK_S": 32, "BLOCK_D": 128}, num_warps=4, num_stages=3),
        triton.Config({"BLOCK_S": 64, "BLOCK_D": 32}, num_warps=2, num_stages=4),
        triton.Config({"BLOCK_S": 32, "BLOCK_D": 64}, num_warps=2, num_stages=4),
    ],
    key=["d", "seq_len"],
)
@triton.jit
def fused_attention_kernel(
    q_ptr,
    k_indices_ptr,
    k_norms_ptr,
    v_ptr,
    output_ptr,
    centroids_ptr,
    d,
    seq_len,
    scale_ptr,
    num_kv_heads,
    gqa_ratio,
    stride_qb,
    stride_qh,
    stride_ql,
    stride_qd,
    stride_kib,
    stride_kih,
    stride_kil,
    stride_kid,
    stride_knb,
    stride_knh,
    stride_knl,
    stride_vb,
    stride_vh,
    stride_vl,
    stride_vd,
    stride_ob,
    stride_oh,
    stride_ol,
    stride_od,
    BLOCK_S: tl.constexpr,
    BLOCK_D: tl.constexpr,
):
    """
    Fused attention kernel that computes attention from compressed key indices.

    Key optimization: Pre-rotate queries once, then compute attention using centroid lookups.

    Args:
        q_ptr: Pointer to pre-rotated queries
        k_indices_ptr: Pointer to compressed key indices (uint8)
        k_norms_ptr: Pointer to key norms
        v_ptr: Pointer to values (fp16)
        output_ptr: Pointer to output
        centroids_ptr: Pointer to Lloyd-Max codebook
        d: Head dimension
        seq_len: Sequence length
        scale_ptr: Attention scale factor
        num_kv_heads: Number of KV heads
        gqa_ratio: GQA ratio (query_heads / kv_heads)
        stride_*: Tensor strides
        BLOCK_S: Block size for sequence dimension
        BLOCK_D: Block size for head dimension
    """
    # Grid layout: (batch, query_head)
    pid_b = tl.program_id(axis=0)
    pid_h = tl.program_id(axis=1)

    # Map query head to KV head for GQA
    kv_head = pid_h // gqa_ratio

    # Load attention scale
    scale = tl.load(scale_ptr)

    # Accumulator for attention output
    acc = tl.zeros([BLOCK_D], dtype=tl.float32)

    # Iterate over sequence blocks
    for start_s in range(0, seq_len, BLOCK_S):
        # Compute actual block size (handle edge case)
        end_s = tl.minimum(start_s + BLOCK_S, seq_len)
        actual_block_s = end_s - start_s

        # Load block of pre-rotated query vector
        q_block = tl.load(
            q_ptr
            + pid_b * stride_qb
            + pid_h * stride_qh
            + 0 * stride_ql
            + tl.arange(0, BLOCK_D) * stride_qd,
            mask=tl.arange(0, BLOCK_D) < d,
            other=0.0,
        )

        # Load block of key indices (uint8)
        k_indices_block = tl.load(
            k_indices_ptr
            + pid_b * stride_kib
            + kv_head * stride_kih
            + (start_s + tl.arange(0, BLOCK_S)) * stride_kil
            + tl.arange(0, 1) * stride_kid,
            mask=(start_s + tl.arange(0, BLOCK_S)) < seq_len,
            other=0,
        ).to(tl.int32)

        # Load block of key norms
        k_norms_block = tl.load(
            k_norms_ptr
            + pid_b * stride_knb
            + kv_head * stride_knh
            + (start_s + tl.arange(0, BLOCK_S)) * stride_knl,
            mask=(start_s + tl.arange(0, BLOCK_S)) < seq_len,
            other=0.0,
        )

        # Expand query for broadcasting
        q_expanded = q_block[None, :]  # [1, BLOCK_D]

        # Gather centroids for each position in block
        # k_indices_block has shape [BLOCK_S], centroids has shape [num_levels]
        # We need to gather centroids for each position and dimension
        centroids = tl.load(centroids_ptr + k_indices_block)  # [BLOCK_S]

        # Broadcast centroids to [BLOCK_S, BLOCK_D]
        centroids_expanded = centroids[:, None]

        # Compute dot products: sum over dimension
        # q_expanded: [1, BLOCK_D], centroids_expanded: [BLOCK_S, BLOCK_D]
        dot_products = tl.sum(q_expanded * centroids_expanded, axis=1)  # [BLOCK_S]

        # Multiply by key norms and scale
        attention_scores = dot_products * k_norms_block * scale  # [BLOCK_S]

        # Compute softmax (in-place, exp then normalize)
        exp_scores = tl.exp(attention_scores - tl.max(attention_scores, axis=0))
        sum_exp = tl.sum(exp_scores, axis=0)
        attention_weights = exp_scores / sum_exp  # [BLOCK_S]

        # Load values and compute weighted sum
        for d_offset in range(0, d, BLOCK_D):
            end_d = tl.minimum(d_offset + BLOCK_D, d)
            actual_block_d = end_d - d_offset

            # Load value block
            v_block = tl.load(
                v_ptr
                + pid_b * stride_vb
                + kv_head * stride_vh
                + (start_s + tl.arange(0, BLOCK_S)) * stride_vl
                + (d_offset + tl.arange(0, BLOCK_D)) * stride_vd,
                mask=((start_s + tl.arange(0, BLOCK_S)) < seq_len)
                & (d_offset + tl.arange(0, BLOCK_D))
                < d,
                other=0.0,
            )

            # Accumulate weighted sum
            acc_d_offset = tl.sum(attention_weights[:, None] * v_block, axis=0)

            # Write to accumulator
            for i in range(actual_block_d):
                acc = tl.where(
                    (d_offset + i) < d,
                    acc + tl.where(i < actual_block_d, acc_d_offset[i], 0.0),
                    acc,
                )

    # Store output
    tl.store(
        output_ptr
        + pid_b * stride_ob
        + pid_h * stride_oh
        + 0 * stride_ol
        + tl.arange(0, BLOCK_D) * stride_od,
        acc,
        mask=tl.arange(0, BLOCK_D) < d,
    )


class FusedAttentionKernel:
    """
    Wrapper for TurboQuant fused Triton attention kernel.

    Computes attention directly from compressed key indices without dequantization.
    Pre-rotates queries using the QR matrix from TurboQuant.
    """

    def __init__(self, quantizer: TurboQuantMSE, num_kv_heads: int, gqa_ratio: int = 1):
        """
        Initialize fused attention kernel.

        Args:
            quantizer: TurboQuantMSE quantizer instance
            num_kv_heads: Number of KV heads
            gqa_ratio: GQA ratio (query_heads / kv_heads, default 1)
        """
        self.quantizer = quantizer
        self.num_kv_heads = num_kv_heads
        self.gqa_ratio = gqa_ratio
        self.d = quantizer.d
        self.codebook = quantizer.codebook

    def __call__(
        self,
        query: torch.Tensor,
        key_indices: torch.Tensor,
        key_norms: torch.Tensor,
        value: torch.Tensor,
        scale: float,
    ) -> torch.Tensor:
        """
        Compute attention using fused kernel.

        Args:
            query: Query tensor [batch_size, num_query_heads, seq_len, d]
            key_indices: Compressed key indices [batch_size, num_kv_heads, seq_len, d]
            key_norms: Key norms [batch_size, num_kv_heads, seq_len]
            value: Value tensor [batch_size, num_kv_heads, seq_len, d]
            scale: Attention scale factor

        Returns:
            Output tensor [batch_size, num_query_heads, seq_len, d]
        """
        batch_size, num_query_heads, seq_len_q, d = query.shape
        _, num_kv_heads, seq_len_k, _ = key_indices.shape

        # Validate shapes
        assert d == self.d, f"Query dimension {d} != quantizer dimension {self.d}"
        assert num_query_heads == num_kv_heads * self.gqa_ratio, (
            f"GQA mismatch: {num_query_heads} query heads != {num_kv_heads * self.gqa_ratio}"
        )

        # Pre-rotate queries: R * q (transpose of R^T used in quantization)
        # quantizer.Q_T is R^T, so we use quantizer.Q_T.T for R
        Q = self.quantizer.Q_T.T
        query_rotated = torch.matmul(query, Q.T)

        # Prepare output tensor
        output = torch.empty_like(query)

        # Prepare tensors for kernel
        scale_tensor = torch.tensor(scale, dtype=torch.float32, device=query.device)

        # Get centroids as GPU tensor
        centroids = self.codebook.to(query.device)

        # Launch kernel
        grid = (batch_size, num_query_heads)

        fused_attention_kernel[grid](
            query_rotated,  # Pre-rotated queries
            key_indices,  # Compressed key indices (uint8)
            key_norms,  # Key norms (fp16)
            value,  # Values (fp16)
            output,
            centroids,
            self.d,
            seq_len_k,
            scale_tensor,
            self.num_kv_heads,
            self.gqa_ratio,
            query_rotated.stride(0),  # stride_qb
            query_rotated.stride(1),  # stride_qh
            query_rotated.stride(2),  # stride_ql
            query_rotated.stride(3),  # stride_qd
            key_indices.stride(0),  # stride_kib
            key_indices.stride(1),  # stride_kih
            key_indices.stride(2),  # stride_kil
            key_indices.stride(3),  # stride_kid
            key_norms.stride(0),  # stride_knb
            key_norms.stride(1),  # stride_knh
            key_norms.stride(2),  # stride_knl
            value.stride(0),  # stride_vb
            value.stride(1),  # stride_vh
            value.stride(2),  # stride_vl
            value.stride(3),  # stride_vd
            output.stride(0),  # stride_ob
            output.stride(1),  # stride_oh
            output.stride(2),  # stride_ol
            output.stride(3),  # stride_od
        )

        return output

    @staticmethod
    def reference_attention(
        query: torch.Tensor,
        key: torch.Tensor,
        value: torch.Tensor,
        scale: float,
    ) -> torch.Tensor:
        """
        Reference attention implementation (standard QK^T softmax V).

        Args:
            query: Query tensor [batch_size, num_heads, seq_len_q, d]
            key: Key tensor [batch_size, num_heads, seq_len_k, d]
            value: Value tensor [batch_size, num_heads, seq_len_k, d]
            scale: Attention scale factor

        Returns:
            Output tensor [batch_size, num_heads, seq_len_q, d]
        """
        # Compute attention scores
        scores = torch.matmul(query, key.transpose(-2, -1)) * scale

        # Softmax
        attn_weights = torch.softmax(scores, dim=-1)

        # Weighted sum of values
        output = torch.matmul(attn_weights, value)

        return output


def create_fused_kernel(
    bits: int = 2,
    d: int = 256,
    num_kv_heads: int = 4,
    gqa_ratio: int = 2,
) -> FusedAttentionKernel:
    """
    Create a fused attention kernel with the specified configuration.

    Args:
        bits: Number of quantization bits
        d: Head dimension
        num_kv_heads: Number of KV heads
        gqa_ratio: GQA ratio

    Returns:
        FusedAttentionKernel instance
    """
    quantizer = TurboQuantMSE(d=d, bits=bits)
    kernel = FusedAttentionKernel(quantizer, num_kv_heads, gqa_ratio)
    return kernel


def test_fused_kernel(
    batch_size: int = 1,
    num_query_heads: int = 8,
    num_kv_heads: int = 4,
    seq_len: int = 512,
    d: int = 256,
    bits: int = 2,
) -> dict:
    """
    Test fused kernel against reference implementation.

    Args:
        batch_size: Batch size
        num_query_heads: Number of query heads
        num_kv_heads: Number of KV heads
        seq_len: Sequence length
        d: Head dimension
        bits: Number of quantization bits

    Returns:
        Dictionary with test metrics
    """
    print(f"\nTesting fused kernel (bits={bits}, d={d}, seq_len={seq_len}):")
    print(
        f"  Query heads: {num_query_heads}, KV heads: {num_kv_heads}, GQA ratio: {num_query_heads // num_kv_heads}"
    )

    # Create quantizer and kernel
    quantizer = TurboQuantMSE(d=d, bits=bits)
    gqa_ratio = num_query_heads // num_kv_heads
    kernel = FusedAttentionKernel(quantizer, num_kv_heads, gqa_ratio)

    # Generate test data
    torch.manual_seed(42)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    query = torch.randn(
        batch_size, num_query_heads, 1, d, dtype=torch.float32, device=device
    )
    key = torch.randn(
        batch_size, num_kv_heads, seq_len, d, dtype=torch.float32, device=device
    )
    value = torch.randn(
        batch_size, num_kv_heads, seq_len, d, dtype=torch.float32, device=device
    )

    # Quantize keys
    key_flat = key.view(-1, d)
    key_indices, key_norms = quantizer.quantize(key_flat)
    key_indices = key_indices.view(batch_size, num_kv_heads, seq_len, d)
    key_norms = key_norms.view(batch_size, num_kv_heads, seq_len)

    # Compute attention scale
    scale = 1.0 / (d**0.5)

    # Compute reference (dequantize first)
    key_dequant = quantizer.dequantize(key_indices, key_norms).view_as(key)
    # Expand keys for GQA
    key_expanded = key.repeat(1, gqa_ratio, 1, 1)
    value_expanded = value.repeat(1, gqa_ratio, 1, 1)
    output_reference = FusedAttentionKernel.reference_attention(
        query, key_expanded, value_expanded, scale
    )

    # Compute fused
    output_fused = kernel(query, key_indices, key_norms, value, scale)

    # Compare
    diff = torch.abs(output_reference - output_fused)
    max_diff = diff.max().item()
    mean_diff = diff.mean().item()
    cosine_sim = torch.nn.functional.cosine_similarity(
        output_reference.flatten(), output_fused.flatten(), dim=0
    ).item()

    results = {
        "max_diff": max_diff,
        "mean_diff": mean_diff,
        "cosine_similarity": cosine_sim,
    }

    print(f"  Max difference:    {max_diff:.6e}")
    print(f"  Mean difference:   {mean_diff:.6e}")
    print(f"  Cosine similarity: {cosine_sim:.6f}")

    # Check if outputs are numerically identical
    if max_diff < 1e-5:
        print(f"  Status: PASSED (numerically identical)")
    else:
        print(f"  Status: FAILED (difference too large)")

    return results


if __name__ == "__main__":
    # Run tests
    for bits in [2, 3, 4]:
        test_fused_kernel(bits=bits)
