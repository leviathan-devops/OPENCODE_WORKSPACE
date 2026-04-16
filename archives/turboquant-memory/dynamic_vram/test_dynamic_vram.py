"""
Dynamic VRAM - Test Suite

Basic tests for the Dynamic VRAM allocation system.
"""

import sys
import os

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dynamic_vram.allocator import (
    VRAMAllocator,
    MemoryStats,
    AllocationConfig,
    get_allocator,
    reset_allocator,
)
from dynamic_vram.vbar_manager import (
    VBARManager,
    VirtualTensor,
    PageTable,
    get_vbar_manager,
    reset_vbar_manager,
)
from dynamic_vram.model_wrapper import (
    DynamicModelWrapper,
    wrap_model,
    LayerConfig,
    OffloadStats,
)
from dynamic_vram.benchmark import (
    VRAMBenchmark,
    BenchmarkResult,
    BenchmarkConfig,
    run_quick_benchmark,
)


def test_allocator():
    """Test the VRAM allocator."""
    print("\n" + "=" * 60)
    print("Testing VRAM Allocator")
    print("=" * 60)

    # Reset allocator
    reset_allocator()

    # Create allocator with custom config
    config = AllocationConfig(vram_budget_mb=4096, vram_target_ratio=0.75)
    allocator = VRAMAllocator(config)

    # Create some test tensors (if CUDA is available)
    import torch

    if torch.cuda.is_available():
        print("CUDA is available, testing with GPU tensors")

        # Create test tensors
        tensor1 = torch.randn(1000, 1000).cuda()
        tensor2 = torch.randn(1000, 1000).cuda()
        tensor3 = torch.randn(1000, 1000).cuda()

        # Register tensors
        id1 = allocator.register_tensor(tensor1, "tensor1")
        id2 = allocator.register_tensor(tensor2, "tensor2", pin=True)
        id3 = allocator.register_tensor(tensor3, "tensor3")

        print(f"Registered tensors: {id1}, {id2}, {id3}")

        # Get stats
        stats = allocator.get_stats()
        print(f"Memory stats: {stats}")
        print(f"  VRAM usage: {stats.vram_usage_mb:.2f} MB")
        print(f"  Total tensors: {stats.total_tensors}")

        # Get tensor info
        info1 = allocator.get_tensor_info(id1)
        print(f"Tensor 1 info: {info1}")

        # Test eviction
        evicted = allocator.evict_to_ram()
        print(f"Evicted {evicted} tensors to RAM")

        stats_after = allocator.get_stats()
        print(
            f"After eviction - VRAM: {stats_after.vram_usage_mb:.2f} MB, RAM: {stats_after.ram_usage_mb:.2f} MB"
        )

    else:
        print("CUDA not available, using CPU tensors")

        tensor1 = torch.randn(1000, 1000)
        tensor2 = torch.randn(1000, 1000)

        id1 = allocator.register_tensor(tensor1, "tensor1")
        id2 = allocator.register_tensor(tensor2, "tensor2")

        print(f"Registered {allocator.get_stats().total_tensors} tensors (CPU only)")

    print("✓ Allocator test passed")
    return True


def test_vbar_manager():
    """Test the VBAR manager."""
    print("\n" + "=" * 60)
    print("Testing VBAR Manager")
    print("=" * 60)

    # Reset VBAR manager
    reset_vbar_manager()

    # Create VBAR manager
    vbar = VBARManager(enable_unified_memory=True, initial_vram_budget_mb=4096)

    import torch

    # Create a virtual tensor
    virtual_tensor = vbar.allocate_virtual_tensor(
        shape=(1000, 1000),
        dtype=torch.float32,
        name="test_tensor",
        prefer_vram=torch.cuda.is_available(),
    )

    print(f"Created virtual tensor: {virtual_tensor}")
    print(f"  Shape: {virtual_tensor.shape}")
    print(f"  Dtype: {virtual_tensor.dtype}")
    print(f"  Size: {virtual_tensor.size_bytes / (1024 * 1024):.2f} MB")

    # Access the tensor (triggers page fault)
    tensor = virtual_tensor.fault()
    print(f"Tensor device: {tensor.device}")

    # Get memory usage
    memory = vbar.get_memory_usage()
    print(f"Memory usage: {memory}")
    print(f"  VRAM: {memory['vram_usage_mb']:.2f} MB")
    print(f"  RAM: {memory['ram_usage_mb']:.2f} MB")
    print(f"  Utilization: {memory['vram_utilization'] * 100:.1f}%")

    # Test page table
    page_stats = vbar.get_page_table_stats()
    print(f"Page table stats: {page_stats}")

    print("✓ VBAR manager test passed")
    return True


def test_model_wrapper():
    """Test the model wrapper."""
    print("\n" + "=" * 60)
    print("Testing Model Wrapper")
    print("=" * 60)

    import torch
    import torch.nn as nn

    # Create a simple test model
    class TestModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.layers = nn.Sequential(
                nn.Linear(512, 512),
                nn.ReLU(),
                nn.Linear(512, 512),
                nn.ReLU(),
                nn.Linear(512, 512),
            )

        def forward(self, x):
            return self.layers(x)

    model = TestModel()
    print(
        f"Created test model with {sum(p.numel() for p in model.parameters()):,} parameters"
    )

    # Wrap the model
    wrapped = wrap_model(model, vram_budget_mb=4096, offload_ratio=0.5)
    print(f"Wrapped model with Dynamic VRAM")

    # Get memory usage
    memory = wrapped.get_memory_usage()
    print(f"Memory usage: {memory}")

    # Test forward pass
    input_tensor = torch.randn(1, 100, 512)

    # Move to GPU if available
    if torch.cuda.is_available():
        wrapped = wrapped.cuda()
        input_tensor = input_tensor.cuda()

    with torch.no_grad():
        output = wrapped(input_tensor)

    print(f"Output shape: {output.shape}")

    # Get stats after forward pass
    memory_after = wrapped.get_memory_usage()
    print(f"Memory after forward: {memory_after}")

    # Get layer status
    layer_status = wrapped.get_layer_status()
    print(f"Tracked layers: {len(layer_status)}")

    print("✓ Model wrapper test passed")
    return True


def test_benchmark():
    """Test the benchmark module."""
    print("\n" + "=" * 60)
    print("Testing Benchmark Module")
    print("=" * 60)

    # Run a quick benchmark
    print("Running quick benchmark...")
    result = run_quick_benchmark()

    print(f"\nBenchmark Result:")
    print(f"  Model: {result.model_name}")
    print(
        f"  VRAM saved: {result.vram_saved_mb:.2f} MB ({result.vram_saved_percent:.1f}%)"
    )
    print(f"  Overhead: {result.overhead_percent:.2f}%")
    print(f"  Throughput: {result.throughput_tokens_per_sec:.2f} tokens/sec")

    print("✓ Benchmark test passed")
    return True


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("Dynamic VRAM Test Suite")
    print("=" * 60)

    tests = [
        ("Allocator", test_allocator),
        ("VBAR Manager", test_vbar_manager),
        ("Model Wrapper", test_model_wrapper),
        ("Benchmark", test_benchmark),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"✗ {test_name} test failed: {e}")
            results.append((test_name, False))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{test_name:20s}: {status}")

    print(f"\nTotal: {passed}/{total} tests passed")

    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
