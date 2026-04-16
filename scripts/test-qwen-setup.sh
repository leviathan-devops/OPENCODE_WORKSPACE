#!/bin/bash
# Test Qwen vLLM Setup

echo "=== Testing Qwen vLLM Setup ==="
echo ""

# Load aliases
source ~/.bash_aliases 2>/dev/null || echo "Note: Run 'source ~/.bashrc' in your terminal first"

echo "1. Testing API switching functions..."
echo ""

# Test local switching
echo "Testing qwen-local:"
qwen-local
echo "Current API: $OPENAI_BASE_URL"
echo ""

# Test deepseek switching  
echo "Testing qwen-deepseek:"
qwen-deepseek
echo "Current API: $OPENAI_BASE_URL"
echo ""

# Test status
echo "Testing qwen-api-status:"
qwen-api-status
echo ""

echo "2. Testing vLLM server..."
echo ""

# Check if vLLM is running
if pgrep -f "vllm serve" > /dev/null; then
    echo "✓ vLLM server is running"
    echo "Testing API endpoint..."
    curl -s http://localhost:8000/v1/models 2>/dev/null && echo "✓ vLLM API responding" || echo "✗ vLLM API not responding"
else
    echo "✗ vLLM server is NOT running"
    echo "Start it with: vllm-start"
fi

echo ""
echo "3. Usage Instructions:"
echo "======================"
echo ""
echo "In EACH terminal, choose your API:"
echo "  qwen-local      # Use local vLLM (this terminal only)"
echo "  qwen-deepseek   # Use DeepSeek API (this terminal only)"
echo "  qwen-api-status # Check current API"
echo ""
echo "Then run:"
echo "  qwen --yolo"
echo ""
echo "Key Points:"
echo "  • Each terminal can use DIFFERENT APIs"
echo "  • Local vLLM and DeepSeek can run SIMULTANEOUSLY"
echo "  • No need to close other terminals"
echo "  • vLLM handles 4-6 concurrent local requests"
echo ""
echo "To start vLLM server:"
echo "  vllm-start"
echo ""
echo "To monitor:"
echo "  vllm-status"
echo "  vllm-logs"