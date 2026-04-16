#!/usr/bin/env python3
"""
NUCLEAR LAUNCH - Maximum possible performance
"""
import subprocess
import sys
import os

# Try different optimization strategies
strategies = [
    # Strategy 1: Maximum throughput (lower precision, bigger batches)
    [
        "--model", "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--gpu-memory-utilization", "0.92",
        "--cpu-offload-gb", "8",
        "--max-model-len", "4096",  # Smaller context = faster
        "--tensor-parallel-size", "1",
        "--block-size", "8",  # Smaller blocks = more efficient
        "--max-num-batched-tokens", "4096",
        "--max-num-seqs", "32",
        "--quantization", "awq",
        "--dtype", "half",  # Force FP16 for speed
        "--enforce-eager",
        "--swap-space", "8",
        "--disable-uvicorn-access-log",
        "--served-model-name", "qwen2.5-coder-14b-awq",
    ],
]

print("🧪 Testing nuclear optimization strategy...")

# Set MAXIMUM performance environment
env = os.environ.copy()
env.update({
    "CUDA_VISIBLE_DEVICES": "0",
    "PYTORCH_CUDA_ALLOC_CONF": "max_split_size_mb:128",  # Smaller splits = less fragmentation
    "OMP_NUM_THREADS": "8",
    "CUDA_LAUNCH_BLOCKING": "0",
    "TORCHINDUCTOR_CACHE_DIR": "/tmp/torchinductor",
})

# Launch with first strategy
cmd = [sys.executable, "-m", "vllm.entrypoints.openai.api_server"] + strategies[0]
print(f"Launching: {' '.join(cmd[:12])}...")

# Replace current process
os.execve(sys.executable, cmd, env)
