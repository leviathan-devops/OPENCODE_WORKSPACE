#!/bin/bash
# ULTIMATE performance tuning for $4000 beast

echo "⚡ ULTIMATE PERFORMANCE TUNING..."

# 1. SYSTEM OPTIMIZATION
echo "1. System optimization..."
sudo -S -p '' sysctl -w vm.swappiness=10
sudo -S -p '' sysctl -w vm.vfs_cache_pressure=50

# 2. GPU OPTIMIZATION
echo "2. GPU optimization..."
sudo -S -p '' nvidia-smi -pm 1  # Enable persistence mode
sudo -S -p '' nvidia-smi -ac 5001,1755  # Set max clocks (adjust for RTX 4080)

# 3. CREATE ULTIMATE vLLM CONFIG
echo "3. Creating ultimate vLLM config..."

cat > ~/vllm_ultimate_launch.py << 'PYEOF'
import subprocess, sys, os

# ULTIMATE parameters extracted from benchmarking
cmd = [
    sys.executable, "-m", "vllm.entrypoints.openai.api_server",
    "--model", "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",
    "--host", "0.0.0.0", "--port", "8000",
    "--gpu-memory-utilization", "0.90",
    "--cpu-offload-gb", "6",  # Less CPU offload = more GPU utilization
    "--max-model-len", "2048",  # SHORT context = MAX speed
    "--tensor-parallel-size", "1",
    "--block-size", "8",  # Small blocks = max throughput
    "--max-num-batched-tokens", "2048",
    "--max-num-seqs", "16",
    "--quantization", "awq",
    "--dtype", "half",  # FP16 = speed
    "--enforce-eager",
    "--swap-space", "4",
    "--disable-uvicorn-access-log",
    "--served-model-name", "qwen2.5-coder-14b-awq",
]

env = os.environ.copy()
env.update({
    "CUDA_VISIBLE_DEVICES": "0",
    "PYTORCH_CUDA_ALLOC_CONF": "max_split_size_mb:64",
    "OMP_NUM_THREADS": "4",
    "NCCL_P2P_DISABLE": "1",  # Disable peer-to-peer (single GPU)
    "CUDA_MODULE_LOADING": "LAZY",
})

os.execve(sys.executable, cmd, env)
PYEOF

# 4. ULTIMATE SERVICE
sudo -S -p '' tee /etc/systemd/system/vllm-ultimate-beast.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=ULTIMATE BEAST vLLM - MAXIMUM SPEED
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment="PYTHONPATH=/home/leviathan/OPENCODE_WORKSPACE/vllm-venv/lib/python3.12/site-packages"
Environment="CUDA_VISIBLE_DEVICES=0"
Environment="PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:64"
Environment="OMP_NUM_THREADS=4"
Environment="NCCL_P2P_DISABLE=1"
Environment="CUDA_MODULE_LOADING=LAZY"

ExecStart=/home/leviathan/OPENCODE_WORKSPACE/vllm-venv/bin/python /home/leviathan/OPENCODE_WORKSPACE/vllm_ultimate_launch.py

Restart=on-failure
RestartSec=1

# ABSOLUTE MAXIMUM PRIORITY
LimitNOFILE=1000000
MemoryHigh=20G
MemoryMax=22G
CPUQuota=98%
Nice=-20
IOSchedulingClass=realtime
IOSchedulingPriority=0
CPUSchedulingPolicy=rr
CPUSchedulingPriority=99

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Stop old, start new
sudo -S -p '' systemctl stop vllm-nuclear vllm-ultimate 2>/dev/null || true
sudo -S -p '' systemctl daemon-reload
sudo -S -p '' systemctl enable vllm-ultimate-beast
sudo -S -p '' systemctl start vllm-ultimate-beast

echo "✅ ULTIMATE BEAST MODE ACTIVATED"
echo "Target: 40-60+ tokens/sec on RTX 4080"
echo "Waiting 45 seconds for optimal load..."
