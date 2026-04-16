#!/bin/bash
# Simulate what Qwen Code sends to vLLM

echo "=== Simulating Qwen Code API Request ==="
echo ""

# Create a request similar to what Qwen Code might send
REQUEST='{
  "model": "qwen-coder-14b",
  "messages": [
    {
      "role": "system",
      "content": "You are Qwen Code, an interactive CLI agent developed by Alibaba Group, specializing in software engineering tasks."
    },
    {
      "role": "user",
      "content": "List files in current directory"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "run_shell_command",
        "description": "Execute a given shell command",
        "parameters": {
          "type": "object",
          "properties": {
            "command": {
              "type": "string",
              "description": "The shell command to execute"
            },
            "description": {
              "type": "string",
              "description": "Brief description of the command"
            }
          },
          "required": ["command"]
        }
      }
    }
  ],
  "tool_choice": "auto",
  "max_tokens": 1000,
  "temperature": 0.1
}'

echo "Sending request to vLLM..."
echo "$REQUEST" | python3 -m json.tool > /tmp/request.json

curl -s -H "Authorization: Bearer vllm-local-key" \
     -H "Content-Type: application/json" \
     -d @/tmp/request.json \
     http://localhost:8000/v1/chat/completions > /tmp/response.json

echo "Response:"
cat /tmp/response.json | python3 -m json.tool 2>/dev/null || cat /tmp/response.json

echo ""
echo "=== Analysis ==="
echo "If you see 'tool_calls' in the response, Qwen Code should work."
echo "If you see an error about 'auto tool choice', vLLM needs different configuration."
echo ""
echo "Current vLLM config:"
echo "  --enable-auto-tool-choice"
echo "  --tool-call-parser qwen3_coder"