#!/bin/bash
# Simple Qwen API switch for current terminal
# Run with: source ~/qwen-switch-simple.sh [local|deepseek]

case "$1" in
    local)
        export OPENAI_BASE_URL="http://localhost:8000/v1"
        export OPENAI_API_KEY="vllm-local-key"
        echo "Switched to LOCAL vLLM: $OPENAI_BASE_URL"
        ;;
    deepseek)
        export OPENAI_BASE_URL="https://api.deepseek.com/v1"
        export OPENAI_API_KEY="sk-e8e93e31b582423e9fdaa4ab8e9347e2"
        echo "Switched to DeepSeek: $OPENAI_BASE_URL"
        ;;
    status)
        echo "Current API: ${OPENAI_BASE_URL:-not set}"
        echo "Key: ${OPENAI_API_KEY:0:10}..."
        ;;
    *)
        echo "Usage: source ~/qwen-switch-simple.sh [local|deepseek|status]"
        echo ""
        echo "Examples:"
        echo "  source ~/qwen-switch-simple.sh local    # Use local vLLM"
        echo "  source ~/qwen-switch-simple.sh deepseek # Use DeepSeek API"
        echo "  source ~/qwen-switch-simple.sh status   # Check current API"
        ;;
esac