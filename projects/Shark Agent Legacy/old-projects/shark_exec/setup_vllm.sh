#!/bin/bash
# 🦈 SHARK vLLM SETUP - NO OUTPUT LIMITS, INSTANT DEPLOYMENT

set -e

echo "🚀 INSTANT vLLM DEPLOYMENT - NO DOCKER, NO LIMITS"
echo "=================================================="

# Install Python dependencies
pip3 install vllm==0.6.3.post1 transformers torch

# Create systemd service for Qwen
sudo tee /etc/systemd/system/vllm-qwen.service > /dev/null << EOF
[Unit]
Description=vLLM Qwen 2.5 Coder 7B
After=network.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan/shark
Environment=PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games
ExecStart=/usr/bin/python3 -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-Coder-7B-Instruct-GGUF \
    --port 11434 \
    --max-model-len 32768 \
    --gpu-memory-utilization 0.9 \
    --enforce-eager \
    --disable-log-requests \
    --disable-log-stats \
    --served-model-name qwen2.5-coder-7b \
    --max-num-batched-tokens 32768 \
    --max-num-seqs 256 \
    --tensor-parallel-size 1

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for DeepSeek
sudo tee /etc/systemd/system/vllm-deepseek.service > /dev/null << EOF
[Unit]
Description=vLLM DeepSeek Coder 6.7B
After=network.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan/shark
Environment=PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games
ExecStart=/usr/bin/python3 -m vllm.entrypoints.openai.api_server \
    --model deepseek-ai/DeepSeek-Coder-6.7B-Instruct \
    --port 11435 \
    --max-model-len 32768 \
    --gpu-memory-utilization 0.9 \
    --enforce-eager \
    --disable-log-requests \
    --disable-log-stats \
    --served-model-name deepseek-coder-6.7b \
    --max-num-batched-tokens 32768 \
    --max-num-seqs 256 \
    --tensor-parallel-size 1

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start services
sudo systemctl daemon-reload
sudo systemctl enable vllm-qwen vllm-deepseek
sudo systemctl start vllm-qwen vllm-deepseek

echo "⏳ Waiting for vLLM services to start..."
sleep 10

echo "✅ vLLM Setup Complete!"
echo "Qwen vLLM: http://localhost:11434"
echo "DeepSeek vLLM: http://localhost:11435"
echo ""
echo "Test Qwen:"
echo "curl -X POST http://localhost:11434/v1/completions \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"model\":\"qwen2.5-coder-7b\",\"prompt\":\"Hello\",\"max_tokens\":1000}'"
echo ""
echo "Test DeepSeek:"
echo "curl -X POST http://localhost:11435/v1/completions \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"model\":\"deepseek-coder-6.7b\",\"prompt\":\"Hello\",\"max_tokens\":1000}'"