"""
TurboQuant vLLM Rollback Script

Removes TurboQuant patches from vLLM and restores original behavior.

Usage:
    from turboquant.disable_vllm import disable_turboquant_vllm
    disable_turboquant_vllm(llm)
"""

from typing import Optional
import warnings


def disable_turboquant_vllm(model) -> None:
    """
    Remove TurboQuant patches from a vLLM model.

    This function removes all TurboQuant-related modifications and restores
    the original vLLM behavior.

    Args:
        model: vLLM LLM instance that was previously patched with enable_turboquant_vllm

    Example:
        >>> from vllm import LLM
        >>> from turboquant.enable_vllm import enable_turboquant_vllm
        >>> from turboquant.disable_vllm import disable_turboquant_vllm
        >>>
        >>> llm = LLM("google/gemma-3-4b-it")
        >>> patcher = enable_turboquant_vllm(llm, bits=2)
        >>> # ... use model ...
        >>> disable_turboquant_vllm(llm)
    """
    print("Removing TurboQuant patches from vLLM...")

    # Remove TurboQuant attributes from model
    if hasattr(model, "llm_engine"):
        engine = model.llm_engine

        # List of TurboQuant attributes to remove
        tq_attrs = [
            "_turboquant_cache",
            "_turboquant_quantizer",
            "_turboquant_kernel",
            "_turboquant_patcher",
            "_turboquant_enabled",
        ]

        removed_count = 0
        for attr in tq_attrs:
            if hasattr(engine, attr):
                delattr(engine, attr)
                removed_count += 1
                print(f"  Removed attribute: {attr}")

        if removed_count == 0:
            print("  No TurboQuant attributes found (model may not be patched)")
        else:
            print(f"  Removed {removed_count} TurboQuant attribute(s)")

    # Check if model has TurboQuant patcher instance
    if hasattr(model, "_turboquant_vllm_patcher"):
        patcher = model._turboquant_vllm_patcher
        if hasattr(patcher, "unpatch"):
            patcher.unpatch(model)
        delattr(model, "_turboquant_vllm_patcher")
        print("  Removed patcher instance")

    print("TurboQuant patches removed successfully")
    print("Model is now running with original vLLM behavior")


def is_turboquant_enabled(model) -> bool:
    """
    Check if a vLLM model has TurboQuant enabled.

    Args:
        model: vLLM LLM instance

    Returns:
        True if TurboQuant is enabled, False otherwise
    """
    if not hasattr(model, "llm_engine"):
        return False

    engine = model.llm_engine

    # Check for any TurboQuant-related attributes
    tq_attrs = [
        "_turboquant_cache",
        "_turboquant_quantizer",
        "_turboquant_kernel",
        "_turboquant_patcher",
        "_turboquant_enabled",
    ]

    for attr in tq_attrs:
        if hasattr(engine, attr):
            return True

    return False


def get_turboquant_config(model) -> Optional[dict]:
    """
    Get TurboQuant configuration from a patched vLLM model.

    Args:
        model: vLLM LLM instance

    Returns:
        Dictionary with TurboQuant configuration, or None if not patched
    """
    if not is_turboquant_enabled(model):
        return None

    engine = model.llm_engine
    config = {}

    if hasattr(engine, "_turboquant_quantizer"):
        quantizer = engine._turboquant_quantizer
        config["bits"] = getattr(quantizer, "bits", None)
        config["d"] = getattr(quantizer, "d", None)

    if hasattr(engine, "_turboquant_kernel"):
        kernel = engine._turboquant_kernel
        config["num_kv_heads"] = getattr(kernel, "num_kv_heads", None)
        config["gqa_ratio"] = getattr(kernel, "gqa_ratio", None)

    if hasattr(engine, "_turboquant_cache"):
        cache = engine._turboquant_cache
        config["num_layers"] = getattr(cache, "num_layers", None)

    return config


def print_turboquant_status(model) -> None:
    """
    Print TurboQuant status for a vLLM model.

    Args:
        model: vLLM LLM instance
    """
    print("TurboQuant Status:")
    print("-" * 50)

    if is_turboquant_enabled(model):
        config = get_turboquant_config(model)
        print("Status: ENABLED")
        if config:
            print("Configuration:")
            for key, value in config.items():
                print(f"  {key}: {value}")
    else:
        print("Status: DISABLED (not patched)")

    print("-" * 50)


if __name__ == "__main__":
    # Example usage
    print("TurboQuant vLLM Rollback")
    print("=" * 70)
    print()
    print("Example usage:")
    print()
    print("  from vllm import LLM")
    print("  from turboquant.enable_vllm import enable_turboquant_vllm")
    print(
        "  from turboquant.disable_vllm import disable_turboquant_vllm, is_turboquant_enabled"
    )
    print()
    print("  # Enable TurboQuant")
    print("  llm = LLM('google/gemma-3-4b-it')")
    print("  patcher = enable_turboquant_vllm(llm, bits=2)")
    print()
    print("  # Check status")
    print("  print(is_turboquant_enabled(llm))  # True")
    print()
    print("  # Remove patches")
    print("  disable_turboquant_vllm(llm)")
    print()
    print("  # Verify patches removed")
    print("  print(is_turboquant_enabled(llm))  # False")
    print()
    print("Available functions:")
    print("  - disable_turboquant_vllm(model): Remove all TurboQuant patches")
    print("  - is_turboquant_enabled(model): Check if TurboQuant is active")
    print("  - get_turboquant_config(model): Get TurboQuant configuration")
    print("  - print_turboquant_status(model): Print status and config")
