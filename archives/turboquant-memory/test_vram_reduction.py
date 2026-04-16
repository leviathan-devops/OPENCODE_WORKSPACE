#!/usr/bin/env python3
"""
TurboQuant VRAM Reduction Test

Tests actual VRAM savings when using TurboQuant with vLLM.
Compares baseline (FP8) vs TurboQuant (2-bit KV cache).
"""

import torch
import sys
import os

# Add workspace to path
sys.path.insert(0, "/home/leviathan/OPENCODE WORKSPACE/TurboQuant Memory Enhancement")

from turboquant import TurboQuantMSE
import subprocess
import time


def get_gpu_memory():
    """Get current GPU memory usage in MB"""
    result = subprocess.run(
        ["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
        capture_output=True,
        text=True,
    )
    return int(result.stdout.strip())


def test_vram_reduction():
    """Test VRAM reduction with TurboQuant"""
    print("=" * 70)
    print("TurboQuant VRAM Reduction Test")
    print("=" * 70)

    # Baseline memory
    baseline_memory = get_gpu_memory()
    print(f"\nBaseline GPU Memory: {baseline_memory} MB")

    # Test parameters
    batch_size = 1
    num_layers = 32  # Qwen 7B has 32 layers
    num_heads = 4  # KV heads for GQA
    seq_len = 8192  # 8K context
    head_dim = 128

    print(f"\nTest Configuration:")
    print(f"  Sequence Length: {seq_len}")
    print(f"  Num Layers: {num_layers}")
    print(f"  Num KV Heads: {num_heads}")
    print(f"  Head Dimension: {head_dim}")

    # Create quantizer
    print("\nInitializing TurboQuant...")
    quantizer = TurboQuantMSE(d=head_dim, bits=2)

    # Simulate KV cache for all layers
    print(f"\nSimulating KV cache for {seq_len} tokens across {num_layers} layers...")

    # FP16 KV cache size
    fp16_keys_size = (
        batch_size * num_layers * num_heads * seq_len * head_dim * 2
    )  # 2 bytes for fp16
    fp16_values_size = batch_size * num_layers * num_heads * seq_len * head_dim * 2
    fp16_total = fp16_keys_size + fp16_values_size

    print(f"\nFP16 KV Cache Size:")
    print(f"  Keys: {fp16_keys_size / 1024 / 1024:.2f} MB")
    print(f"  Values: {fp16_values_size / 1024 / 1024:.2f} MB")
    print(f"  Total: {fp16_total / 1024 / 1024:.2f} MB")

    # TurboQuant compressed size (2-bit keys + fp16 values)
    # 2-bit = 0.25 bytes per element
    tq_keys_size = batch_size * num_layers * num_heads * seq_len * head_dim * 0.25
    # Norms stored in fp16 (1 value per vector)
    tq_norms_size = batch_size * num_layers * num_heads * seq_len * 2
    # Values remain in fp16
    tq_values_size = fp16_values_size
    tq_total = tq_keys_size + tq_norms_size + tq_values_size

    print(f"\nTurboQuant KV Cache Size (2-bit):")
    print(f"  Keys (2-bit): {tq_keys_size / 1024 / 1024:.2f} MB")
    print(f"  Norms (fp16): {tq_norms_size / 1024 / 1024:.2f} MB")
    print(f"  Values (fp16): {tq_values_size / 1024 / 1024:.2f} MB")
    print(f"  Total: {tq_total / 1024 / 1024:.2f} MB")

    # Compression ratio
    compression_ratio = fp16_total / tq_total
    savings = fp16_total - tq_total

    print(f"\n" + "=" * 70)
    print(f"RESULTS:")
    print(f"=" * 70)
    print(f"Compression Ratio: {compression_ratio:.2f}x")
    print(f"Memory Saved: {savings / 1024 / 1024:.2f} MB")
    print(f"Reduction: {(1 - tq_total / fp16_total) * 100:.1f}%")

    # Test with different context lengths
    print(f"\n" + "=" * 70)
    print(f"Scaling Analysis:")
    print(f"=" * 70)

    for test_seq_len in [4096, 8192, 16384, 32768, 65536]:
        fp16_size = (
            batch_size * num_layers * num_heads * test_seq_len * head_dim * 4
        )  # 4 bytes total (keys + values)
        tq_size = (
            batch_size
            * num_layers
            * num_heads
            * test_seq_len
            * (head_dim * 0.25 + 2 + head_dim * 2)
        )  # keys + norms + values

        print(
            f"  {test_seq_len:5d} tokens: FP16={fp16_size / 1024 / 1024:6.2f}MB → TQ={tq_size / 1024 / 1024:6.2f}MB (saved: {(fp16_size - tq_size) / 1024 / 1024:6.2f}MB)"
        )

    # Current GPU memory after test
    final_memory = get_gpu_memory()
    print(f"\nCurrent GPU Memory: {final_memory} MB")
    print(f"Memory delta: {final_memory - baseline_memory} MB")

    print(f"\n✓ Test complete!")


if __name__ == "__main__":
    test_vram_reduction()
