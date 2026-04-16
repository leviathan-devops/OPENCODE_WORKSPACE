"""
vLLM Integration

Patches vLLM to use Dynamic VRAM, configures VRAM budget,
enables model offloading, and provides enable/disable functions.
"""

import torch
import sys
import warnings
from typing import Optional, Dict, List, Any, Callable
from dataclasses import dataclass, field
from contextlib import contextmanager

from .allocator import VRAMAllocator, AllocationConfig, get_allocator
from .vbar_manager import VBARManager, get_vbar_manager
from .model_wrapper import DynamicModelWrapper, wrap_model


@dataclass
class VLLMConfig:
    """Configuration for vLLM integration."""

    vram_budget_mb: int = 8192
    enable_offloading: bool = True
    offload_ratio: float = 0.5
    enable_vbar: bool = True
    enable_kv_cache_offload: bool = True
    preload_layers: List[str] = field(default_factory=list)
    pin_weights: bool = False

    def to_vllm_args(self) -> Dict[str, Any]:
        """Convert to vLLM engine arguments."""
        return {
            "gpu_memory_utilization": self.vram_budget_mb
            / (torch.cuda.get_device_properties(0).total_memory / (1024 * 1024))
            if torch.cuda.is_available()
            else 0.9,
            "enforce_eager": True,  # Disable CUDA graphs for dynamic offloading
        }


class VLLMPatcher:
    """
    Patches vLLM to use Dynamic VRAM.

    Intercepts model creation and inference to enable automatic layer offloading.
    """

    def __init__(self, config: Optional[VLLMConfig] = None):
        self.config = config or VLLMConfig()
        self.allocator = get_allocator(
            AllocationConfig(vram_budget_mb=self.config.vram_budget_mb)
        )
        self.vbar_manager = get_vbar_manager(
            enable_unified_memory=self.config.enable_vbar,
            initial_vram_budget_mb=self.config.vram_budget_mb,
        )
        self._original_model_loader = None
        self._is_patched = False
        self._wrapped_model: Optional[DynamicModelWrapper] = None

    def patch(self):
        """Patch vLLM to use Dynamic VRAM."""
        if self._is_patched:
            warnings.warn("vLLM is already patched")
            return

        try:
            # Try to import vLLM
            import vllm
            from vllm.model_executor.models import ModelLoader
            from vllm.model_executor.model_loader.tensorizer import TensorizerLoader

            # Patch model loader
            self._original_model_loader = ModelLoader.load_model

            def patched_load_model(self, *args, **kwargs):
                # Load the original model
                model = self._original_model_loader(*args, **kwargs)

                # Wrap with Dynamic VRAM
                if self.config.enable_offloading:
                    wrapped = wrap_model(
                        model,
                        vram_budget_mb=self.config.vram_budget_mb,
                        offload_ratio=self.config.offload_ratio,
                        enable_vbar=self.config.enable_vbar,
                    )
                    self._wrapped_model = wrapped
                    return wrapped

                return model

            ModelLoader.load_model = patched_load_model

            self._is_patched = True
            print("vLLM patched successfully")

        except ImportError as e:
            warnings.warn(f"vLLM not available: {e}")
            raise
        except Exception as e:
            warnings.warn(f"Failed to patch vLLM: {e}")
            raise

    def unpatch(self):
        """Restore original vLLM functions."""
        if not self._is_patched:
            return

        try:
            import vllm
            from vllm.model_executor.models import ModelLoader

            if self._original_model_loader:
                ModelLoader.load_model = self._original_model_loader

            self._is_patched = False
            self._wrapped_model = None
            print("vLLM unpatched successfully")

        except ImportError:
            pass
        except Exception as e:
            warnings.warn(f"Failed to unpatch vLLM: {e}")

    def is_patched(self) -> bool:
        """Check if vLLM is patched."""
        return self._is_patched

    def get_wrapped_model(self) -> Optional[DynamicModelWrapper]:
        """Get the wrapped model."""
        return self._wrapped_model


class DynamicVRAMEngine:
    """
    vLLM Engine wrapper that uses Dynamic VRAM.

    Provides a drop-in replacement for vLLM's LLMEngine with Dynamic VRAM support.
    """

    def __init__(
        self, model_path: str, config: Optional[VLLMConfig] = None, **vllm_kwargs
    ):
        """
        Initialize the Dynamic VRAM Engine.

        Args:
            model_path: Path to the model
            config: Dynamic VRAM configuration
            **vllm_kwargs: Additional arguments for vLLM LLMEngine
        """
        self.config = config or VLLMConfig()
        self._patcher = VLLMPatcher(self.config)

        # Update vLLM arguments with our configuration
        vllm_kwargs.update(self.config.to_vllm_args())

        # Patch vLLM
        self._patcher.patch()

        try:
            # Import and create vLLM engine
            from vllm import LLMEngine

            self.engine = LLMEngine.from_engine_args(model_path, **vllm_kwargs)

            # Preload specified layers
            if self.config.preload_layers:
                wrapped_model = self._patcher.get_wrapped_model()
                if wrapped_model:
                    wrapped_model.preload_layers(self.config.preload_layers)

        except Exception as e:
            # Unpatch on error
            self._patcher.unpatch()
            raise

    def __getattr__(self, name: str):
        """Delegate to the underlying vLLM engine."""
        return getattr(self.engine, name)

    def get_memory_usage(self) -> Dict[str, Any]:
        """Get current memory usage."""
        wrapped_model = self._patcher.get_wrapped_model()
        if wrapped_model:
            return wrapped_model.get_memory_usage()
        return {}

    def get_layer_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all layers."""
        wrapped_model = self._patcher.get_wrapped_model()
        if wrapped_model:
            return wrapped_model.get_layer_status()
        return {}

    def __del__(self):
        """Cleanup on deletion."""
        if hasattr(self, "_patcher"):
            self._patcher.unpatch()


class DynamicVRAMLLM:
    """
    vLLM LLM wrapper with Dynamic VRAM support.

    Provides a high-level API similar to vLLM's LLM class.
    """

    def __init__(self, model: str, config: Optional[VLLMConfig] = None, **kwargs):
        """
        Initialize Dynamic VRAM LLM.

        Args:
            model: Model name or path
            config: Dynamic VRAM configuration
            **kwargs: Additional arguments for vLLM
        """
        self.config = config or VLLMConfig()
        self._patcher = VLLMPatcher(self.config)
        self._patcher.patch()

        try:
            # Import vLLM
            from vllm import LLM

            # Update kwargs with our configuration
            vllm_kwargs = kwargs.copy()
            vllm_kwargs.update(self.config.to_vllm_args())

            # Create vLLM LLM
            self.llm = LLM(model=model, **vllm_kwargs)

            # Get wrapped model for memory management
            self._wrapped_model = self._patcher.get_wrapped_model()

        except Exception as e:
            self._patcher.unpatch()
            raise

    def generate(self, prompts: List[str], **kwargs) -> List[Any]:
        """Generate text using the model."""
        return self.llm.generate(prompts, **kwargs)

    def get_memory_usage(self) -> Dict[str, Any]:
        """Get current memory usage."""
        if self._wrapped_model:
            return self._wrapped_model.get_memory_usage()
        return {}

    def get_layer_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all layers."""
        if self._wrapped_model:
            return self._wrapped_model.get_layer_status()
        return {}

    def enable_offloading(self, enable: bool = True):
        """Enable or disable layer offloading."""
        if self._wrapped_model:
            self._wrapped_model.enable_offloading(enable)

    def set_vram_budget(self, budget_mb: int):
        """Set the VRAM budget."""
        self.config.vram_budget_mb = budget_mb
        if self._wrapped_model:
            self._wrapped_model.set_vram_budget(budget_mb)

    def __del__(self):
        """Cleanup on deletion."""
        if hasattr(self, "_patcher"):
            self._patcher.unpatch()


# Global patcher instance
_global_patcher: Optional[VLLMPatcher] = None


def enable_dynamic_vram(config: Optional[VLLMConfig] = None) -> bool:
    """
    Enable Dynamic VRAM for vLLM.

    Args:
        config: Optional configuration for Dynamic VRAM

    Returns:
        True if successful, False otherwise

    Example:
        >>> from dynamic_vram import enable_dynamic_vram
        >>> enable_dynamic_vram(VLLMConfig(vram_budget_mb=8192))
        >>> from vllm import LLM
        >>> llm = LLM("meta-llama/Llama-2-7b-hf")
    """
    global _global_patcher

    if _global_patcher is not None:
        warnings.warn("Dynamic VRAM is already enabled")
        return True

    try:
        _global_patcher = VLLMPatcher(config)
        _global_patcher.patch()
        return True
    except Exception as e:
        warnings.warn(f"Failed to enable Dynamic VRAM: {e}")
        return False


def disable_dynamic_vram() -> bool:
    """
    Disable Dynamic VRAM for vLLM.

    Returns:
        True if successful, False otherwise
    """
    global _global_patcher

    if _global_patcher is None:
        warnings.warn("Dynamic VRAM is not enabled")
        return False

    try:
        _global_patcher.unpatch()
        _global_patcher = None
        return True
    except Exception as e:
        warnings.warn(f"Failed to disable Dynamic VRAM: {e}")
        return False


def is_enabled() -> bool:
    """Check if Dynamic VRAM is enabled for vLLM."""
    global _global_patcher
    return _global_patcher is not None and _global_patcher.is_patched()


def get_config() -> Optional[VLLMConfig]:
    """Get the current Dynamic VRAM configuration."""
    global _global_patcher
    if _global_patcher is not None:
        return _global_patcher.config
    return None


def set_vram_budget(budget_mb: int):
    """Set the VRAM budget."""
    global _global_patcher
    if _global_patcher is not None:
        _global_patcher.config.vram_budget_mb = budget_mb


def get_memory_usage() -> Dict[str, Any]:
    """Get current memory usage from the wrapped model."""
    global _global_patcher
    if _global_patcher is not None:
        wrapped_model = _global_patcher.get_wrapped_model()
        if wrapped_model is not None:
            return wrapped_model.get_memory_usage()
    return {}


@contextmanager
def dynamic_vram_context(config: Optional[VLLMConfig] = None):
    """
    Context manager for temporarily enabling Dynamic VRAM.

    Example:
        >>> with dynamic_vram_context(VLLMConfig(vram_budget_mb=8192)):
        ...     llm = LLM("meta-llama/Llama-2-7b-hf")
        ...     output = llm.generate(["Hello world"])
    """
    enable_dynamic_vram(config)
    try:
        yield
    finally:
        disable_dynamic_vram()


# HuggingFace integration helpers
class HuggingFaceIntegration:
    """
    Helper class for integrating Dynamic VRAM with HuggingFace models.
    """

    @staticmethod
    def from_pretrained(
        model_name: str, config: Optional[VLLMConfig] = None, **kwargs
    ) -> DynamicModelWrapper:
        """
        Load a HuggingFace model with Dynamic VRAM.

        Args:
            model_name: Model name or path
            config: Dynamic VRAM configuration
            **kwargs: Additional arguments for from_pretrained

        Returns:
            Wrapped model with Dynamic VRAM
        """
        try:
            from transformers import AutoModel, AutoModelForCausalLM
        except ImportError:
            raise ImportError(
                "transformers library is required for HuggingFace integration"
            )

        cfg = config or VLLMConfig()

        # Determine if it's a causal language model
        is_causal = kwargs.pop("is_causal", True)
        ModelClass = AutoModelForCausalLM if is_causal else AutoModel

        # Load model
        model = ModelClass.from_pretrained(model_name, **kwargs)

        # Wrap with Dynamic VRAM
        wrapped = wrap_model(
            model,
            vram_budget_mb=cfg.vram_budget_mb,
            offload_ratio=cfg.offload_ratio,
            enable_vbar=cfg.enable_vbar,
        )

        # Preload layers if specified
        if cfg.preload_layers:
            wrapped.preload_layers(cfg.preload_layers)

        return wrapped

    @staticmethod
    def create_pipeline(
        model: DynamicModelWrapper,
        tokenizer_name: Optional[str] = None,
        **pipeline_kwargs,
    ):
        """
        Create a HuggingFace pipeline with Dynamic VRAM.
        """
        try:
            from transformers import pipeline, AutoTokenizer
        except ImportError:
            raise ImportError(
                "transformers library is required for HuggingFace integration"
            )

        if tokenizer_name is None:
            tokenizer_name = pipeline_kwargs.get("model", None)

        tokenizer = (
            AutoTokenizer.from_pretrained(tokenizer_name) if tokenizer_name else None
        )

        # Create custom pipeline that uses the wrapped model
        return pipeline(
            task=pipeline_kwargs.get("task", "text-generation"),
            model=model,
            tokenizer=tokenizer,
            **{
                k: v for k, v in pipeline_kwargs.items() if k != "task" and k != "model"
            },
        )


# Utility functions
def estimate_model_size(model_name: str) -> float:
    """
    Estimate the size of a model in GB.

    Args:
        model_name: Model name or path

    Returns:
        Estimated size in GB
    """
    try:
        from transformers import AutoConfig
    except ImportError:
        return 0.0

    try:
        config = AutoConfig.from_pretrained(model_name)

        # Estimate based on parameters
        if hasattr(config, "num_parameters"):
            num_params = config.num_parameters
        elif hasattr(config, "hidden_size"):
            # Rough estimation
            hidden_size = config.hidden_size
            num_layers = getattr(config, "num_hidden_layers", 24)
            vocab_size = getattr(config, "vocab_size", 32000)
            num_params = num_layers * (
                hidden_size * hidden_size * 4 + hidden_size * vocab_size
            )
        else:
            return 0.0

        # Convert to GB (assuming float16)
        size_gb = (num_params * 2) / (1024**3)
        return size_gb

    except Exception:
        return 0.0


def get_recommended_config(model_name: str) -> VLLMConfig:
    """
    Get recommended Dynamic VRAM configuration for a model.

    Args:
        model_name: Model name or path

    Returns:
        Recommended configuration
    """
    model_size_gb = estimate_model_size(model_name)

    if model_size_gb <= 7:
        # Small model fits in 8GB VRAM
        return VLLMConfig(vram_budget_mb=8192, offload_ratio=0.0)
    elif model_size_gb <= 15:
        # Medium model needs some offloading
        return VLLMConfig(vram_budget_mb=8192, offload_ratio=0.3)
    else:
        # Large model needs significant offloading
        return VLLMConfig(vram_budget_mb=8192, offload_ratio=0.5)
