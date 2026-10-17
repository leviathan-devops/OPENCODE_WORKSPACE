#!/bin/bash
# Try Qwen Code with local vLLM NOW

echo "=========================================="
echo "  TRY QWEN CODE WITH LOCAL VLLM NOW!"
echo "=========================================="
echo ""

echo "1. vLLM Status:"
systemctl --user is-active vllm-qwen.service >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ vLLM server is RUNNING"
    echo "  Model: qwen-coder-14b"
    echo "  Parser: qwen3_coder"
    echo "  Auto-tool-choice: ENABLED"
else
    echo "✗ vLLM server is NOT running"
    echo "  Start with: systemctl --user start vllm-qwen.service"
    exit 1
fi
echo ""

echo "2. Switching to local vLLM..."
source ~/.bash_aliases 2>/dev/null || source ~/.bashrc
qwen-local
echo ""

echo "3. Testing API..."
curl -s -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" http://localhost:8000/v1/models >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ vLLM API responding"
else
    echo "✗ vLLM API not responding"
    exit 1
fi
echo ""

echo "4. READY TO TEST QWEN CODE!"
echo "============================"
echo ""
echo "Run this command:"
echo "  qwen-run-local --yolo"
echo ""
echo "Or manually:"
echo "  source ~/.bashrc"
echo "  qwen-local"
echo "  qwen --yolo"
echo ""
echo "If you get 'auto tool choice' error:"
echo "  The model might not support tool calls properly"
echo "  Try: qwen -m qwen-coder-14b --yolo"
echo ""
echo "=========================================="
echo "  GOOD LUCK! 🚀"
echo "=========================================="