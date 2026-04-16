#!/bin/bash
# Ultimate Qwen Code Local vLLM Test

echo "========================================="
echo "  QWEN CODE LOCAL VLLM - ULTIMATE TEST"
echo "========================================="
echo ""

# Load functions
source ~/.bash_aliases 2>/dev/null

echo "1. Checking vLLM server..."
echo "--------------------------"
systemctl --user is-active vllm-qwen.service >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ vLLM server is running"
    
    # Test API
    curl -s -H "Authorization: Bearer vllm-local-key" http://localhost:8000/v1/models > /tmp/vllm-test.json 2>&1
    if grep -q "qwen-coder-14b" /tmp/vllm-test.json; then
        echo "✓ vLLM API responding with model: qwen-coder-14b"
    else
        echo "✗ vLLM API not responding correctly"
        cat /tmp/vllm-test.json
    fi
else
    echo "✗ vLLM server is NOT running"
    echo "  Start it with: systemctl --user start vllm-qwen.service"
fi
echo ""

echo "2. Checking Qwen Code configuration..."
echo "--------------------------------------"
echo "settings.json:"
python3 -c "
import json
try:
    with open('$HOME/.qwen/settings.json', 'r') as f:
        settings = json.load(f)
    model = settings.get('model', {}).get('name', 'NOT FOUND')
    print(f'  Model: {model}')
except Exception as e:
    print(f'  Error: {e}')
"

echo "config.json:"
python3 -c "
import json
try:
    with open('$HOME/.qwen/config.json', 'r') as f:
        config = json.load(f)
    model = config.get('model', 'NOT FOUND')
    api_base = config.get('api_base', 'NOT FOUND')
    print(f'  Model: {model}')
    print(f'  API: {api_base}')
except Exception as e:
    print(f'  Error: {e}')
"
echo ""

echo "3. Testing API completion..."
echo "----------------------------"
curl -s -H "Authorization: Bearer vllm-local-key" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "qwen-coder-14b",
       "messages": [{"role": "user", "content": "Say hello"}],
       "max_tokens": 20
     }' \
     http://localhost:8000/v1/chat/completions > /tmp/vllm-completion.json 2>&1

if grep -q "choices" /tmp/vllm-completion.json; then
    echo "✓ vLLM completion working"
    python3 -c "
import json
with open('/tmp/vllm-completion.json', 'r') as f:
    data = json.load(f)
response = data['choices'][0]['message']['content']
print(f'  Response: \"{response}\"')
"
else
    echo "✗ vLLM completion failed"
    cat /tmp/vllm-completion.json
fi
echo ""

echo "4. FINAL SOLUTION - Choose one:"
echo "================================"
echo ""
echo "OPTION A: Use switching commands (per-terminal)"
echo "-----------------------------------------------"
echo "  # In terminal 1 (local vLLM):"
echo "  source ~/.bashrc"
echo "  qwen-local"
echo "  qwen --yolo"
echo ""
echo "  # In terminal 2 (DeepSeek):"
echo "  source ~/.bashrc"
echo "  qwen-deepseek"
echo "  qwen --yolo"
echo ""
echo "OPTION B: Use direct run commands"
echo "----------------------------------"
echo "  # For local vLLM:"
echo "  qwen-run-local --yolo"
echo ""
echo "  # For DeepSeek:"
echo "  qwen-run-deepseek --yolo"
echo ""
echo "OPTION C: Manual override"
echo "-------------------------"
echo "  # Force model with -m flag:"
echo "  qwen -m qwen-coder-14b --yolo"
echo ""
echo "========================================="
echo "  RECOMMENDED: Use OPTION B"
echo "  Command: qwen-run-local --yolo"
echo "========================================="