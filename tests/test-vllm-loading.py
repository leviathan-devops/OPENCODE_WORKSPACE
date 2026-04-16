#!/usr/bin/env python3
"""
Test vLLM loading strategies for Qwen2.5-Coder-14B on RTX 4080 12GB
"""

import subprocess
import time
import sys
import os

def run_vllm_test(strategy_name, command):
    """Run a vLLM test with given strategy"""
    print(f"\n{'='*60}")
    print(f"Testing: {strategy_name}")
    print(f"Command: {command}")
    print(f"{'='*60}")
    
    # Start vLLM in background
    env = os.environ.copy()
    env['PYTHONPATH'] = f"{os.path.expanduser('~/vllm-venv/lib/python3.12/site-packages')}:{env.get('PYTHONPATH', '')}"
    
    process = subprocess.Popen(
        command,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
        text=True
    )
    
    # Wait for startup
    time.sleep(10)
    
    # Check if process is still running
    if process.poll() is not None:
        stdout, stderr = process.communicate()
        print(f"Process failed with exit code: {process.returncode}")
        print(f"Stderr: {stderr[:500]}...")
        return False
    
    # Test API endpoint
    try:
        import requests
        response = requests.get("http://localhost:8000/v1/models", timeout=5)
        if response.status_code == 200:
            print(f"✓ API endpoint working: {response.json()}")
            success = True
        else:
            print(f"✗ API endpoint failed: {response.status_code}")
            success = False
    except Exception as e:
        print(f"✗ API test failed: {e}")
        success = False
    
    # Kill process
    process.terminate()
    process.wait(timeout=5)
    
    return success

def main():
    print("Testing vLLM loading strategies for Qwen2.5-Coder-14B on RTX 4080 12GB")
    print("Model: Qwen/Qwen2.5-Coder-14B-Instruct-AWQ")
    
    strategies = [
        {
            "name": "Strategy 1: GPU Only (85% utilization)",
            "command": "source ~/vllm-venv/bin/activate && vllm serve Qwen/Qwen2.5-Coder-14B-Instruct-AWQ --port 8000 --gpu-memory-utilization 0.85 --quantization awq --max-model-len 8192"
        },
        {
            "name": "Strategy 2: GPU Only (90% utilization)",
            "command": "source ~/vllm-venv/bin/activate && vllm serve Qwen/Qwen2.5-Coder-14B-Instruct-AWQ --port 8000 --gpu-memory-utilization 0.90 --quantization awq --max-model-len 8192"
        },
        {
            "name": "Strategy 3: GPU + Minimal CPU Offload",
            "command": "source ~/vllm-venv/bin/activate && vllm serve Qwen/Qwen2.5-Coder-14B-Instruct-AWQ --port 8000 --gpu-memory-utilization 0.80 --cpu-offload-gb 2 --quantization awq --max-model-len 8192"
        },
        {
            "name": "Strategy 4: 7B Model (Fallback if 14B fails)",
            "command": "source ~/vllm-venv/bin/activate && vllm serve Qwen/Qwen2.5-Coder-7B-Instruct --port 8000 --gpu-memory-utilization 0.90 --max-model-len 16384"
        }
    ]
    
    results = []
    for strategy in strategies:
        success = run_vllm_test(strategy["name"], strategy["command"])
        results.append((strategy["name"], success))
        time.sleep(2)  # Cleanup time
    
    print(f"\n{'='*60}")
    print("TEST RESULTS SUMMARY:")
    print(f"{'='*60}")
    for name, success in results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status}: {name}")
    
    # Recommend best strategy
    working_strategies = [name for name, success in results if success]
    if working_strategies:
        print(f"\nRecommended strategy: {working_strategies[0]}")
        print("Use this in your systemd service configuration.")
    else:
        print("\nAll strategies failed. Check GPU memory and vLLM installation.")

if __name__ == "__main__":
    main()