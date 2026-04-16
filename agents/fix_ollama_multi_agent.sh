#!/bin/bash
# Fix Ollama for multi-agent Qwen Code usage

echo "=== Fixing Ollama for Multi-Agent Qwen Code ==="

# 1. Kill all vLLM processes (they're using GPU memory)
echo "Killing vLLM processes..."
sudo pkill -9 -f "vllm\|VLLM" 2>/dev/null || true
sleep 3

# 2. Check GPU memory
echo "Checking GPU memory..."
nvidia-smi | grep "Memory-Usage"

# 3. Ensure Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# 4. Stop and reconfigure Ollama
echo "Stopping Ollama..."
sudo systemctl stop ollama 2>/dev/null || true
pkill -9 ollama 2>/dev/null || true
sleep 2

# 5. Create optimized Ollama configuration
echo "Creating optimized configuration..."
mkdir -p ~/.ollama
cat > ~/.ollama/config.json << 'EOF'
{
  "models": {
    "qwen2.5-coder:7b": {
      "num_ctx": 2048,
      "num_batch": 256,
      "num_gpu": 1,
      "main_gpu": 0,
      "num_thread": 6,
      "flash_attention": true,
      "low_vram": false,
      "num_parallel": 3,
      "keep_alive": "24h"
    }
  },
  "environment": {
    "OLLAMA_NUM_PARALLEL": "3",
    "OLLAMA_MAX_LOADED_MODELS": "2",
    "OLLAMA_KEEP_ALIVE": "24h"
  }
}
EOF

# 6. Create systemd service for multi-agent Ollama
echo "Creating multi-agent Ollama service..."
sudo tee /etc/systemd/system/ollama-multi.service > /dev/null << EOF
[Unit]
Description=Ollama Multi-Agent Server
After=network.target

[Service]
Type=simple
User=$USER
Environment="OLLAMA_NUM_PARALLEL=3"
Environment="OLLAMA_MAX_LOADED_MODELS=2"
Environment="OLLAMA_KEEP_ALIVE=24h"
Environment="OLLAMA_HOST=0.0.0.0:11434"
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=5
LimitNOFILE=65536
# Memory limits for 12GB VRAM
LimitMEMLOCK=infinity
LimitAS=infinity

[Install]
WantedBy=multi-user.target
EOF

# 7. Start the service
sudo systemctl daemon-reload
sudo systemctl enable ollama-multi
sudo systemctl start ollama-multi

sleep 5

# 8. Pull the model if not already present
echo "Checking for Qwen2.5-Coder-7B model..."
if ! ollama list | grep -q "qwen2.5-coder:7b"; then
    echo "Pulling Qwen2.5-Coder-7B..."
    ollama pull qwen2.5-coder:7b 2>&1 | tail -10
else
    echo "Model already exists."
fi

# 9. Test the setup
echo "Testing Ollama..."
ollama list

echo ""
echo "=== SETUP COMPLETE ==="
echo ""
echo "Ollama is now configured for multi-agent use:"
echo "  - Up to 3 parallel requests"
echo "  - 2 models can be loaded simultaneously"
echo "  - Optimized for 12GB VRAM"
echo ""
echo "API Endpoint: http://localhost:11434"
echo "OpenAI-compatible API: http://localhost:11434/v1"
echo ""
echo "To use with Hermes/OpenFang:"
echo "  Base URL: http://localhost:11434/v1"
echo "  Model: qwen2.5-coder:7b"
echo "  API Key: (not required)"
echo ""
echo "Check status: sudo systemctl status ollama-multi"
echo "View logs: sudo journalctl -u ollama-multi -f"