#!/bin/bash
# Test vLLM Qwen Setup

echo "=== Testing vLLM Qwen Setup ==="

# Test 1: Check vLLM installation
echo "1. Checking vLLM installation..."
if command -v vllm &> /dev/null; then
    echo "   ✓ vLLM installed"
else
    echo "   ✗ vLLM not installed. Run: pip install vllm"
    exit 1
fi

# Test 2: Check systemd service
echo "2. Checking systemd service..."
if [ -f ~/.config/systemd/user/vllm-qwen.service ]; then
    echo "   ✓ Service file exists"
else
    echo "   ✗ Service file missing"
fi

# Test 3: Check port 8000
echo "3. Checking port 8000..."
if netstat -tuln | grep :8000 > /dev/null; then
    echo "   ⚠ Port 8000 in use. Stop existing vLLM first."
else
    echo "   ✓ Port 8000 available"
fi

# Test 4: Check GPU
echo "4. Checking GPU..."
if nvidia-smi &> /dev/null; then
    echo "   ✓ NVIDIA GPU detected"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
    echo "   ✗ No NVIDIA GPU detected"
fi

# Test 5: Check environment
echo "5. Checking environment..."
echo "   OPENAI_BASE_URL: ${OPENAI_BASE_URL:-not set}"
echo "   VLLM_ACTIVE: ${VLLM_ACTIVE:-0}"

echo ""
echo "=== Setup Instructions ==="
echo "1. Install vLLM: pip install vllm"
echo "2. Enable service: systemctl --user enable vllm-qwen.service"
echo "3. Start vLLM: vllm-start"
echo "4. Switch to local: qwen-local"
echo "5. Test: qwen-status"
echo ""
echo "For 4-6 terminals:"
echo "- Each Qwen Code instance will share the same vLLM backend"
echo "- vLLM handles concurrent requests automatically"
echo "- Monitor with: vllm-logs"