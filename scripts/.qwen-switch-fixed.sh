#!/bin/bash
# Qwen API Switching Script - Fixed version
# Usage: . ~/.qwen-switch-fixed.sh [local|deepseek|openrouter]

SWITCH_TO="${1:-local}"

case "$SWITCH_TO" in
    local|vllm)
        echo "Switching to LOCAL vLLM API (http://localhost:8000/v1)"
        OPENAI_BASE_URL="http://localhost:8000/v1"
        OPENAI_API_KEY="vllm-local-key"
        VLLM_ACTIVE=1
        ;;
    deepseek)
        echo "Switching to DeepSeek API"
        OPENAI_BASE_URL="https://api.deepseek.com/v1"
        OPENAI_API_KEY="<REDACTED_SET_VIA_ENV>"
        VLLM_ACTIVE=0
        ;;
    openrouter)
        echo "Switching to OpenRouter API"
        OPENAI_BASE_URL="https://openrouter.ai/api/v1"
        OPENAI_API_KEY="sk-or-v1-..."
        VLLM_ACTIVE=0
        ;;
    *)
        echo "Usage: . ~/.qwen-switch-fixed.sh [local|deepseek|openrouter]"
        echo "Current settings:"
        echo "  OPENAI_BASE_URL=${OPENAI_BASE_URL:-not set}"
        echo "  VLLM_ACTIVE=${VLLM_ACTIVE:-0}"
        return 1
        ;;
esac

# Export variables for current shell
export OPENAI_BASE_URL
export OPENAI_API_KEY
export VLLM_ACTIVE

# Update .bashrc for future terminals
sed -i '/^export OPENAI_BASE_URL=/d' ~/.bashrc
sed -i '/^export OPENAI_API_KEY=/d' ~/.bashrc
echo "export OPENAI_BASE_URL=\"$OPENAI_BASE_URL\"" >> ~/.bashrc
echo "export OPENAI_API_KEY=\"$OPENAI_API_KEY\"" >> ~/.bashrc

echo "API switched to: $SWITCH_TO"
echo "Current terminal now uses: $OPENAI_BASE_URL"
echo "New terminals will also use this endpoint"