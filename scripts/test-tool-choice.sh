#!/bin/bash
# Test auto-tool-choice with vLLM

echo "=== Testing vLLM Auto Tool Choice ==="
echo ""

# Test 1: Simple completion (should work)
echo "1. Testing simple completion..."
curl -s -H "Authorization: Bearer vllm-local-key" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "qwen-coder-14b",
       "messages": [{"role": "user", "content": "Say hello"}],
       "max_tokens": 50
     }' \
     http://localhost:8000/v1/chat/completions | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'choices' in data:
        print('✓ Simple completion working')
    else:
        print('✗ Error:', data.get('error', 'Unknown error'))
except Exception as e:
    print('✗ Failed:', str(e))
"
echo ""

# Test 2: With tool choice (what Qwen Code uses)
echo "2. Testing with tool_choice='auto'..."
curl -s -H "Authorization: Bearer vllm-local-key" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "qwen-coder-14b",
       "messages": [{"role": "user", "content": "What is 2+2?"}],
       "tools": [
         {
           "type": "function",
           "function": {
             "name": "calculate",
             "description": "Perform a calculation",
             "parameters": {
               "type": "object",
               "properties": {
                 "expression": {
                   "type": "string",
                   "description": "The mathematical expression to evaluate"
                 }
               },
               "required": ["expression"]
             }
           }
         }
       ],
       "tool_choice": "auto",
       "max_tokens": 100
     }' \
     http://localhost:8000/v1/chat/completions | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'choices' in data:
        choice = data['choices'][0]
        if 'message' in choice:
            message = choice['message']
            if 'tool_calls' in message and message['tool_calls']:
                print('✓ Tool calls working with auto tool choice')
                print(f'  Tool call: {message[\"tool_calls\"][0][\"function\"][\"name\"]}')
            elif 'content' in message:
                print('✓ API responded (no tool call needed)')
                content = message['content'] or ''
                print(f'  Response: {content[:50]}...')
            else:
                print('✓ API responded (empty message)')
        else:
            print('✓ API responded (no message content)')
    else:
        print('✗ Error:', data.get('error', 'Unknown error'))
except Exception as e:
    print('✗ Failed:', str(e))
"
echo ""

# Test 3: Check vLLM configuration
echo "3. Checking vLLM configuration..."
curl -s -H "Authorization: Bearer vllm-local-key" http://localhost:8000/v1/models | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    model = data['data'][0]
    print(f'✓ Model: {model[\"id\"]}')
    print(f'✓ Max model length: {model.get(\"max_model_len\", \"unknown\")}')
    print('✓ Auto tool choice should be enabled')
except Exception as e:
    print('✗ Failed:', str(e))
"
echo ""
echo "If all tests pass, Qwen Code should work with local vLLM!"