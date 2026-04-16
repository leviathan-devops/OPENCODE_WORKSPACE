#!/bin/bash
# Complete vLLM Qwen Setup Script

set -e

echo "=== Complete vLLM Qwen Setup ==="
echo ""

# 1. Update systemd service
echo "1. Updating systemd service..."
cp ~/.config/systemd/user/vllm-qwen-optimized.service ~/.config/systemd/user/vllm-qwen.service
systemctl --user daemon-reload
systemctl --user enable vllm-qwen.service

# 2. Make scripts executable
echo "2. Making scripts executable..."
chmod +x ~/start-vllm-qwen.sh ~/vllm-monitor.sh ~/.qwen-switch.sh

# 3. Update bashrc
echo "3. Updating bashrc..."
if ! grep -q "source ~/.bash_aliases" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# Load aliases" >> ~/.bashrc
    echo "if [ -f ~/.bash_aliases ]; then" >> ~/.bashrc
    echo "    . ~/.bash_aliases" >> ~/.bashrc
    echo "fi" >> ~/.bashrc
fi

# 4. Set initial API to local
echo "4. Setting API to local vLLM..."
source ~/.qwen-switch.sh local

# 5. Start vLLM
echo "5. Starting vLLM server..."
echo "   This may take 1-2 minutes for initial model loading..."
systemctl --user start vllm-qwen.service

# 6. Wait and test
echo "6. Waiting for server to start..."
sleep 10

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Commands available:"
echo "  vllm-start      - Start vLLM server"
echo "  vllm-stop       - Stop vLLM server"
echo "  vllm-restart    - Restart vLLM server"
echo "  vllm-logs       - View server logs"
echo "  vllm-monitor    - Check server status"
echo "  qwen-local      - Switch to local vLLM API"
echo "  qwen-deepseek   - Switch to DeepSeek API"
echo "  qwen-status     - Check API status"
echo ""
echo "To use with Qwen Code:"
echo "  1. Open a new terminal"
echo "  2. Run: qwen --yolo"
echo "  3. It will use local vLLM automatically"
echo ""
echo "For 4-6 terminals:"
echo "  - All terminals share the same vLLM backend"
echo "  - vLLM handles concurrent requests"
echo "  - Monitor with: vllm-monitor"