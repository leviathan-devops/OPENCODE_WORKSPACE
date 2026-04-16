#!/bin/bash
# Test local Qwen vLLM setup

echo "=== Testing Local Qwen vLLM Setup ==="
echo ""

# Load aliases
source ~/.bash_aliases 2>/dev/null || echo "Note: Run 'source ~/.bashrc' first"

echo "1. Switching to local vLLM API..."
qwen-local
echo ""

echo "2. Testing vLLM API endpoint..."
curl -s -H "Authorization: Bearer vllm-local-key" http://localhost:8000/v1/models | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    model_id = data['data'][0]['id']
    print(f'✓ vLLM server responding with model: {model_id}')
except:
    print('✗ vLLM server not responding')
"
echo ""

echo "3. Testing with curl (simple completion)..."
curl -s -H "Content-Type: application/json" \
     -H "Authorization: Bearer vllm-local-key" \
     -d '{
       "model": "deepseek-chat",
       "messages": [{"role": "user", "content": "Say hello in Python"}],
       "max_tokens": 50
     }' \
     http://localhost:8000/v1/chat/completions | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'choices' in data:
        print('✓ vLLM completion working')
        print(f'  Response: {data[\"choices\"][0][\"message\"][\"content\"][:50]}...')
    else:
        print('✗ Error:', data.get('error', 'Unknown error'))
except Exception as e:
    print('✗ Failed to get response:', str(e))
"
echo ""
echo "4. Instructions for Qwen Code:"
echo "=============================="
echo "In your terminal:"
echo "  1. source ~/.bashrc"
echo "  2. qwen-local"
echo "  3. qwen --yolo"
echo ""
echo "Qwen Code should now use local vLLM with model 'deepseek-chat'"
echo ""
echo "To switch back to DeepSeek API:"
echo "  qwen-deepseek"