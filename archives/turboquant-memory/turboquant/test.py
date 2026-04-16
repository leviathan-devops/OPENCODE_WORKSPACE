"""
TurboQuant Test Suite

Run comprehensive tests for all TurboQuant modules.
"""

import torch
import sys
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)


def test_core_module():
    """Test core TurboQuant module."""
    print("\n" + "=" * 70)
    print("Testing Core Module")
    print("=" * 70)

    try:
        from turboquant.core import TurboQuantMSE

        # Self-test
        print("\nRunning self-test...")
        quantizer = TurboQuantMSE(d=256, bits=2)
        results = quantizer.self_test(n=64)

        # Check cosine similarity threshold
        if results["mean_cosine_sim"] >= 0.94:
            print("✓ Core module test PASSED")
            return True
        else:
            print(
                f"✗ Core module test FAILED: cosine similarity {results['mean_cosine_sim']:.4f} < 0.94"
            )
            return False

    except Exception as e:
        print(f"✗ Core module test FAILED with exception: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_kv_cache_module():
    """Test KV cache compression module."""
    print("\n" + "=" * 70)
    print("Testing KV Cache Module")
    print("=" * 70)

    try:
        from turboquant.kv_cache import TurboQuantKVCache
        from turboquant.core import TurboQuantMSE

        # Create cache
        print("\nCreating TurboQuant KV cache...")
        cache = TurboQuantKVCache(num_layers=27, bits=2, d=256)

        # Generate test data
        batch_size = 1
        num_heads = 4
        seq_len = 128
        d = 256

        torch.manual_seed(42)
        key_states = torch.randn(batch_size, num_heads, seq_len, d)
        value_states = torch.randn(batch_size, num_heads, seq_len, d)

        # Update cache
        print(f"Updating cache with {seq_len} tokens...")
        cache.update(0, key_states, value_states)

        # Verify compression
        print(f"\nVerifying compression...")
        indices, norms, values = cache.get_compressed(0)

        # Check shapes
        assert indices.shape == (batch_size, num_heads, seq_len, d), (
            "Indices shape mismatch"
        )
        assert norms.shape == (batch_size, num_heads, seq_len), "Norms shape mismatch"
        assert values.shape == (batch_size, num_heads, seq_len, d), (
            "Values shape mismatch"
        )

        # Check data types
        assert indices.dtype == torch.uint8, "Indices should be uint8"
        assert values.dtype == torch.float16, "Values should be fp16"

        # Check compression ratio
        original_size = batch_size * num_heads * seq_len * d * 2  # fp16 keys
        compressed_size = (
            batch_size * num_heads * seq_len * d * 1  # uint8 indices
            + batch_size * num_heads * seq_len * 2  # fp16 norms
        )
        compression_ratio = original_size / compressed_size

        print(f"  Original size: {original_size:,} bytes")
        print(f"  Compressed size: {compressed_size:,} bytes")
        print(f"  Compression ratio: {compression_ratio:.1f}x")

        # Verify dequantization
        print("\nVerifying dequantization...")
        dequantized_keys = cache.get_dequantized_keys(0)

        # Compute cosine similarity
        key_flat = key_states.view(-1, d)
        dequantized_flat = dequantized_keys.view(-1, d)
        cosine_sim = (
            torch.nn.functional.cosine_similarity(key_flat, dequantized_flat, dim=-1)
            .mean()
            .item()
        )

        print(f"  Cosine similarity: {cosine_sim:.4f}")

        if cosine_sim >= 0.94:
            print("✓ KV cache module test PASSED")
            return True
        else:
            print(
                f"✗ KV cache module test FAILED: cosine similarity {cosine_sim:.4f} < 0.94"
            )
            return False

    except Exception as e:
        print(f"✗ KV cache module test FAILED with exception: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_attention_module():
    """Test Triton fused attention module."""
    print("\n" + "=" * 70)
    print("Testing Attention Module")
    print("=" * 70)

    try:
        from turboquant.attention import test_fused_kernel

        # Run test
        print("\nRunning fused kernel test...")
        results = test_fused_kernel(
            batch_size=1,
            num_query_heads=8,
            num_kv_heads=4,
            seq_len=512,
            d=256,
            bits=2,
        )

        # Check if outputs are numerically identical
        if results["max_diff"] < 1e-5:
            print("✓ Attention module test PASSED")
            return True
        else:
            print(
                f"✗ Attention module test FAILED: max_diff {results['max_diff']:.6e} >= 1e-5"
            )
            return False

    except Exception as e:
        print(f"✗ Attention module test FAILED with exception: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_integration():
    """Test integration with HuggingFace DynamicCache."""
    print("\n" + "=" * 70)
    print("Testing HuggingFace Integration")
    print("=" * 70)

    try:
        from transformers import DynamicCache
        from turboquant.kv_cache import patch_dynamic_cache, unpatch_dynamic_cache

        # Create cache
        print("\nCreating DynamicCache...")
        cache = DynamicCache()

        # Patch cache
        print("Patching cache with TurboQuant...")
        patcher = patch_dynamic_cache(cache, num_layers=27, bits=2, d=256)

        # Generate test data
        batch_size = 1
        num_heads = 4
        seq_len = 128
        d = 256

        torch.manual_seed(42)
        key_states = torch.randn(batch_size, num_heads, seq_len, d)
        value_states = torch.randn(batch_size, num_heads, seq_len, d)

        # Update cache
        print(f"Updating cache with {seq_len} tokens...")
        cache.update(key_states, value_states, layer_idx=0)

        # Verify compression
        print("Verifying compressed representation...")
        indices, norms = patcher.get_compressed_keys(cache, layer_idx=0)

        assert indices is not None, "Indices should not be None"
        assert norms is not None, "Norms should not be None"
        assert indices.shape == (batch_size, num_heads, seq_len, d), (
            "Indices shape mismatch"
        )
        assert indices.dtype == torch.uint8, "Indices should be uint8"

        print(f"  Indices shape: {indices.shape}")
        print(f"  Indices dtype: {indices.dtype}")
        print(f"  Norms shape: {norms.shape}")

        # Unpatch cache
        print("\nUnpatching cache...")
        unpatch_dynamic_cache(cache)

        # Verify patch removal
        assert not hasattr(cache, "_turboquant_patcher"), (
            "Patcher attribute should be removed"
        )

        print("✓ Integration test PASSED")
        return True

    except Exception as e:
        print(f"✗ Integration test FAILED with exception: {e}")
        import traceback

        traceback.print_exc()
        return False


def run_all_tests():
    """Run all TurboQuant tests."""
    print("\n" + "=" * 70)
    print("TurboQuant Test Suite")
    print("=" * 70)
    print("\nRunning comprehensive tests...")

    results = {
        "Core Module": test_core_module(),
        "KV Cache Module": test_kv_cache_module(),
        "Attention Module": test_attention_module(),
        "Integration": test_integration(),
    }

    # Summary
    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)

    for test_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name:20s}: {status}")

    all_passed = all(results.values())

    print("\n" + "=" * 70)
    if all_passed:
        print("All tests PASSED ✓")
    else:
        print("Some tests FAILED ✗")
    print("=" * 70)

    return all_passed


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
