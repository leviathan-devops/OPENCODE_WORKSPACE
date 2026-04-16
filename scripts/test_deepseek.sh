#!/bin/bash

# Replace YOUR_VALID_API_KEY_HERE with your actual DeepSeek API key
API_KEY="YOUR_VALID_API_KEY_HERE"

curl -s https://api.deepseek.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }' | jq .