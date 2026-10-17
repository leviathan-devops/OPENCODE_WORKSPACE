#!/bin/bash
# Qwen API Switching Script
# Usage: source ~/.qwen-switch.sh [local|deepseek|openrouter]

SWITCH_TO="${1:-local}"

case "$SWITCH_TO" in
    local|vllm)
        echo "Switching to LOCAL vLLM API (http://localhost:8000/v1)"
        export OPENAI_BASE_URL="http://localhost:8000/v1"
        export OPENAI_API_KEY="vllm-local-key"
        export VLLM_ACTIVE=1
        ;;
    deepseek)
        echo "Switching to DeepSeek API"
        export OPENAI_BASE_URL="https://api.deepseek.com/v1"
        export OPENAI_API_KEY="<REDACTED_SET_VIA_ENV>"
        export VLLM_ACTIVE=0
        ;;
    openrouter)
        echo "Switching to OpenRouter API"
        export OPENAI_BASE_URL="https://openrouter.ai/api/v1"
        export OPENAI_API_KEY="sk-or-v1-..."
        export VLLM_ACTIVE=0
        ;;
    *)
        echo "Usage: source ~/.qwen-switch.sh [local|deepseek|openrouter]"
        echo "Current settings:"
        echo "  OPENAI_BASE_URL=$OPENAI_BASE_URL"
        echo "  VLLM_ACTIVE=${VLLM_ACTIVE:-0}"
        return 1
        ;;
esac

# Update .bashrc for persistence
sed -i '/^export OPENAI_BASE_URL=/d' ~/.bashrc
sed -i '/^export OPENAI_API_KEY=/d' ~/.bashrc
echo "export OPENAI_BASE_URL=\"$OPENAI_BASE_URL\"" >> ~/.bashrc
echo "export OPENAI_API_KEY=\"$OPENAI_API_KEY\"" >> ~/.bashrc

echo "API switched to: $SWITCH_TO"
echo "Restart Qwen Code terminals to use new endpoint"