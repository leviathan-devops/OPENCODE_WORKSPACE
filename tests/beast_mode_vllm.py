#!/usr/bin/env python3
"""
BEAST MODE vLLM launcher for RTX 4080 + i9-14900HX
This will extract EVERY ounce of performance
"""
import subprocess
import sys
import os

# BEAST MODE parameters for Qwen2.5-Coder-14B-AWQ on RTX 4080 12GB
cmd = [
    sys.executable, "-m", "vllm.entrypoints.openai.api_server",
    
    # Model
    "--model", "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",
    "--host", "0.0.0.0",
    "--port", "8000",
    
    # GPU MEMORY - PUSH TO ABSOLUTE LIMIT
    "--gpu-memory-utilization", "0.95",           # 11.4GB for model
    "--cpu-offload-gb", "12",                     # 12GB CPU RAM for offload
    
    # PERFORMANCE TWEAKS
    "--max-model-len", "8192",                    # Balanced context
    "--tensor-parallel-size", "1",
    "--block-size", "16",                         # Optimal for throughput
    "--max-num-batched-tokens", "32768",          # MASSIVE batch size
    "--max-num-seqs", "128",                      # Handle tons of concurrent requests
    "--max-paddings", "1024",
    
    # QUANTIZATION & FORMAT
    "--quantization", "awq",
    "--load-format", "awq",
    "--dtype", "auto",
    
    # OPTIMIZATIONS
    "--enforce-eager",                           # More stable
    "--swap-space", "24",                        # 24GB swap
    "--disable-uvicorn-access-log",
    "--disable-log-requests",
    "--disable-log-stats",
    
    # QWEN SPECIFIC
    "--enable-auto-tool-choice",
    "--tool-call-parser", "qwen3_coder",
    "--served-model-name", "qwen2.5-coder-14b-awq",
    
    # ADVANCED OPTIMIZATIONS
    "--pipeline-parallel-size", "1",
    "--max-parallel-loading-workers", "8",       # Use 8 CPU cores
    "--gpu-memory-utilization-margin", "0.05",   # Only 5% margin
    "--speculative-decoding", "disabled",
    
    # MEMORY MANAGEMENT
    "--num-kv-cache-cpu-offload-threshold", "0.9",
    "--kv-cache-dtype", "auto",
    
    # BATCHING OPTIMIZATION
    "--batch-size", "max",
    "--preemption-mode", "recompute",
]

print("🚀 LAUNCHING BEAST MODE vLLM")
print(f"Command: {' '.join(cmd[:10])}...")
print("\nHARDWARE ALLOCATION:")
print("- GPU VRAM: 11.4GB/12GB (95% utilization)")
print("- CPU RAM: 12GB offload + 24GB swap")
print("- CPU Cores: 8 dedicated loading workers")
print("- Max batch: 32K tokens")
print("- Max concurrent: 128 sequences")
print("\nTarget: 40-60+ tokens/sec")

# Set environment for maximum performance
env = os.environ.copy()
env.update({
    "CUDA_VISIBLE_DEVICES": "0",
    "PYTORCH_CUDA_ALLOC_CONF": "max_split_size_mb:512",
    "NCCL_DEBUG": "INFO",
    "TORCH_CUDNN_V8_API_ENABLED": "1",
    "OMP_NUM_THREADS": "16",
})

# LAUNCH
os.execve(sys.executable, cmd, env)

