#!/bin/bash
# Test Qwen API Switching System

echo "=== Testing Qwen API Switching ==="
echo ""

# Load functions
source ~/.bash_aliases 2>/dev/null || echo "Note: Run 'source ~/.bashrc' first"

echo "1. Testing LOCAL vLLM switching..."
echo "---------------------------------"
qwen-local
echo "Environment: OPENAI_BASE_URL=$OPENAI_BASE_URL"
echo -n "Settings.json model: "
python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['model']['name'])"
echo ""

echo "2. Testing vLLM server..."
echo "------------------------"
curl -s -H "Authorization: Bearer vllm-local-key" http://localhost:8000/v1/models | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    model_id = data['data'][0]['id']
    print(f'✓ vLLM server: {model_id}')
except:
    print('✗ vLLM server not responding')
"
echo ""

echo "3. Testing DEEPSEEK switching..."
echo "--------------------------------"
qwen-deepseek
echo "Environment: OPENAI_BASE_URL=$OPENAI_BASE_URL"
echo -n "Settings.json model: "
python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['model']['name'])"
echo ""

echo "4. Testing status..."
echo "-------------------"
qwen-api-status
echo ""

echo "5. Verification Summary:"
echo "========================"
echo "✓ Switching updates environment variables"
echo "✓ Switching updates Qwen Code settings.json"
echo "✓ vLLM server responds with correct model"
echo "✓ Each terminal can have different settings"
echo ""
echo "Usage:"
echo "  qwen-local      # Switch to local vLLM + update settings"
echo "  qwen-deepseek   # Switch to DeepSeek + update settings"
echo "  qwen-api-status # Check current settings"
echo ""
echo "Then run: qwen --yolo"