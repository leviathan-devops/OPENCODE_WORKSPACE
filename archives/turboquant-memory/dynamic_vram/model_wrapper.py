"""
Transparent Model Wrapper

Wraps PyTorch models for dynamic VRAM with automatic layer offloading.
Loads layers on-demand during inference with minimal performance impact.
"""

import torch
import torch.nn as nn
from typing import Optional, Dict, List, Any, Set, Tuple, Callable
from dataclasses import dataclass, field
from collections import OrderedDict
import weakref
import time
from contextlib import contextmanager

from .allocator import VRAMAllocator, get_allocator
from .vbar_manager import VBARManager, VirtualTensor, get_vbar_manager


@dataclass
class LayerConfig:
    """Configuration for a model layer."""

    name: str
    module: nn.Module
    offload_to_ram: bool = True
    load_on_access: bool = True
    pin_weights: bool = False
    priority: int = 0  # Higher priority layers stay in VRAM longer


@dataclass
class OffloadStats:
    """Statistics for model offloading."""

    layer_loads: int = 0
    layer_evictions: int = 0
    total_load_time: float = 0.0
    total_evict_time: float = 0.0
    cache_hits: int = 0
    cache_misses: int = 0

    @property
    def avg_load_time(self) -> float:
        return self.total_load_time / self.layer_loads if self.layer_loads > 0 else 0

    @property
    def avg_evict_time(self) -> float:
        return (
            self.total_evict_time / self.layer_evictions
            if self.layer_evictions > 0
            else 0
        )

    @property
    def overhead_percent(self) -> float:
        """Calculate performance overhead percentage."""
        total_time = self.total_load_time + self.total_evict_time
        return (total_time / max(1, self.layer_loads + self.layer_evictions)) * 100


class WrappedLayer(nn.Module):
    """
    Wrapper for a single model layer that handles dynamic loading.
    """

    def __init__(
        self,
        layer: nn.Module,
        name: str,
        allocator: Optional[VRAMAllocator] = None,
        vbar_manager: Optional[VBARManager] = None,
    ):
        super().__init__()
        self.layer = layer
        self.name = name
        self.allocator = allocator or get_allocator()
        self.vbar_manager = vbar_manager or get_vbar_manager()
        self._tensor_ids: Dict[str, int] = {}
        self._is_loaded = False

        # Register layer parameters
        self._register_parameters()

    def _register_parameters(self):
        """Register layer parameters with the allocator."""
        for param_name, param in self.layer.named_parameters():
            if param.is_cuda:
                tensor_id = self.allocator.register_tensor(
                    param, f"{self.name}.{param_name}", pin=False
                )
                self._tensor_ids[param_name] = tensor_id

    def _load_layer(self):
        """Load the layer to VRAM."""
        if self._is_loaded:
            return

        start_time = time.time()

        # Load all parameters
        for param_name, tensor_id in self._tensor_ids.items():
            self.allocator.load_to_vram(tensor_id)

        self._is_loaded = True

        # Update VBAR manager
        for param_name, param in self.layer.named_parameters():
            if param.is_cuda:
                # The parameter is now in VRAM
                pass

    def _evict_layer(self):
        """Evict the layer to RAM."""
        if not self._is_loaded:
            return

        start_time = time.time()

        # Evict all parameters
        for tensor_id in self._tensor_ids.values():
            self.allocator.evict_to_ram([tensor_id])

        self._is_loaded = False

    def forward(self, *args, **kwargs):
        """Forward pass with automatic layer loading."""
        # Load layer if needed
        if not self._is_loaded:
            self._load_layer()

        # Mark as recently used
        for tensor_id in self._tensor_ids.values():
            self.allocator.touch_tensor(tensor_id)

        # Forward through the layer
        return self.layer(*args, **kwargs)

    def load(self):
        """Manually load the layer."""
        self._load_layer()

    def evict(self):
        """Manually evict the layer."""
        self._evict_layer()


class DynamicModelWrapper(nn.Module):
    """
    Transparent wrapper for PyTorch models with dynamic VRAM.

    Automatically offloads unused layers to RAM and loads them on-demand
    during inference. Works with vLLM and HuggingFace models.
    """

    def __init__(
        self,
        model: nn.Module,
        vram_budget_mb: int = 8192,
        offload_ratio: float = 0.5,
        enable_vbar: bool = True,
        allocator: Optional[VRAMAllocator] = None,
        vbar_manager: Optional[VBARManager] = None,
    ):
        super().__init__()
        self.model = model
        self.vram_budget_mb = vram_budget_mb
        self.offload_ratio = offload_ratio
        self.enable_vbar = enable_vbar

        # Initialize managers
        self.allocator = allocator or get_allocator()
        self.vbar_manager = vbar_manager or get_vbar_manager(
            enable_unified_memory=True, initial_vram_budget_mb=vram_budget_mb
        )

        # Layer management
        self._wrapped_layers: Dict[str, WrappedLayer] = OrderedDict()
        self._layer_configs: Dict[str, LayerConfig] = OrderedDict()
        self._stats = OffloadStats()

        # Configuration
        self._offload_enabled = True
        self._inference_mode = False

        # Wrap the model
        self._wrap_model()

    def _wrap_model(self):
        """Wrap model layers for dynamic offloading."""
        # Identify layers to wrap
        layers_to_wrap = self._identify_layers()

        # Wrap each layer
        for layer_name, layer_module in layers_to_wrap.items():
            wrapped_layer = WrappedLayer(
                layer_module, layer_name, self.allocator, self.vbar_manager
            )
            self._wrapped_layers[layer_name] = wrapped_layer

            # Store original module for reference
            self.add_module(f"wrapped_{layer_name}", wrapped_layer)

            # Create configuration
            self._layer_configs[layer_name] = LayerConfig(
                name=layer_name,
                module=layer_module,
                offload_to_ram=True,
                load_on_access=True,
                pin_weights=False,
                priority=0,
            )

    def _identify_layers(self) -> Dict[str, nn.Module]:
        """Identify layers that should be wrapped."""
        layers = OrderedDict()

        # Common patterns for transformer layers
        transformer_patterns = [
            "layers",
            "encoder.layers",
            "decoder.layers",
            "transformer.h",
            "model.layers",
            "model.decoder.layers",
        ]

        # Try to find transformer layers
        for pattern in transformer_patterns:
            parts = pattern.split(".")
            current = self.model

            try:
                for part in parts:
                    current = getattr(current, part)

                # If we got here, we found the layers
                if isinstance(current, nn.ModuleList):
                    for i, layer in enumerate(current):
                        layers[f"{pattern}.{i}"] = layer
                    break
                elif isinstance(current, nn.Sequential):
                    for i, layer in enumerate(current):
                        layers[f"{pattern}.{i}"] = layer
                    break
            except AttributeError:
                continue

        # If no transformer layers found, wrap major submodules
        if not layers:
            for name, module in self.model.named_children():
                if isinstance(module, (nn.Linear, nn.Conv2d, nn.MultiheadAttention)):
                    # Don't wrap small layers
                    param_count = sum(p.numel() for p in module.parameters())
                    if param_count > 1000:  # Only wrap layers with >1K parameters
                        layers[name] = module

        return layers

    def _get_wrapped_forward(self, original_forward: Callable) -> Callable:
        """Create a wrapped forward method."""

        def wrapped_forward(*args, **kwargs):
            self._inference_mode = True
            try:
                return original_forward(*args, **kwargs)
            finally:
                self._inference_mode = False

        return wrapped_forward

    def configure_layer(
        self,
        layer_name: str,
        offload_to_ram: Optional[bool] = None,
        load_on_access: Optional[bool] = None,
        pin_weights: Optional[bool] = None,
        priority: Optional[int] = None,
    ):
        """Configure offloading behavior for a specific layer."""
        if layer_name not in self._layer_configs:
            raise ValueError(f"Layer {layer_name} not found")

        config = self._layer_configs[layer_name]

        if offload_to_ram is not None:
            config.offload_to_ram = offload_to_ram
        if load_on_access is not None:
            config.load_on_access = load_on_access
        if pin_weights is not None:
            config.pin_weights = pin_weights
            if pin_weights:
                self.allocator.pin_tensor(
                    self._wrapped_layers[layer_name]._tensor_ids.get("", 0), True
                )
        if priority is not None:
            config.priority = priority

    def load_layer(self, layer_name: str):
        """Manually load a specific layer."""
        if layer_name in self._wrapped_layers:
            self._wrapped_layers[layer_name].load()

    def evict_layer(self, layer_name: str):
        """Manually evict a specific layer."""
        if layer_name in self._wrapped_layers:
            self._wrapped_layers[layer_name].evict()

    def load_all_layers(self):
        """Load all layers to VRAM."""
        for layer in self._wrapped_layers.values():
            layer.load()

    def evict_all_layers(self):
        """Evict all layers to RAM."""
        for layer in self._wrapped_layers.values():
            layer.evict()

    def preload_layers(self, layer_names: List[str]):
        """Preload specific layers to VRAM."""
        for name in layer_names:
            self.load_layer(name)

    def get_layer_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all wrapped layers."""
        status = {}
        for name, layer in self._wrapped_layers.items():
            config = self._layer_configs[name]
            status[name] = {
                "loaded": layer._is_loaded,
                "offload_to_ram": config.offload_to_ram,
                "pin_weights": config.pin_weights,
                "priority": config.priority,
            }
        return status

    def get_memory_usage(self) -> Dict[str, Any]:
        """Get current memory usage."""
        allocator_stats = self.allocator.get_stats()
        vbar_stats = self.vbar_manager.get_memory_usage()

        return {
            "allocator": {
                "vram_allocated_mb": allocator_stats.vram_usage_mb,
                "ram_allocated_mb": allocator_stats.ram_usage_mb,
                "vram_tensors": allocator_stats.vram_tensors,
                "ram_tensors": allocator_stats.ram_tensors,
                "eviction_count": allocator_stats.eviction_count,
                "migration_count": allocator_stats.migration_count,
            },
            "vbar": vbar_stats,
            "offload_stats": {
                "layer_loads": self._stats.layer_loads,
                "layer_evictions": self._stats.layer_evictions,
                "cache_hits": self._stats.cache_hits,
                "cache_misses": self._stats.cache_misses,
                "overhead_percent": self._stats.overhead_percent,
            },
        }

    def enable_offloading(self, enable: bool = True):
        """Enable or disable layer offloading."""
        self._offload_enabled = enable
        if not enable:
            self.load_all_layers()

    def set_vram_budget(self, budget_mb: int):
        """Set the VRAM budget."""
        self.vram_budget_mb = budget_mb
        self.vbar_manager.set_vram_budget(budget_mb)

    def get_stats(self) -> OffloadStats:
        """Get offloading statistics."""
        return OffloadStats(**self._stats.__dict__)

    def reset_stats(self):
        """Reset offloading statistics."""
        self._stats = OffloadStats()

    @contextmanager
    def no_offloading(self):
        """Context manager to temporarily disable offloading."""
        was_enabled = self._offload_enabled
        self.enable_offloading(False)
        try:
            yield
        finally:
            self.enable_offloading(was_enabled)

    def forward(self, *args, **kwargs):
        """
        Forward pass through the wrapped model.

        The wrapped model's forward pass automatically handles layer loading
        and eviction through the WrappedLayer instances.
        """
        # If offloading is disabled, load all layers
        if not self._offload_enabled:
            self.load_all_layers()

        # Forward through the original model
        return self.model(*args, **kwargs)

    def __getattr__(self, name: str):
        """Delegate attribute access to the wrapped model."""
        if name.startswith("_"):
            return super().__getattr__(name)

        # Try to get from self first
        try:
            return super().__getattr__(name)
        except AttributeError:
            pass

        # Delegate to wrapped model
        return getattr(self.model, name)

    def to(self, device):
        """Move the model to a device."""
        self.model = self.model.to(device)
        return super().to(device)

    def eval(self):
        """Set the model to evaluation mode."""
        self.model.eval()
        return super().eval()

    def train(self, mode=True):
        """Set the model to training mode."""
        self.model.train(mode)
        return super().train(mode)


def wrap_model(
    model: nn.Module,
    vram_budget_mb: int = 8192,
    offload_ratio: float = 0.5,
    enable_vbar: bool = True,
) -> DynamicModelWrapper:
    """
    Wrap a PyTorch model for dynamic VRAM.

    Args:
        model: The PyTorch model to wrap
        vram_budget_mb: VRAM budget in MB (default: 8GB)
        offload_ratio: Ratio of layers to offload (default: 0.5)
        enable_vbar: Enable VBAR-based virtualization (default: True)

    Returns:
        A DynamicModelWrapper instance

    Example:
        >>> model = AutoModel.from_pretrained("...")
        >>> wrapped_model = wrap_model(model, vram_budget_mb=8192)
        >>> output = wrapped_model(input_ids)
    """
    return DynamicModelWrapper(
        model=model,
        vram_budget_mb=vram_budget_mb,
        offload_ratio=offload_ratio,
        enable_vbar=enable_vbar,
    )


class ModelOffloader:
    """
    Utility class for offloading model layers.
    Provides finer-grained control over layer offloading.
    """

    def __init__(
        self,
        model: nn.Module,
        vram_budget_mb: int = 8192,
        offload_strategy: str = "lru",
    ):
        self.model = model
        self.vram_budget_mb = vram_budget_mb
        self.offload_strategy = offload_strategy

        self.allocator = get_allocator()
        self._layer_states: Dict[str, str] = {}  # "vram", "ram", "disk"
        self._access_times: Dict[str, float] = {}

    def offload_layer(self, layer_name: str):
        """Offload a specific layer to RAM."""
        for name, param in self.model.named_parameters():
            if layer_name in name and param.is_cuda:
                param.data = param.data.cpu()
                self._layer_states[name] = "ram"

    def load_layer(self, layer_name: str):
        """Load a specific layer to VRAM."""
        for name, param in self.model.named_parameters():
            if layer_name in name and not param.is_cuda:
                param.data = param.data.cuda()
                self._layer_states[name] = "vram"
                self._access_times[name] = time.time()

    def auto_offload(self):
        """Automatically offload layers based on strategy."""
        if self.offload_strategy == "lru":
            self._lru_offload()
        elif self.offload_strategy == "random":
            self._random_offload()

    def _lru_offload(self):
        """Offload least recently used layers."""
        # Sort by access time
        sorted_layers = sorted(self._access_times.items(), key=lambda x: x[1])

        # Offload oldest layers
        bytes_freed = 0
        target_bytes = self.vram_budget_mb * 1024 * 1024 * 0.8

        for name, _ in sorted_layers:
            if bytes_freed >= target_bytes:
                break
            self.offload_layer(name.split(".")[0])
            # Calculate bytes freed...

    def _random_offload(self):
        """Randomly offload layers."""
        pass
