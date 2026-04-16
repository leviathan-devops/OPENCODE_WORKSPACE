#!/bin/bash
# Final test of Qwen Code with local vLLM

echo "=== Final Qwen Code Test ==="
echo ""

# Switch to local vLLM
echo "1. Switching to local vLLM..."
. ~/.bash_aliases
qwen-local
echo ""

echo "2. Current configuration:"
echo "   OPENAI_BASE_URL: $OPENAI_BASE_URL"
echo "   settings.json model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['model']['name'])")"
echo "   config.json model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/config.json'))['model'])")"
echo ""

echo "3. Testing vLLM API directly..."
curl -s -H "Authorization: Bearer vllm-local-key" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "qwen-coder-14b",
       "messages": [{"role": "user", "content": "Write a Python function to add two numbers"}],
       "max_tokens": 100
     }' \
     http://localhost:8000/v1/chat/completions | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'choices' in data:
        print('✓ vLLM API working')
        response = data['choices'][0]['message']['content']
        print(f'   Response: {response[:80]}...')
    else:
        print('✗ Error:', data.get('error', 'Unknown error'))
except Exception as e:
    print('✗ Failed:', str(e))
"
echo ""

echo "4. Instructions:"
echo "================"
echo "Now run: qwen --yolo"
echo ""
echo "Qwen Code should use:"
echo "  - API: http://localhost:8000/v1"
echo "  - Model: qwen-coder-14b"
echo "  - Key: vllm-local-key"
echo ""
echo "If it still shows 'deepseek-chat does not exist', try:"
echo "  1. Close all Qwen Code terminals"
echo "  2. Run this test script"
echo "  3. Open a NEW terminal and run 'qwen --yolo'"