#!/usr/bin/env python3
import subprocess
import sys
import os

def main():
    # Build command line arguments for vLLM with AWQ model
    cmd = [
        sys.executable,
        "-m", "vllm.entrypoints.openai.api_server",
        "--model", "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--gpu-memory-utilization", "0.65",  # Very conservative
        "--max-model-len", "1024",  # Small context
        "--tensor-parallel-size", "1",
        "--enforce-eager",
        "--disable-log-stats",
        "--served-model-name", "qwen2.5-coder-14b-awq",
        "--max-num-batched-tokens", "128",
        "--max-num-seqs", "2",
        "--disable-uvicorn-access-log",
        "--quantization", "awq"
    ]
    
    print(f"Starting vLLM AWQ server: {' '.join(cmd)}")
    print(f"Memory: 65% of 12GB = 7.8GB for 4-bit quantized 14B model")
    
    # Run vLLM server
    os.execvp(sys.executable, cmd)

if __name__ == "__main__":
    main()