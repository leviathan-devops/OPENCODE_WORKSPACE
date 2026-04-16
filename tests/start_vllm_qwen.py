#!/usr/bin/env python3
import subprocess
import sys
import os

def main():
    # Build command line arguments for vLLM with AWQ model
    cmd = [
        sys.executable,
        "-m", "vllm.entrypoints.openai.api_server",
        "--model", "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",  # AWQ quantized
        "--host", "0.0.0.0",
        "--port", "8000",
        "--gpu-memory-utilization", "0.80",  # More conservative
        "--max-model-len", "4096",  # Smaller context
        "--tensor-parallel-size", "1",
        "--block-size", "8",  # Smaller blocks
        "--swap-space", "8",  # More swap
        "--enforce-eager",
        "--disable-log-stats",
        "--served-model-name", "qwen2.5-coder-14b-awq",
        "--max-num-batched-tokens", "1024",  # Smaller batch
        "--max-num-seqs", "16",  # Fewer concurrent sequences
        "--disable-uvicorn-access-log",
        "--quantization", "awq"  # Specify AWQ quantization
    ]
    
    print(f"Starting vLLM server with AWQ model: {' '.join(cmd)}")
    print(f"Memory constraints: 12GB VRAM + 16GB shared")
    
    # Run vLLM server
    os.execvp(sys.executable, cmd)

if __name__ == "__main__":
    main()