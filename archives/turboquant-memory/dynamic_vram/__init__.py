"""
Dynamic VRAM Allocation System

A system for dynamically allocating and managing VRAM/RAM for PyTorch tensors,
enabling execution of models larger than available VRAM with minimal performance overhead.

Key Features:
- VBAR (Virtual Base Address Register) for virtual address space management
- LRU eviction policy for efficient memory management
- Transparent model wrapping for easy integration
- vLLM integration for production use
- <10% performance overhead target
"""

from .allocator import VRAMAllocator, MemoryStats, AllocationConfig
from .vbar_manager import VBARManager, VirtualTensor, PageTable
from .model_wrapper import DynamicModelWrapper, wrap_model
from .benchmark import VRAMBenchmark, BenchmarkReport
from .integration_vllm import enable_dynamic_vram, disable_dynamic_vram

__version__ = "0.1.0"
__all__ = [
    "VRAMAllocator",
    "MemoryStats",
    "AllocationConfig",
    "VBARManager",
    "VirtualTensor",
    "PageTable",
    "DynamicModelWrapper",
    "wrap_model",
    "VRAMBenchmark",
    "BenchmarkReport",
    "enable_dynamic_vram",
    "disable_dynamic_vram",
]
