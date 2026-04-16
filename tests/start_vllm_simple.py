#!/usr/bin/env python3
import subprocess
import sys
import os

def main():
    # Build command line arguments for vLLM with 7B model
    cmd = [
        sys.executable,
        "-m", "vllm.entrypoints.openai.api_server",
        "--model", "Qwen/Qwen2.5-Coder-7B-Instruct",
        "--host", "0.0.0.0",
        "--port", "8001",  # Different port
        "--gpu-memory-utilization", "0.90",
        "--max-model-len", "4096",
        "--tensor-parallel-size", "1",
        "--enforce-eager",
        "--disable-log-stats",
        "--served-model-name", "qwen2.5-coder-7b",
        "--max-num-batched-tokens", "512",
        "--max-num-seqs", "8",
        "--disable-uvicorn-access-log"
    ]
    
    print(f"Starting vLLM server with 7B model: {' '.join(cmd)}")
    print(f"Memory constraints: 12GB VRAM")
    
    # Run vLLM server
    os.execvp(sys.executable, cmd)

if __name__ == "__main__":
    main()