#!/bin/bash
# SIMPLE script to use qwen with vLLM
# NO WRAPPERS, NO BULLSHIT

# Check if vLLM is ready
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "Note: vLLM might still be loading. Run: sudo -S -p '' systemctl status vllm-ultimate-beast"
fi

# Use qwen with explicit parameters
/usr/bin/qwen \
    --model "qwen2.5-coder-14b-awq" \
    --openai-base-url "http://localhost:8000/v1" \
    --openai-api-key "no-key-required-local-vllm" \
    "$@"
