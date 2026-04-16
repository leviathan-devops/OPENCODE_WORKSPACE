#!/bin/bash
# Optimized vLLM configuration for RTX 4080 + Qwen2.5-Coder-14B

echo "Creating optimized vLLM configuration..."

# Create optimized service file
sudo tee /etc/systemd/system/vllm-qwen-optimized.service > /dev/null << 'EOF'
[Unit]
Description=Optimized vLLM Qwen2.5-Coder-14B for Maximum Performance
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment="PYTHONPATH=/home/leviathan/OPENCODE_WORKSPACE/vllm-venv/lib/python3.12/site-packages"

# OPTIMIZED vLLM CONFIGURATION FOR RTX 4080 (12GB VRAM)
# Target: 20-30+ tokens/sec with Qwen2.5-Coder-14B-AWQ
ExecStart=/home/leviathan/OPENCODE_WORKSPACE/vllm-venv/bin/python -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-Coder-14B-Instruct-AWQ \
    --host 0.0.0.0 \
    --port 8000 \
    --gpu-memory-utilization 0.95 \
    --cpu-offload-gb 8 \
    --max-model-len 8192 \
    --tensor-parallel-size 1 \
    --block-size 16 \
    --served-model-name qwen2.5-coder-14b-awq \
    --max-num-batched-tokens 8192 \
    --max-num-seqs 32 \
    --max-paddings 256 \
    --disable-uvicorn-access-log \
    --quantization awq \
    --enable-auto-tool-choice \
    --tool-call-parser "qwen3_coder" \
    --enforce-eager \
    --swap-space 16 \
    --pipeline-parallel-size 1

Restart=always
RestartSec=5
LimitNOFILE=65536
StandardOutput=journal
StandardError=journal

# Memory limits - allow more for better performance
MemoryHigh=24G
MemoryMax=28G

[Install]
WantedBy=multi-user.target
EOF

echo "Optimized service file created"

# Disable old service, enable new one
sudo systemctl disable vllm-qwen-multi
sudo systemctl enable vllm-qwen-optimized

echo "Starting optimized vLLM server..."
sudo systemctl start vllm-qwen-optimized

echo "Waiting for server to initialize (this may take a minute)..."
sleep 30

echo "Testing performance..."
echo "Run: curl http://localhost:8000/health"
echo "Then test with: qwen-vllm 'Write a Python function'"