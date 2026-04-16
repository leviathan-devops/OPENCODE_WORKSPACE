#!/bin/bash
# Setup Ollama with Qwen2.5-Coder quantized for multiple agents

echo "Setting up Ollama for multi-agent Qwen Code..."

# Kill any existing Ollama
pkill -9 ollama 2>/dev/null || true
sleep 2

# Install Ollama if not installed
if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# Start Ollama server
echo "Starting Ollama server..."
nohup ollama serve > /tmp/ollama.log 2>&1 &
sleep 5

# Pull quantized Qwen model (3B or 1.5B would be better for 12GB)
echo "Pulling Qwen2.5-Coder-7B (quantized if available)..."
ollama pull qwen2.5-coder:7b 2>&1 | tail -20

# Create optimized model file for multiple agents
echo "Creating optimized model configuration..."
cat > ~/.ollama/models/manifests/registry.ollama.ai/library/qwen2.5-coder\:7b/Modelfile << 'EOF'
FROM qwen2.5-coder:7b

# Optimizations for multiple concurrent agents
PARAMETER num_ctx 2048
PARAMETER num_batch 512
PARAMETER num_gpu 1
PARAMETER main_gpu 0
PARAMETER num_thread 8

# Memory optimizations
PARAMETER flash_attention true
PARAMETER low_vram true

# Performance for multiple agents
PARAMETER num_parallel 4
PARAMETER repeat_penalty 1.1
PARAMETER temperature 0.7
EOF

# Create systemd service for Ollama
echo "Creating systemd service..."
sudo tee /etc/systemd/system/ollama-multi.service > /dev/null << EOF
[Unit]
Description=Ollama Multi-Agent Server
After=network.target

[Service]
Type=simple
User=$USER
Environment="OLLAMA_NUM_PARALLEL=4"
Environment="OLLAMA_FLASH_ATTENTION=1"
Environment="OLLAMA_KEEP_ALIVE=24h"
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ollama-multi
sudo systemctl restart ollama-multi

sleep 3

echo "Testing Ollama..."
ollama list

echo ""
echo "Setup complete!"
echo "Ollama is running with Qwen2.5-Coder-7B"
echo "You can run multiple agents with:"
echo "  ollama run qwen2.5-coder:7b 'Your prompt here'"
echo ""
echo "For Hermes integration, use OpenAI-compatible endpoint:"
echo "  Base URL: http://localhost:11434/v1"
echo "  Model: qwen2.5-coder:7b"
echo ""
echo "Check logs: sudo journalctl -u ollama-multi -f"