"""
Dynamic VRAM Allocator

Manages VRAM/RAM allocation with LRU eviction policy and memory pressure monitoring.
Target: Reduce idle VRAM from 10.5GB to 7-8GB by offloading unused tensors to RAM.
"""

import torch
import weakref
import threading
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Callable, Tuple
from contextlib import contextmanager
from abc import ABC, abstractmethod


@dataclass
class MemoryStats:
    """Statistics about memory usage."""

    vram_allocated: int = 0
    vram_reserved: int = 0
    ram_allocated: int = 0
    total_tensors: int = 0
    vram_tensors: int = 0
    ram_tensors: int = 0
    eviction_count: int = 0
    migration_count: int = 0

    @property
    def vram_usage_mb(self) -> float:
        return self.vram_allocated / (1024 * 1024)

    @property
    def vram_usage_gb(self) -> float:
        return self.vram_allocated / (1024 * 1024 * 1024)

    @property
    def ram_usage_mb(self) -> float:
        return self.ram_allocated / (1024 * 1024)

    @property
    def ram_usage_gb(self) -> float:
        return self.ram_allocated / (1024 * 1024 * 1024)

    def __str__(self) -> str:
        return (
            f"MemoryStats(vram={self.vram_usage_gb:.2f}GB, "
            f"ram={self.ram_usage_gb:.2f}GB, "
            f"tensors={self.total_tensors}, "
            f"evictions={self.eviction_count})"
        )


@dataclass
class AllocationConfig:
    """Configuration for the VRAM allocator."""

    vram_budget_mb: int = 8192  # Default 8GB budget
    vram_target_ratio: float = 0.75  # Target 75% of VRAM budget
    eviction_threshold: float = 0.90  # Evict when above 90%
    lru_cache_size: int = 1000
    enable_unified_memory: bool = True
    lazy_migration: bool = True
    migration_batch_size: int = 10
    monitor_interval: float = 1.0  # Seconds

    @property
    def vram_target_mb(self) -> int:
        return int(self.vram_budget_mb * self.vram_target_ratio)

    @property
    def vram_threshold_mb(self) -> int:
        return int(self.vram_budget_mb * self.eviction_threshold)


class TensorEntry:
    """Entry for tracking a tensor in the allocator."""

    def __init__(self, tensor: torch.Tensor, name: str = ""):
        self.tensor = tensor
        self.name = name
        self.size_bytes = tensor.element_size() * tensor.nelement()
        self.device = tensor.device
        self.last_access = time.time()
        self.access_count = 1
        self.is_pinned = False
        self.ref = weakref.ref(tensor)

    def touch(self):
        """Update last access time and count."""
        self.last_access = time.time()
        self.access_count += 1

    def is_valid(self) -> bool:
        """Check if the tensor is still alive."""
        return self.ref() is not None

    def __repr__(self) -> str:
        device_str = "VRAM" if self.device.type == "cuda" else "RAM"
        size_mb = self.size_bytes / (1024 * 1024)
        return f"TensorEntry({self.name}, {device_str}, {size_mb:.2f}MB)"


class EvictionPolicy(ABC):
    """Abstract base class for eviction policies."""

    @abstractmethod
    def select_for_eviction(
        self, entries: List[TensorEntry], budget_bytes: int
    ) -> List[TensorEntry]:
        """Select tensors to evict to stay within budget."""
        pass


class LRUEvictionPolicy(EvictionPolicy):
    """LRU (Least Recently Used) eviction policy."""

    def select_for_eviction(
        self, entries: List[TensorEntry], budget_bytes: int
    ) -> List[TensorEntry]:
        """Select tensors based on last access time."""
        pinned = [e for e in entries if e.is_pinned]
        unpinned = [e for e in entries if not e.is_pinned]

        # Sort unpinned by last access time (oldest first)
        to_evict = sorted(unpinned, key=lambda e: e.last_access)

        # Calculate how much we need to free
        current_usage = sum(e.size_bytes for e in entries)
        target_usage = budget_bytes
        bytes_to_free = current_usage - target_usage

        if bytes_to_free <= 0:
            return []

        selected = []
        freed_bytes = 0

        for entry in to_evict:
            selected.append(entry)
            freed_bytes += entry.size_bytes
            if freed_bytes >= bytes_to_free:
                break

        return selected


class VRAMAllocator:
    """
    Dynamic VRAM allocator with LRU eviction.

    Manages tensor lifecycle, offloads unused tensors to RAM, and monitors
    memory pressure to keep VRAM usage within budget.
    """

    def __init__(self, config: Optional[AllocationConfig] = None):
        self.config = config or AllocationConfig()
        self._entries: OrderedDict[int, TensorEntry] = OrderedDict()
        self._lock = threading.RLock()
        self._eviction_policy = LRUEvictionPolicy()
        self._stats = MemoryStats()
        self._monitor_thread: Optional[threading.Thread] = None
        self._monitor_running = False
        self._hooks: Dict[str, List[Callable]] = {
            "before_eviction": [],
            "after_eviction": [],
            "before_migration": [],
            "after_migration": [],
            "memory_pressure": [],
        }

        # Get initial VRAM info
        if torch.cuda.is_available():
            self.device = torch.cuda.current_device()
        else:
            self.device = torch.device("cpu")
            self.config.enable_unified_memory = False

    def register_tensor(
        self, tensor: torch.Tensor, name: str = "", pin: bool = False
    ) -> int:
        """Register a tensor for memory management."""
        with self._lock:
            # Check if already registered
            tensor_id = id(tensor)
            if tensor_id in self._entries:
                entry = self._entries[tensor_id]
                entry.touch()
                return tensor_id

            # Create new entry
            entry = TensorEntry(tensor, name)
            entry.is_pinned = pin
            self._entries[tensor_id] = entry

            # Update stats
            self._update_stats()

            # Check memory pressure
            self._check_memory_pressure()

            return tensor_id

    def unregister_tensor(self, tensor_id: int) -> bool:
        """Unregister a tensor from memory management."""
        with self._lock:
            if tensor_id in self._entries:
                del self._entries[tensor_id]
                self._update_stats()
                return True
            return False

    def pin_tensor(self, tensor_id: int, pin: bool = True) -> bool:
        """Pin or unpin a tensor to prevent eviction."""
        with self._lock:
            if tensor_id in self._entries:
                self._entries[tensor_id].is_pinned = pin
                return True
            return False

    def touch_tensor(self, tensor_id: int) -> bool:
        """Mark a tensor as recently used."""
        with self._lock:
            if tensor_id in self._entries:
                self._entries[tensor_id].touch()
                return True
            return False

    def get_tensor(self, tensor_id: int) -> Optional[torch.Tensor]:
        """Get a tensor by ID, marking it as used."""
        with self._lock:
            if tensor_id in self._entries:
                entry = self._entries[tensor_id]
                entry.touch()
                tensor = entry.ref()
                if tensor is not None and entry.device != tensor.device:
                    # Update device info if migrated
                    entry.device = tensor.device
                return tensor
            return None

    def evict_to_ram(self, tensor_ids: Optional[List[int]] = None) -> int:
        """Evict tensors to RAM."""
        with self._lock:
            to_evict = []

            if tensor_ids is None:
                # Auto-select based on policy
                entries = [e for e in self._entries.values() if e.is_valid()]
                target_bytes = self.config.vram_target_mb * 1024 * 1024
                to_evict = self._eviction_policy.select_for_eviction(
                    entries, target_bytes
                )
            else:
                # Use provided list
                for tid in tensor_ids:
                    if tid in self._entries:
                        to_evict.append(self._entries[tid])

            if not to_evict:
                return 0

            # Call before hooks
            for hook in self._hooks["before_eviction"]:
                hook([e.name for e in to_evict])

            evicted_count = 0

            for entry in to_evict:
                tensor = entry.ref()
                if tensor is not None and tensor.device.type == "cuda":
                    try:
                        # Move to RAM
                        cpu_tensor = tensor.cpu()

                        # Replace in-place if possible
                        if tensor.data_ptr() == tensor.storage().data_ptr():
                            tensor.data = cpu_tensor.data
                        else:
                            # For views, need to replace the tensor itself
                            # This is more complex and may require wrapper
                            pass

                        entry.device = cpu_tensor.device
                        self._stats.eviction_count += 1
                        self._stats.migration_count += 1
                        evicted_count += 1
                    except Exception as e:
                        # Log error but continue
                        pass

            # Update stats
            self._update_stats()

            # Call after hooks
            for hook in self._hooks["after_eviction"]:
                hook(evicted_count)

            return evicted_count

    def load_to_vram(self, tensor_id: int) -> Optional[torch.Tensor]:
        """Load a tensor to VRAM if it's in RAM."""
        with self._lock:
            if tensor_id not in self._entries:
                return None

            entry = self._entries[tensor_id]
            tensor = entry.ref()

            if tensor is None or tensor.device.type == "cuda":
                return tensor

            try:
                # Check VRAM capacity
                if self._should_evict_before_load(tensor):
                    self.evict_to_ram()

                # Move to VRAM
                cuda_tensor = tensor.cuda(self.device)
                entry.device = cuda_tensor.device
                entry.touch()
                self._stats.migration_count += 1

                # Update stats
                self._update_stats()

                return cuda_tensor
            except RuntimeError as e:
                if "out of memory" in str(e).lower():
                    # Try to evict more and retry
                    self.evict_to_ram()
                    try:
                        cuda_tensor = tensor.cuda(self.device)
                        entry.device = cuda_tensor.device
                        entry.touch()
                        self._stats.migration_count += 1
                        self._update_stats()
                        return cuda_tensor
                    except:
                        return None
                return None

    def _should_evict_before_load(self, tensor: torch.Tensor) -> bool:
        """Check if we should evict tensors before loading."""
        if not torch.cuda.is_available():
            return False

        tensor_size = tensor.element_size() * tensor.nelement()
        current_vram = torch.cuda.memory_allocated(self.device)
        target_vram = self.config.vram_target_mb * 1024 * 1024

        return (current_vram + tensor_size) > target_vram

    def _update_stats(self):
        """Update memory statistics."""
        with self._lock:
            valid_entries = [e for e in self._entries.values() if e.is_valid()]

            self._stats.total_tensors = len(valid_entries)
            self._stats.vram_tensors = sum(
                1 for e in valid_entries if e.device.type == "cuda"
            )
            self._stats.ram_tensors = (
                self._stats.total_tensors - self._stats.vram_tensors
            )

            self._stats.vram_allocated = sum(
                e.size_bytes for e in valid_entries if e.device.type == "cuda"
            )
            self._stats.ram_allocated = sum(
                e.size_bytes for e in valid_entries if e.device.type == "cpu"
            )

            if torch.cuda.is_available():
                self._stats.vram_reserved = torch.cuda.memory_reserved(self.device)

    def _check_memory_pressure(self):
        """Check and handle memory pressure."""
        if not torch.cuda.is_available():
            return

        current_vram = torch.cuda.memory_allocated(self.device)
        threshold_vram = self.config.vram_threshold_mb * 1024 * 1024

        if current_vram > threshold_vram:
            # Call memory pressure hooks
            for hook in self._hooks["memory_pressure"]:
                hook(self._stats)

            # Evict tensors
            self.evict_to_ram()

    def get_stats(self) -> MemoryStats:
        """Get current memory statistics."""
        with self._lock:
            self._update_stats()
            return MemoryStats(**self._stats.__dict__)

    def get_tensor_info(self, tensor_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed information about a tensor."""
        with self._lock:
            if tensor_id not in self._entries:
                return None

            entry = self._entries[tensor_id]
            tensor = entry.ref()

            if tensor is None:
                return None

            return {
                "id": tensor_id,
                "name": entry.name,
                "device": str(entry.device),
                "size_bytes": entry.size_bytes,
                "size_mb": entry.size_bytes / (1024 * 1024),
                "shape": list(tensor.shape),
                "dtype": str(tensor.dtype),
                "is_pinned": entry.is_pinned,
                "last_access": entry.last_access,
                "access_count": entry.access_count,
            }

    def add_hook(self, event: str, callback: Callable):
        """Add a callback for a specific event."""
        if event in self._hooks:
            self._hooks[event].append(callback)

    def remove_hook(self, event: str, callback: Callable):
        """Remove a callback for a specific event."""
        if event in self._hooks and callback in self._hooks[event]:
            self._hooks[event].remove(callback)

    @contextmanager
    def temporary_pin(self, tensor_id: int):
        """Context manager to temporarily pin a tensor."""
        was_pinned = self.pin_tensor(tensor_id, True)
        try:
            yield
        finally:
            if not was_pinned:
                self.pin_tensor(tensor_id, False)

    def start_monitoring(self):
        """Start the background memory monitor."""
        if self._monitor_running:
            return

        self._monitor_running = True
        self._monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._monitor_thread.start()

    def stop_monitoring(self):
        """Stop the background memory monitor."""
        self._monitor_running = False
        if self._monitor_thread:
            self._monitor_thread.join(timeout=5.0)
            self._monitor_thread = None

    def _monitor_loop(self):
        """Background monitoring loop."""
        while self._monitor_running:
            try:
                time.sleep(self.config.monitor_interval)
                self._update_stats()
                self._check_memory_pressure()
            except Exception as e:
                # Log error but continue
                pass

    def clear(self):
        """Clear all tracked tensors."""
        with self._lock:
            self._entries.clear()
            self._update_stats()

    def __enter__(self):
        """Context manager entry."""
        self.start_monitoring()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.stop_monitoring()


# Global allocator instance
_global_allocator: Optional[VRAMAllocator] = None


def get_allocator(config: Optional[AllocationConfig] = None) -> VRAMAllocator:
    """Get or create the global VRAM allocator."""
    global _global_allocator
    if _global_allocator is None:
        _global_allocator = VRAMAllocator(config)
    return _global_allocator


def reset_allocator():
    """Reset the global VRAM allocator."""
    global _global_allocator
    if _global_allocator is not None:
        _global_allocator.clear()
        _global_allocator.stop_monitoring()
        _global_allocator = None
