#!/usr/bin/env python3
"""
Minimal vLLM server for Qwen2.5-Coder with AWQ quantization
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    print("Starting minimal vLLM server for Qwen2.5-Coder-14B-AWQ")
    
    # Import here to catch errors early
    try:
        from vllm.entrypoints.openai.api_server import main as vllm_main
    except ImportError as e:
        print(f"Import error: {e}")
        return 1
    
    # Set command line arguments for vLLM
    sys.argv = [
        "vllm",
        "--model", "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--gpu-memory-utilization", "0.80",
        "--max-model-len", "2048",
        "--tensor-parallel-size", "1",
        "--quantization", "awq",
        "--served-model-name", "qwen2.5-coder-14b-awq",
        "--disable-log-stats",
        "--disable-uvicorn-access-log"
    ]
    
    print(f"Running vLLM with args: {' '.join(sys.argv[1:])}")
    
    try:
        vllm_main()
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error running vLLM: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())