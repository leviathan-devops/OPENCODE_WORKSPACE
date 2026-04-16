#!/bin/bash
# vLLM Qwen Setup Script
# Run this to install and configure vLLM with Qwen2.5-Coder

set -e

echo "=== vLLM Qwen Setup ==="

# Check if vLLM is installed
if ! command -v vllm &> /dev/null; then
    echo "Installing vLLM..."
    pip install vllm
else
    echo "vLLM already installed"
fi

# Create directories
mkdir -p ~/.vllm
mkdir -p ~/.config/systemd/user

echo "Setup complete!"
echo ""
echo "To start vLLM server:"
echo "  vllm serve Qwen/Qwen2.5-Coder-14B-Instruct-AWQ \\"
echo "    --port 8000 \\"
echo "    --gpu-memory-utilization 0.85 \\"
echo "    --max-model-len 8192 \\"
echo "    --quantization awq"
echo ""
echo "Or use the systemd service:"
echo "  systemctl --user start vllm-qwen.service"