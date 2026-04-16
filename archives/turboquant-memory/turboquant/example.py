"""
TurboQuant Example: Basic Usage

Demonstrates basic usage of TurboQuant modules.
"""

import torch
from turboquant import TurboQuantMSE
from turboquant.kv_cache import TurboQuantKVCache
from turboquant.attention import create_fused_kernel


def example_core():
    """Example: Core TurboQuant quantization."""
    print("\n" + "=" * 70)
    print("Example 1: Core Quantization")
    print("=" * 70)

    # Create quantizer
    quantizer = TurboQuantMSE(d=256, bits=2)

    # Generate random vectors
    x = torch.randn(10, 256)

    # Quantize
    indices, norms = quantizer.quantize(x)

    print(f"Input shape: {x.shape}, dtype: {x.dtype}")
    print(f"Indices shape: {indices.shape}, dtype: {indices.dtype}")
    print(f"Norms shape: {norms.shape}, dtype: {norms.dtype}")

    # Dequantize
    x_reconstructed = quantizer.dequantize(indices, norms)

    # Compute quality metrics
    mse = torch.mean((x - x_reconstructed) ** 2).item()
    cosine_sim = (
        torch.nn.functional.cosine_similarity(x, x_reconstructed, dim=-1).mean().item()
    )

    print(f"MSE: {mse:.6f}")
    print(f"Cosine similarity: {cosine_sim:.4f}")


def example_kv_cache():
    """Example: KV cache compression."""
    print("\n" + "=" * 70)
    print("Example 2: KV Cache Compression")
    print("=" * 70)

    # Create cache
    cache = TurboQuantKVCache(num_layers=27, bits=2, d=256)

    # Generate test data
    batch_size = 1
    num_heads = 4
    seq_len = 128
    d = 256

    key_states = torch.randn(batch_size, num_heads, seq_len, d)
    value_states = torch.randn(batch_size, num_heads, seq_len, d)

    # Update cache
    print(f"Updating cache with {seq_len} tokens...")
    cache.update(0, key_states, value_states)

    # Get compressed representation
    indices, norms, values = cache.get_compressed(0)

    print(f"Compressed keys: {indices.shape}, dtype: {indices.dtype}")
    print(f"Key norms: {norms.shape}, dtype: {norms.dtype}")
    print(f"Values: {values.shape}, dtype: {values.dtype}")

    # Compute memory savings
    original_size = batch_size * num_heads * seq_len * d * 2 * 2  # keys + values (fp16)
    compressed_size = (
        batch_size * num_heads * seq_len * d * 1  # key indices (uint8)
        + batch_size * num_heads * seq_len * 2  # key norms (fp16)
        + batch_size * num_heads * seq_len * d * 2  # values (fp16)
    )

    print(
        f"\nOriginal size: {original_size:,} bytes ({original_size / 1024 / 1024:.2f} MB)"
    )
    print(
        f"Compressed size: {compressed_size:,} bytes ({compressed_size / 1024 / 1024:.2f} MB)"
    )
    print(
        f"Savings: {original_size - compressed_size:,} bytes ({(original_size - compressed_size) / 1024 / 1024:.2f} MB)"
    )
    print(f"Compression ratio: {original_size / compressed_size:.1f}x")


def example_fused_attention():
    """Example: Fused attention kernel."""
    print("\n" + "=" * 70)
    print("Example 3: Fused Attention Kernel")
    print("=" * 70)

    # Create kernel
    kernel = create_fused_kernel(bits=2, d=256, num_kv_heads=4, gqa_ratio=2)

    # Generate test data
    batch_size = 1
    num_query_heads = 8
    num_kv_heads = 4
    seq_len_q = 1
    seq_len_k = 512
    d = 256

    query = torch.randn(batch_size, num_query_heads, seq_len_q, d)
    key_indices = torch.randint(
        0, 4, (batch_size, num_kv_heads, seq_len_k, d), dtype=torch.uint8
    )
    key_norms = torch.rand(batch_size, num_kv_heads, seq_len_k)
    value = torch.randn(batch_size, num_kv_heads, seq_len_k, d)
    scale = 1.0 / (d**0.5)

    print(f"Query: {query.shape}, dtype: {query.dtype}")
    print(f"Key indices: {key_indices.shape}, dtype: {key_indices.dtype}")
    print(f"Key norms: {key_norms.shape}, dtype: {key_norms.dtype}")
    print(f"Value: {value.shape}, dtype: {value.dtype}")

    # Compute attention
    print("\nComputing attention with fused kernel...")
    output = kernel(query, key_indices, key_norms, value, scale)

    print(f"Output: {output.shape}, dtype: {output.dtype}")


def main():
    """Run all examples."""
    print("\n" + "=" * 70)
    print("TurboQuant Examples")
    print("=" * 70)

    example_core()
    example_kv_cache()
    example_fused_attention()

    print("\n" + "=" * 70)
    print("All examples completed!")
    print("=" * 70)


if __name__ == "__main__":
    main()
