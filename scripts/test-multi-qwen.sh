#!/bin/bash
# Test multiple Qwen Code terminals with vLLM

echo "🧪 Testing Multi-Terminal Qwen Code with vLLM"
echo "============================================="
echo ""

# Check vLLM
echo "1. Checking vLLM server..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ vLLM server is running"
else
    echo "❌ vLLM server not responding"
    exit 1
fi

# Test single request first
echo ""
echo "2. Testing single request..."
SINGLE_TEST=$(curl -s -X POST http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-coder-14b-awq",
    "prompt": "Write one line of Python code:",
    "max_tokens": 20
  }')

if echo "$SINGLE_TEST" | grep -q '"text"'; then
    echo "✅ Single request works"
else
    echo "❌ Single request failed"
    exit 1
fi

echo ""
echo "3. Ready for multi-terminal testing!"
echo ""
echo "Open 2-3 terminals and run:"
echo "  ~/qwen-vllm-wrapper.sh"
echo ""
echo "Or use the alias in each terminal:"
echo "  qwen-vllm"
echo ""
echo "Each terminal will use the same local vLLM server."
echo "Expected: 2-3 terminals work smoothly, 4-6 possible with tuning."
