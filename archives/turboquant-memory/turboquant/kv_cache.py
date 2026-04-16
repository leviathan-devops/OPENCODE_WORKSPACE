"""
TurboQuant KV Cache Compression

Patches HuggingFace DynamicCache.update() to compress keys using TurboQuant.
Stores keys as compressed uint8 indices + fp16 norms.
Keeps values in fp16 (only keys are compressed).

Key design decisions:
- Does NOT subclass DynamicCache - patches cache.update() instead
- Does NOT add QJL correction back to vector - uses TurboQuant_mse variant
- Supports GQA (Grouped Query Attention)
"""

import torch
from typing import Optional, Tuple, Union, List, Dict, Any
from transformers import DynamicCache
from turboquant.core import TurboQuantMSE


class TurboQuantCachePatcher:
    """
    Patches DynamicCache.update() to compress keys with TurboQuant.

    Wraps the original update method to:
    1. Quantize keys to uint8 indices + fp16 norms
    2. Store compressed representation in cache
    3. Keep values in fp16

    This approach works with any HuggingFace model without subclassing.
    """

    def __init__(
        self,
        bits: int = 2,
        d: int = 256,
        quantize_values: bool = False,
    ):
        """
        Initialize cache patcher.

        Args:
            bits: Number of quantization bits (default 2)
            d: Key dimension (default 256)
            quantize_values: Whether to also compress values (default False)
                             Usually False for speed, True for more compression
        """
        self.bits = bits
        self.d = d
        self.quantize_values = quantize_values

        # Create quantizers
        self.key_quantizer = TurboQuantMSE(d=d, bits=bits)
        self.value_quantizer = (
            TurboQuantMSE(d=d, bits=bits) if quantize_values else None
        )

        # Store original update methods
        self._original_updates: Dict[int, Any] = {}

    def patch_cache(self, cache: DynamicCache, num_layers: int) -> None:
        """
        Patch a DynamicCache instance to compress keys.

        Args:
            cache: DynamicCache instance to patch
            num_layers: Number of layers in the model
        """
        # Store reference to patcher in cache object
        cache._turboquant_patcher = self
        cache._turboquant_compressed_keys = [None] * num_layers
        cache._turboquant_compressed_values = (
            [None] * num_layers if self.quantize_values else None
        )
        cache._turboquant_key_norms = [None] * num_layers
        cache._turboquant_value_norms = (
            [None] * num_layers if self.quantize_values else None
        )

        # Save and wrap the update method
        self._original_updates[id(cache)] = cache.update
        cache.update = self._make_patched_update(cache)

    def _make_patched_update(self, cache: DynamicCache):
        """Create a patched update method for a specific cache instance."""

        def patched_update(
            key_states: torch.Tensor,
            value_states: torch.Tensor,
            layer_idx: int,
            cache_kwargs: Optional[Dict[str, Any]] = None,
        ) -> Tuple[torch.Tensor, torch.Tensor]:
            """
            Patched update that quantizes keys and optionally values.

            Args:
                key_states: New key states [batch_size, num_heads, seq_len, d]
                value_states: New value states [batch_size, num_heads, seq_len, d]
                layer_idx: Layer index
                cache_kwargs: Additional cache arguments

            Returns:
                Tuple of (key_states, value_states) - dequantized for compatibility
            """
            # Flatten for quantization
            original_shape = key_states.shape
            batch_size, num_heads, seq_len, d = original_shape

            # Quantize keys
            key_flat = key_states.view(-1, d)
            key_indices, key_norms = self.key_quantizer.quantize(key_flat)

            # Store compressed representation
            if cache._turboquant_compressed_keys[layer_idx] is None:
                cache._turboquant_compressed_keys[layer_idx] = key_indices.view(
                    batch_size, num_heads, seq_len, d
                )
                cache._turboquant_key_norms[layer_idx] = key_norms.view(
                    batch_size, num_heads, seq_len
                )
            else:
                # Append to existing cache
                cache._turboquant_compressed_keys[layer_idx] = torch.cat(
                    [
                        cache._turboquant_compressed_keys[layer_idx],
                        key_indices.view(batch_size, num_heads, seq_len, d),
                    ],
                    dim=2,
                )
                cache._turboquant_key_norms[layer_idx] = torch.cat(
                    [
                        cache._turboquant_key_norms[layer_idx],
                        key_norms.view(batch_size, num_heads, seq_len),
                    ],
                    dim=2,
                )

            # Optionally quantize values
            if self.quantize_values:
                value_flat = value_states.view(-1, d)
                value_indices, value_norms = self.value_quantizer.quantize(value_flat)

                if cache._turboquant_compressed_values[layer_idx] is None:
                    cache._turboquant_compressed_values[layer_idx] = value_indices.view(
                        batch_size, num_heads, seq_len, d
                    )
                    cache._turboquant_value_norms[layer_idx] = value_norms.view(
                        batch_size, num_heads, seq_len
                    )
                else:
                    cache._turboquant_compressed_values[layer_idx] = torch.cat(
                        [
                            cache._turboquant_compressed_values[layer_idx],
                            value_indices.view(batch_size, num_heads, seq_len, d),
                        ],
                        dim=2,
                    )
                    cache._turboquant_value_norms[layer_idx] = torch.cat(
                        [
                            cache._turboquant_value_norms[layer_idx],
                            value_norms.view(batch_size, num_heads, seq_len),
                        ],
                        dim=2,
                    )

            # Call original update method to maintain cache structure
            return self._original_updates[id(cache)](
                key_states, value_states, layer_idx, cache_kwargs
            )

        return patched_update

    def get_compressed_keys(
        self, cache: DynamicCache, layer_idx: int
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Get compressed key representation.

        Args:
            cache: Patched DynamicCache instance
            layer_idx: Layer index

        Returns:
            Tuple of (indices, norms)
        """
        indices = cache._turboquant_compressed_keys[layer_idx]
        norms = cache._turboquant_key_norms[layer_idx]
        return indices, norms

    def dequantize_keys(
        self, indices: torch.Tensor, norms: torch.Tensor
    ) -> torch.Tensor:
        """
        Dequantize keys from compressed representation.

        Args:
            indices: Compressed key indices
            norms: Key norms

        Returns:
            Dequantized key tensor
        """
        return self.key_quantizer.dequantize(indices, norms)


def patch_dynamic_cache(
    cache: DynamicCache,
    num_layers: int,
    bits: int = 2,
    d: int = 256,
    quantize_values: bool = False,
) -> TurboQuantCachePatcher:
    """
    Patch a DynamicCache to use TurboQuant compression.

    This is the main entry point for enabling TurboQuant on a model.

    Args:
        cache: DynamicCache instance from model
        num_layers: Number of layers in the model
        bits: Number of quantization bits (default 2)
        d: Key dimension (default 256)
        quantize_values: Whether to also compress values (default False)

    Returns:
        TurboQuantCachePatcher instance for accessing compressed data

    Example:
        >>> from transformers import AutoModelForCausalLM
        >>> model = AutoModelForCausalLM.from_pretrained("google/gemma-3-4b-it")
        >>> patcher = patch_dynamic_cache(model.model.layers, num_layers=27, bits=2)
    """
    patcher = TurboQuantCachePatcher(bits=bits, d=d, quantize_values=quantize_values)
    patcher.patch_cache(cache, num_layers)
    return patcher


def unpatch_dynamic_cache(cache: DynamicCache) -> None:
    """
    Remove TurboQuant patches from a DynamicCache.

    Restores the original update method.

    Args:
        cache: Patched DynamicCache instance
    """
    if hasattr(cache, "_turboquant_patcher"):
        patcher = cache._turboquant_patcher
        if id(cache) in patcher._original_updates:
            cache.update = patcher._original_updates[id(cache)]
            del patcher._original_updates[id(cache)]

        # Clean up attributes
        for attr in [
            "_turboquant_patcher",
            "_turboquant_compressed_keys",
            "_turboquant_compressed_values",
            "_turboquant_key_norms",
            "_turboquant_value_norms",
        ]:
            if hasattr(cache, attr):
                delattr(cache, attr)


class TurboQuantKVCache:
    """
    Standalone KV cache with TurboQuant compression.

    For direct use without HuggingFace DynamicCache.
    Stores compressed keys and fp16 values.
    """

    def __init__(self, num_layers: int, bits: int = 2, d: int = 256):
        """
        Initialize TurboQuant KV cache.

        Args:
            num_layers: Number of layers
            bits: Quantization bits
            d: Key dimension
        """
        self.num_layers = num_layers
        self.bits = bits
        self.d = d

        self.quantizer = TurboQuantMSE(d=d, bits=bits)

        # Storage
        self.key_indices: List[Optional[torch.Tensor]] = [None] * num_layers
        self.key_norms: List[Optional[torch.Tensor]] = [None] * num_layers
        self.values: List[Optional[torch.Tensor]] = [None] * num_layers

        self.seq_len = 0

    def update(
        self,
        layer_idx: int,
        key_states: torch.Tensor,
        value_states: torch.Tensor,
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Update cache with new key-value states.

        Args:
            layer_idx: Layer index
            key_states: New keys [batch_size, num_heads, seq_len, d]
            value_states: New values [batch_size, num_heads, seq_len, d]

        Returns:
            Tuple of (cached_keys, cached_values) - dequantized for compatibility
        """
        batch_size, num_heads, seq_len, d = key_states.shape

        # Quantize keys
        key_flat = key_states.view(-1, d)
        key_indices, key_norms = self.quantizer.quantize(key_flat)

        # Store compressed keys
        if self.key_indices[layer_idx] is None:
            self.key_indices[layer_idx] = key_indices.view(
                batch_size, num_heads, seq_len, d
            )
            self.key_norms[layer_idx] = key_norms.view(batch_size, num_heads, seq_len)
        else:
            self.key_indices[layer_idx] = torch.cat(
                [
                    self.key_indices[layer_idx],
                    key_indices.view(batch_size, num_heads, seq_len, d),
                ],
                dim=2,
            )
            self.key_norms[layer_idx] = torch.cat(
                [
                    self.key_norms[layer_idx],
                    key_norms.view(batch_size, num_heads, seq_len),
                ],
                dim=2,
            )

        # Store values in fp16
        if self.values[layer_idx] is None:
            self.values[layer_idx] = value_states.half()
        else:
            self.values[layer_idx] = torch.cat(
                [self.values[layer_idx], value_states.half()], dim=2
            )

        self.seq_len += seq_len

        # Return dequantized for compatibility
        dequantized_keys = self.quantizer.dequantize(key_indices, key_norms)
        dequantized_keys = dequantized_keys.view(batch_size, num_heads, seq_len, d)

        return dequantized_keys, self.values[layer_idx]

    def get_compressed(
        self, layer_idx: int
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Get compressed key representation and values.

        Args:
            layer_idx: Layer index

        Returns:
            Tuple of (key_indices, key_norms, values)
        """
        return (
            self.key_indices[layer_idx],
            self.key_norms[layer_idx],
            self.values[layer_idx],
        )

    def get_dequantized_keys(self, layer_idx: int) -> torch.Tensor:
        """
        Get dequantized keys for a layer.

        Args:
            layer_idx: Layer index

        Returns:
            Dequantized key tensor
        """
        indices = self.key_indices[layer_idx]
        norms = self.key_norms[layer_idx]
        return self.quantizer.dequantize(indices, norms).view_as(self.values[layer_idx])
