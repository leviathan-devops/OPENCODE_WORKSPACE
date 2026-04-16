#!/usr/bin/env python3
"""
Direct vLLM test to see loading issues
"""

import subprocess
import time
import sys
import os

# Clean up any existing processes
subprocess.run(["pkill", "-f", "vllm"], capture_output=True)

print("Testing vLLM with Qwen2.5-Coder-14B-Instruct-AWQ")
print("=" * 60)

# Test 1: Try with lower memory utilization
cmd1 = [
    os.path.expanduser("~/vllm-venv/bin/vllm"),
    "serve",
    "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",
    "--port", "8002",
    "--gpu-memory-utilization", "0.75",  # Lower for safety
    "--quantization", "awq",
    "--max-model-len", "4096",
    "--served-model-name", "qwen-coder-14b"
]

print(f"Command: {' '.join(cmd1)}")
print("Starting vLLM...")

process = subprocess.Popen(
    cmd1,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1,
    universal_newlines=True
)

# Read output for 30 seconds
start_time = time.time()
output_lines = []
try:
    while time.time() - start_time < 30:
        line = process.stdout.readline()
        if line:
            output_lines.append(line.strip())
            print(f"OUT: {line.strip()}")
        
        if process.poll() is not None:
            print(f"Process exited with code: {process.returncode}")
            break
        time.sleep(0.1)
except KeyboardInterrupt:
    pass
finally:
    process.terminate()
    process.wait()

print("\n" + "=" * 60)
print("OUTPUT SUMMARY (last 20 lines):")
for line in output_lines[-20:]:
    print(line)

# Check for common errors
output_text = "\n".join(output_lines)
if "CUDA out of memory" in output_text:
    print("\nERROR: CUDA out of memory - need CPU offload")
elif "Failed to load model" in output_text:
    print("\nERROR: Failed to load model")
elif "serving on" in output_text.lower():
    print("\nSUCCESS: Model loaded successfully!")
else:
    print("\nUNKNOWN: Check logs above")