#!/bin/bash
# Per-terminal Qwen API switching
# Use this to switch API in current terminal only (doesn't affect .bashrc)

SWITCH_TO="${1:-local}"

case "$SWITCH_TO" in
    local|vllm)
        echo "Current terminal now using LOCAL vLLM API"
        export OPENAI_BASE_URL="http://localhost:8000/v1"
        export OPENAI_API_KEY="vllm-local-key"
        ;;
    deepseek)
        echo "Current terminal now using DeepSeek API"
        export OPENAI_BASE_URL="https://api.deepseek.com/v1"
        export OPENAI_API_KEY="sk-e8e93e31b582423e9fdaa4ab8e9347e2"
        ;;
    openrouter)
        echo "Current terminal now using OpenRouter API"
        export OPENAI_BASE_URL="https://openrouter.ai/api/v1"
        export OPENAI_API_KEY="sk-or-v1-..."
        ;;
    status)
        echo "Current terminal API: ${OPENAI_BASE_URL:-not set}"
        echo "API Key: ${OPENAI_API_KEY:0:10}..."
        return 0
        ;;
    *)
        echo "Usage: . ~/qwen-terminal-switch.sh [local|deepseek|openrouter|status]"
        echo "  local      - Use local vLLM (http://localhost:8000/v1)"
        echo "  deepseek   - Use DeepSeek API"
        echo "  openrouter - Use OpenRouter API"
        echo "  status     - Show current API"
        echo ""
        echo "Note: This only affects the current terminal session."
        echo "      Other terminals keep their own API settings."
        return 1
        ;;
esac

echo "API endpoint: $OPENAI_BASE_URL"
echo "Run 'qwen' in this terminal to use the new endpoint"