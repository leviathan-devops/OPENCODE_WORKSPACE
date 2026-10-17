#!/bin/bash
# Test vLLM without tool calls

echo "=== Testing vLLM without tool calls ==="
echo ""

# Test without tools parameter
curl -s -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "qwen-coder-14b",
       "messages": [
         {
           "role": "system",
           "content": "You are a helpful assistant."
         },
         {
           "role": "user",
           "content": "List files in current directory"
         }
       ],
       "max_tokens": 100
     }' \
     http://localhost:8000/v1/chat/completions | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'choices' in data:
        print('✓ API working without tools')
        response = data['choices'][0]['message']['content']
        print(f'  Response: {response[:100]}...')
    else:
        print('✗ Error:', data.get('error', 'Unknown error'))
except Exception as e:
    print('✗ Failed:', str(e))
"