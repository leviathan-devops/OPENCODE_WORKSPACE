#!/bin/bash
# Final test before trying Qwen Code

echo "========================================"
echo "  FINAL TEST - Ready for Qwen Code"
echo "========================================"
echo ""

# Wait for vLLM to start
echo "1. Waiting for vLLM to start..."
sleep 5

echo "2. Testing vLLM API..."
curl -s -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" http://localhost:8000/v1/models >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ vLLM API responding"
else
    echo "✗ vLLM API not responding"
    exit 1
fi

echo ""
echo "3. Current configuration:"
echo "   Model: qwen-coder-14b"
echo "   API: http://localhost:8000/v1"
echo "   Parser: qwen3_coder"
echo "   Auto-tool-choice: enabled"
echo ""

echo "4. Known issue:"
echo "   Qwen Code uses 'tool_choice: \"auto\"'"
echo "   vLLM might not handle this correctly with Qwen2.5-Coder-14B"
echo ""

echo "5. To test Qwen Code:"
echo "   ==================="
echo "   source ~/.bashrc"
echo "   qwen-run-local --yolo"
echo ""
echo "   If you get 'auto tool choice' error, try:"
echo "   qwen -m qwen-coder-14b --yolo --no-tools"
echo ""
echo "6. Alternative: Try 7B model"
echo "   ========================="
echo "   The 7B version might have better tool call support."
echo "   To switch to 7B, edit vLLM service to use:"
echo "   Qwen/Qwen2.5-Coder-7B-Instruct-AWQ"
echo ""

echo "========================================"
echo "  Test command: qwen-run-local --yolo"
echo "========================================"