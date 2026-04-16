#!/usr/bin/env python3
"""
Minimal vLLM setup for Qwen2.5-Coder-7B with memory constraints
"""
import subprocess
import sys
import os

def run_command(cmd, check=True):
    """Run shell command"""
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0 and check:
        print(f"Error: {result.stderr}")
        return False
    return True

def main():
    print("Setting up vLLM for Qwen2.5-Coder-7B with 12GB VRAM constraints...")
    
    # 1. Activate virtual environment
    venv_path = os.path.expanduser("~/vllm-venv")
    if not os.path.exists(venv_path):
        print("Creating virtual environment...")
        run_command("python3 -m venv ~/vllm-venv")
    
    # 2. Install vLLM with minimal dependencies
    print("Installing vLLM...")
    pip_cmd = f"source {venv_path}/bin/activate && pip install vllm --no-deps"
    if not run_command(pip_cmd, check=False):
        print("Trying with dependencies...")
        pip_cmd = f"source {venv_path}/bin/activate && pip install vllm"
        run_command(pip_cmd)
    
    # 3. Create vLLM startup script optimized for 12GB VRAM
    print("Creating vLLM startup script...")
    script_content = '''#!/usr/bin/env python3
from vllm import LLM, SamplingParams
from vllm.entrypoints.openai.api_server import run_server
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="Qwen/Qwen2.5-Coder-7B-Instruct")
    parser.add_argument("--port", type=int, default=11434)
    parser.add_argument("--host", type=str, default="0.0.0.0")
    args = parser.parse_args()
    
    print(f"Starting vLLM server with model: {args.model}")
    print(f"Memory constraints: 12GB VRAM + 16GB shared")
    
    # Run vLLM OpenAI API server with memory optimizations
    run_server(
        host=args.host,
        port=args.port,
        model=args.model,
        # Memory optimizations for 12GB VRAM
        gpu_memory_utilization=0.85,  # Leave some room
        max_model_len=8192,  # Conservative context length
        tensor_parallel_size=1,  # Single GPU
        block_size=16,
        swap_space=4,  # Use 4GB swap space
        # Performance optimizations
        enforce_eager=True,
        disable_log_stats=True,
        disable_log_requests=True,
        served_model_name="qwen2.5-coder-7b",
        max_num_batched_tokens=2048,
        max_num_seqs=32
    )

if __name__ == "__main__":
    main()
'''
    
    with open("/home/leviathan/start_vllm_qwen.py", "w") as f:
        f.write(script_content)
    
    run_command("chmod +x /home/leviathan/start_vllm_qwen.py")
    
    # 4. Create systemd service
    print("Creating systemd service...")
    service_content = '''[Unit]
Description=vLLM Qwen2.5-Coder-7B Server
After=network.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment="PYTHONPATH=/home/leviathan/vllm-venv/lib/python3.12/site-packages"
ExecStart=/home/leviathan/vllm-venv/bin/python /home/leviathan/start_vllm_qwen.py
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
'''
    
    with open("/tmp/vllm-qwen.service", "w") as f:
        f.write(service_content)
    
    run_command("sudo cp /tmp/vllm-qwen.service /etc/systemd/system/")
    run_command("sudo systemctl daemon-reload")
    
    print("\nSetup complete!")
    print("To start the server: sudo systemctl start vllm-qwen")
    print("To enable on boot: sudo systemctl enable vllm-qwen")
    print("To check status: sudo systemctl status vllm-qwen")
    print("\nServer will be available at: http://localhost:11434/v1")

if __name__ == "__main__":
    main()