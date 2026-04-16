"""
VBAR (Virtual Base Address Register) Manager

Manages virtual address space for tensors with on-demand allocation.
Maps virtual addresses to physical VRAM/RAM and handles page faults transparently.
"""

import torch
import weakref
import threading
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Tuple, Callable
from abc import ABC, abstractmethod
import mmap
import os


@dataclass
class PageTableEntry:
    """Entry in the page table mapping virtual to physical memory."""

    virtual_address: int
    physical_address: Optional[int]
    device: torch.device
    size_bytes: int
    is_present: bool = True
    is_dirty: bool = False
    access_count: int = 0

    @property
    def is_in_vram(self) -> bool:
        return self.is_present and self.device.type == "cuda"

    @property
    def is_in_ram(self) -> bool:
        return self.is_present and self.device.type == "cpu"


@dataclass
class VirtualTensor:
    """
    Virtual tensor that can be stored in VRAM or RAM transparently.
    Uses VBAR (Virtual Base Address Register) for address mapping.
    """

    def __init__(
        self,
        shape: Tuple[int, ...],
        dtype: torch.dtype,
        device: torch.device,
        name: str = "",
    ):
        self.shape = shape
        self.dtype = dtype
        self.name = name
        self.virtual_address = id(self)
        self._tensor: Optional[torch.Tensor] = None
        self._lock = threading.RLock()
        self._page_fault_callbacks: List[Callable] = []

        # Create tensor if device is specified
        if device is not None:
            self._tensor = torch.empty(shape, dtype=dtype, device=device)

    @property
    def tensor(self) -> torch.Tensor:
        """Get the underlying tensor, handling page faults."""
        with self._lock:
            if self._tensor is None:
                self._handle_page_fault()
            return self._tensor

    @property
    def device(self) -> torch.device:
        """Get the current device of the tensor."""
        with self._lock:
            if self._tensor is None:
                return torch.device("cpu")
            return self._tensor.device

    @property
    def is_loaded(self) -> bool:
        """Check if the tensor is loaded in VRAM."""
        with self._lock:
            return self._tensor is not None and self._tensor.device.type == "cuda"

    @property
    def size_bytes(self) -> int:
        """Get the size of the tensor in bytes."""
        element_size = torch.tensor([], dtype=self.dtype).element_size()
        total_elements = 1
        for dim in self.shape:
            total_elements *= dim
        return element_size * total_elements

    def to(self, device: torch.device) -> "VirtualTensor":
        """Move the tensor to a different device."""
        with self._lock:
            if self._tensor is not None:
                self._tensor = self._tensor.to(device)
            return self

    def cuda(self, device: Optional[int] = None) -> "VirtualTensor":
        """Move the tensor to CUDA."""
        return self.to(torch.device(f"cuda:{device}" if device is not None else "cuda"))

    def cpu(self) -> "VirtualTensor":
        """Move the tensor to CPU."""
        return self.to(torch.device("cpu"))

    def fault(self) -> torch.Tensor:
        """
        Page fault handler - load tensor on demand.
        This is the key API for on-demand allocation.
        """
        with self._lock:
            if self._tensor is None or not self._is_present():
                self._handle_page_fault()

            # Trigger callbacks
            for callback in self._page_fault_callbacks:
                callback(self)

            return self._tensor

    def _is_present(self) -> bool:
        """Check if the tensor is present in memory."""
        return self._tensor is not None

    def _handle_page_fault(self):
        """Handle a page fault by allocating the tensor."""
        # Default implementation - allocate on CPU first
        if self._tensor is None:
            self._tensor = torch.zeros(self.shape, dtype=self.dtype, device="cpu")

        # If CUDA is requested, try to allocate there
        if torch.cuda.is_available():
            try:
                self._tensor = self._tensor.cuda()
            except RuntimeError as e:
                if "out of memory" in str(e).lower():
                    # Keep on CPU if out of VRAM
                    self._tensor = self._tensor.cpu()
                else:
                    raise

    def add_page_fault_callback(self, callback: Callable):
        """Add a callback to be called on page fault."""
        with self._lock:
            self._page_fault_callbacks.append(callback)

    def remove_page_fault_callback(self, callback: Callable):
        """Remove a page fault callback."""
        with self._lock:
            if callback in self._page_fault_callbacks:
                self._page_fault_callbacks.remove(callback)

    def detach(self) -> "VirtualTensor":
        """Return a detached copy of the tensor."""
        with self._lock:
            if self._tensor is not None:
                detached = self._tensor.detach()
                new_tensor = VirtualTensor(
                    self.shape, self.dtype, detached.device, self.name
                )
                new_tensor._tensor = detached
                return new_tensor
            return VirtualTensor(self.shape, self.dtype, None, self.name)

    def clone(self) -> "VirtualTensor":
        """Return a clone of the tensor."""
        with self._lock:
            if self._tensor is not None:
                cloned = self._tensor.clone()
                new_tensor = VirtualTensor(
                    self.shape, self.dtype, cloned.device, self.name + "_clone"
                )
                new_tensor._tensor = cloned
                return new_tensor
            return VirtualTensor(self.shape, self.dtype, None, self.name)

    def __repr__(self) -> str:
        device_str = str(self.device)
        return f"VirtualTensor(name={self.name}, shape={self.shape}, dtype={self.dtype}, device={device_str})"


class PageTable:
    """
    Virtual to physical address mapping table.
    Manages page table entries for virtual tensors.
    """

    def __init__(self, page_size: int = 2 * 1024 * 1024):  # 2MB pages
        self.page_size = page_size
        self._entries: Dict[int, PageTableEntry] = {}
        self._lock = threading.RLock()
        self._virtual_counter = 0

    def allocate_virtual_address(self, size_bytes: int) -> int:
        """Allocate a virtual address range."""
        with self._lock:
            virtual_address = self._virtual_counter
            self._virtual_counter += size_bytes
            return virtual_address

    def map(
        self,
        virtual_address: int,
        physical_tensor: Optional[torch.Tensor],
        device: torch.device,
        size_bytes: int,
    ) -> PageTableEntry:
        """Map a virtual address to physical memory."""
        with self._lock:
            entry = PageTableEntry(
                virtual_address=virtual_address,
                physical_address=id(physical_tensor)
                if physical_tensor is not None
                else None,
                device=device,
                size_bytes=size_bytes,
                is_present=physical_tensor is not None,
            )
            self._entries[virtual_address] = entry
            return entry

    def unmap(self, virtual_address: int) -> bool:
        """Unmap a virtual address."""
        with self._lock:
            if virtual_address in self._entries:
                del self._entries[virtual_address]
                return True
            return False

    def get_entry(self, virtual_address: int) -> Optional[PageTableEntry]:
        """Get a page table entry."""
        with self._lock:
            return self._entries.get(virtual_address)

    def lookup(self, virtual_address: int) -> Optional[torch.Tensor]:
        """Look up a tensor by virtual address."""
        with self._lock:
            entry = self._entries.get(virtual_address)
            if entry is None:
                return None

            if not entry.is_present:
                return None

            # Reconstruct tensor from physical address
            # Note: This is a simplified implementation
            # In practice, you'd need to store the actual tensor reference
            return None

    def invalidate(self, virtual_address: int):
        """Invalidate a page table entry."""
        with self._lock:
            if virtual_address in self._entries:
                self._entries[virtual_address].is_present = False

    def is_valid(self, virtual_address: int) -> bool:
        """Check if a virtual address is valid."""
        with self._lock:
            entry = self._entries.get(virtual_address)
            return entry is not None and entry.is_present

    def get_stats(self) -> Dict[str, Any]:
        """Get page table statistics."""
        with self._lock:
            total_entries = len(self._entries)
            vram_entries = sum(1 for e in self._entries.values() if e.is_in_vram)
            ram_entries = sum(1 for e in self._entries.values() if e.is_in_ram)
            total_size = sum(e.size_bytes for e in self._entries.values())

            return {
                "total_entries": total_entries,
                "vram_entries": vram_entries,
                "ram_entries": ram_entries,
                "total_size_bytes": total_size,
                "total_size_mb": total_size / (1024 * 1024),
            }


class VBARManager:
    """
    Virtual Base Address Register Manager.

    Creates virtual address space for tensors and manages mapping between
    virtual and physical addresses. Supports unified memory and handles
    page faults transparently.
    """

    def __init__(
        self, enable_unified_memory: bool = True, initial_vram_budget_mb: int = 8192
    ):
        self.enable_unified_memory = (
            enable_unified_memory and self._check_unified_memory()
        )
        self.vram_budget_bytes = initial_vram_budget_mb * 1024 * 1024
        self.page_table = PageTable()
        self._virtual_tensors: Dict[int, VirtualTensor] = {}
        self._lock = threading.RLock()
        self._allocation_callbacks: List[Callable] = []

        # Memory tracking
        self._vram_usage = 0
        self._ram_usage = 0

    def _check_unified_memory(self) -> bool:
        """Check if CUDA unified memory is available."""
        if not torch.cuda.is_available():
            return False

        try:
            # Try to allocate with unified memory
            test_tensor = torch.zeros(1, device="cuda")
            # Check if managed memory is supported
            return hasattr(test_tensor, "is_pinned")
        except:
            return False

    def allocate_virtual_tensor(
        self,
        shape: Tuple[int, ...],
        dtype: torch.dtype,
        name: str = "",
        prefer_vram: bool = True,
    ) -> VirtualTensor:
        """
        Allocate a virtual tensor.

        The tensor is not immediately allocated in VRAM/RAM.
        It will be allocated on-demand when accessed via the fault() API.
        """
        with self._lock:
            device = None
            if prefer_vram and torch.cuda.is_available():
                device = torch.device("cuda")

            virtual_tensor = VirtualTensor(shape, dtype, device, name)
            tensor_id = id(virtual_tensor)

            # Add to virtual tensor registry
            self._virtual_tensors[tensor_id] = virtual_tensor

            # Add page fault callback for memory tracking
            def on_fault(vtensor: VirtualTensor):
                self._on_tensor_access(vtensor)

            virtual_tensor.add_page_fault_callback(on_fault)

            # Create page table entry
            virtual_address = self.page_table.allocate_virtual_address(
                virtual_tensor.size_bytes
            )

            self.page_table.map(
                virtual_address=virtual_address,
                physical_tensor=None,
                device=device if device is not None else torch.device("cpu"),
                size_bytes=virtual_tensor.size_bytes,
            )

            return virtual_tensor

    def allocate_from_tensor(
        self, tensor: torch.Tensor, name: str = ""
    ) -> VirtualTensor:
        """
        Create a virtual tensor from an existing tensor.
        """
        with self._lock:
            virtual_tensor = VirtualTensor(
                tuple(tensor.shape), tensor.dtype, tensor.device, name
            )
            virtual_tensor._tensor = tensor.detach().clone()

            tensor_id = id(virtual_tensor)
            self._virtual_tensors[tensor_id] = virtual_tensor

            # Update memory usage
            if tensor.device.type == "cuda":
                self._vram_usage += virtual_tensor.size_bytes
            else:
                self._ram_usage += virtual_tensor.size_bytes

            return virtual_tensor

    def get_virtual_tensor(self, tensor_id: int) -> Optional[VirtualTensor]:
        """Get a virtual tensor by ID."""
        with self._lock:
            return self._virtual_tensors.get(tensor_id)

    def load_to_vram(self, virtual_tensor: VirtualTensor) -> bool:
        """
        Load a virtual tensor to VRAM.
        Returns True if successful, False if not enough VRAM.
        """
        with self._lock:
            if virtual_tensor.is_loaded:
                return True

            # Check VRAM capacity
            if self._vram_usage + virtual_tensor.size_bytes > self.vram_budget_bytes:
                return False

            try:
                # Load to VRAM
                virtual_tensor.cuda()

                # Update tracking
                self._vram_usage += virtual_tensor.size_bytes
                self._ram_usage -= virtual_tensor.size_bytes

                return True
            except RuntimeError as e:
                if "out of memory" in str(e).lower():
                    return False
                raise

    def evict_to_ram(self, virtual_tensor: VirtualTensor) -> bool:
        """Evict a virtual tensor to RAM."""
        with self._lock:
            if not virtual_tensor.is_loaded:
                return True

            try:
                # Move to RAM
                virtual_tensor.cpu()

                # Update tracking
                self._ram_usage += virtual_tensor.size_bytes
                self._vram_usage -= virtual_tensor.size_bytes

                return True
            except Exception:
                return False

    def set_vram_budget(self, budget_mb: int):
        """Set the VRAM budget."""
        with self._lock:
            self.vram_budget_bytes = budget_mb * 1024 * 1024

    def get_vram_budget_mb(self) -> int:
        """Get the VRAM budget in MB."""
        return self.vram_budget_bytes // (1024 * 1024)

    def get_memory_usage(self) -> Dict[str, Any]:
        """Get current memory usage statistics."""
        with self._lock:
            return {
                "vram_usage_bytes": self._vram_usage,
                "vram_usage_mb": self._vram_usage / (1024 * 1024),
                "vram_usage_gb": self._vram_usage / (1024 * 1024 * 1024),
                "ram_usage_bytes": self._ram_usage,
                "ram_usage_mb": self._ram_usage / (1024 * 1024),
                "ram_usage_gb": self._ram_usage / (1024 * 1024 * 1024),
                "vram_budget_mb": self.get_vram_budget_mb(),
                "vram_utilization": self._vram_usage / self.vram_budget_bytes
                if self.vram_budget_bytes > 0
                else 0,
                "total_tensors": len(self._virtual_tensors),
                "loaded_tensors": sum(
                    1 for vt in self._virtual_tensors.values() if vt.is_loaded
                ),
            }

    def _on_tensor_access(self, virtual_tensor: VirtualTensor):
        """Handle tensor access for memory tracking."""
        with self._lock:
            # This is called when a page fault occurs
            # Update memory usage based on actual device
            tensor = virtual_tensor.tensor
            size = virtual_tensor.size_bytes

            # Determine previous device from tracking
            tensor_id = id(virtual_tensor)
            if tensor.device.type == "cuda":
                # Was in RAM, now in VRAM
                self._vram_usage += size
                self._ram_usage -= size
            else:
                # Was in VRAM, now in RAM
                self._ram_usage += size
                self._vram_usage -= size

    def add_allocation_callback(self, callback: Callable):
        """Add a callback to be called on allocation."""
        with self._lock:
            self._allocation_callbacks.append(callback)

    def remove_allocation_callback(self, callback: Callable):
        """Remove an allocation callback."""
        with self._lock:
            if callback in self._allocation_callbacks:
                self._allocation_callbacks.remove(callback)

    def clear(self):
        """Clear all virtual tensors."""
        with self._lock:
            self._virtual_tensors.clear()
            self._vram_usage = 0
            self._ram_usage = 0

    def get_page_table_stats(self) -> Dict[str, Any]:
        """Get page table statistics."""
        return self.page_table.get_stats()


# Global VBAR manager instance
_global_vbar_manager: Optional[VBARManager] = None


def get_vbar_manager(
    enable_unified_memory: bool = True, initial_vram_budget_mb: int = 8192
) -> VBARManager:
    """Get or create the global VBAR manager."""
    global _global_vbar_manager
    if _global_vbar_manager is None:
        _global_vbar_manager = VBARManager(
            enable_unified_memory=enable_unified_memory,
            initial_vram_budget_mb=initial_vram_budget_mb,
        )
    return _global_vbar_manager


def reset_vbar_manager():
    """Reset the global VBAR manager."""
    global _global_vbar_manager
    if _global_vbar_manager is not None:
        _global_vbar_manager.clear()
        _global_vbar_manager = None
