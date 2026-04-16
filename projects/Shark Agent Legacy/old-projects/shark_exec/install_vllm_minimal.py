#!/usr/bin/env python3
"""
Minimal vLLM installation script.
"""

import subprocess
import sys
import os

def run_command(cmd):
    """Run command and return output."""
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
    return result

def main():
    # Activate virtual environment
    venv_path = "/home/leviathan/vllm-venv"
    python_path = os.path.join(venv_path, "bin", "python")
    pip_path = os.path.join(venv_path, "bin", "pip")
    
    # Install core dependencies first
    print("Installing core dependencies...")
    
    deps = [
        "transformers>=4.36.0",
        "accelerate>=0.24.0",
        "safetensors>=0.4.0",
        "huggingface-hub>=0.20.0",
        "ninja>=1.11.0",
        "packaging>=21.0",
        "psutil>=5.9.0",
        "pyyaml>=6.0",
        "requests>=2.31.0",
        "tqdm>=4.65.0",
        "aiohttp>=3.9.0",
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "pydantic>=2.0.0",
        "typing-extensions>=4.5.0",
    ]
    
    for dep in deps:
        run_command(f"{pip_path} install {dep}")
    
    # Try to install vLLM from GitHub
    print("\nInstalling vLLM from GitHub...")
    result = run_command(f"{pip_path} install git+https://github.com/vllm-project/vllm.git@v0.4.3")
    
    if result.returncode != 0:
        print("\nTrying alternative: Install vLLM without some dependencies...")
        # Clone and install manually
        run_command("cd /tmp && git clone https://github.com/vllm-project/vllm.git && cd vllm && git checkout v0.4.3")
        run_command(f"cd /tmp/vllm && {pip_path} install -e . --no-deps")
    
    # Test installation
    print("\nTesting vLLM installation...")
    test_code = """
import torch
from vllm import LLM, SamplingParams

print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"GPU count: {torch.cuda.device_count()}")

try:
    import vllm
    print(f"vLLM version: {vllm.__version__}")
    print("✅ vLLM installed successfully!")
except Exception as e:
    print(f"❌ vLLM import failed: {e}")
"""
    
    with open("/tmp/test_vllm.py", "w") as f:
        f.write(test_code)
    
    result = run_command(f"{python_path} /tmp/test_vllm.py")
    
    if result.returncode == 0:
        print("\n✅ vLLM installation successful!")
    else:
        print("\n❌ vLLM installation failed.")

if __name__ == "__main__":
    main()