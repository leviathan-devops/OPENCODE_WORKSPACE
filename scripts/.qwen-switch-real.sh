#!/bin/bash
# REAL Qwen API switching that actually works
# Usage: . ~/.qwen-switch-real.sh [local|deepseek]

SWITCH_TO="${1:-local}"
SETTINGS_FILE="$HOME/.qwen/settings.json"
CONFIG_FILE="$HOME/.qwen/config.json"

# Create backup of current environment
CURRENT_API="${OPENAI_BASE_URL:-not set}"
CURRENT_KEY="${OPENAI_API_KEY:-not set}"

case "$SWITCH_TO" in
    llama|qwen35|qwen3.5)
        echo "🔄 SWITCHING to llama.cpp Qwen3.5-9B GGUF"

        # 1. Set environment variables (immediate effect)
        export OPENAI_BASE_URL="http://localhost:8000/v1"
        export OPENAI_API_KEY="llama-cpp-key"

        # 2. Update config.json (Qwen Code reads this)
        cat > "$CONFIG_FILE" << EOF
{
  "api_base": "http://localhost:8000/v1",
  "api_key": "llama-cpp-key",
  "model": "Qwen3.5-9B"
}
EOF

        # 3. Update settings.json (Qwen Code also reads this)
        if [ -f "$SETTINGS_FILE" ]; then
            python3 -c "
import json
with open('$SETTINGS_FILE', 'r') as f:
    settings = json.load(f)
settings['model']['name'] = 'Qwen3.5-9B'
if 'security' not in settings:
    settings['security'] = {}
if 'auth' not in settings['security']:
    settings['security']['auth'] = {}
settings['security']['auth']['preferredType'] = 'openai'
settings['security']['auth']['selectedType'] = 'openai'
if 'generationConfig' not in settings:
    settings['generationConfig'] = {}
if 'samplingParams' not in settings['generationConfig']:
    settings['generationConfig']['samplingParams'] = {}
settings['generationConfig']['samplingParams']['max_tokens'] = 8192
with open('$SETTINGS_FILE', 'w') as f:
    json.dump(settings, f, indent=2)
"
        fi

        echo "✅ SWITCHED to llama.cpp Qwen3.5-9B GGUF"
        echo "   Model: Qwen3.5-9B (Q4_K_M quantized)"
        echo "   API: http://localhost:8000/v1"
        echo "   GPU: RTX 4080 Laptop (full offload)"
        echo "   Context: 8192 tokens"
        ;;

    local|vllm)
        echo "🔄 SWITCHING to LOCAL vLLM API"

        # 1. Set environment variables (immediate effect)
        export OPENAI_BASE_URL="http://localhost:8001/v1"  # Use proxy on port 8001
        export OPENAI_API_KEY="vllm-local-key"

        # 2. Update config.json (Qwen Code reads this)
        cat > "$CONFIG_FILE" << EOF
{
  "api_base": "http://localhost:8001/v1",  # Use proxy on port 8001
  "api_key": "vllm-local-key",
  "model": "qwen-coder-14b"
}
EOF
        
        # 3. Update settings.json (Qwen Code also reads this)
        if [ -f "$SETTINGS_FILE" ]; then
            python3 -c "
import json
with open('$SETTINGS_FILE', 'r') as f:
    settings = json.load(f)
settings['model']['name'] = 'qwen-coder-14b'
# Set auth type to openai for API-based services
if 'security' not in settings:
    settings['security'] = {}
if 'auth' not in settings['security']:
    settings['security']['auth'] = {}
settings['security']['auth']['preferredType'] = 'openai'
settings['security']['auth']['selectedType'] = 'openai'
# Reduce max_tokens for local vLLM (model max is 4096)
if 'generationConfig' not in settings:
    settings['generationConfig'] = {}
if 'samplingParams' not in settings['generationConfig']:
    settings['generationConfig']['samplingParams'] = {}
settings['generationConfig']['samplingParams']['max_tokens'] = 3072
with open('$SETTINGS_FILE', 'w') as f:
    json.dump(settings, f, indent=2)
"
        fi
        
        echo "✅ SWITCHED to LOCAL vLLM (via proxy)"
        echo "   Model: qwen-coder-14b"
        echo "   API: http://localhost:8001/v1 (proxy → 8000)"
        echo "   Key: vllm-local-key"
        echo "   Note: Proxy fixes max_tokens issue (8192 → 3072)"
        ;;
        
    deepseek)
        echo "🔄 SWITCHING to DeepSeek API"
        
        # 1. Set environment variables (immediate effect)
        export OPENAI_BASE_URL="https://api.deepseek.com/v1"
        export OPENAI_API_KEY="sk-e8e93e31b582423e9fdaa4ab8e9347e2"
        
        # 2. Update config.json (Qwen Code reads this)
        cat > "$CONFIG_FILE" << EOF
{
  "api_base": "https://api.deepseek.com/v1",
  "api_key": "sk-e8e93e31b582423e9fdaa4ab8e9347e2",
  "model": "deepseek-chat"
}
EOF
        
        # 3. Update settings.json (Qwen Code also reads this)
        if [ -f "$SETTINGS_FILE" ]; then
            python3 -c "
import json
with open('$SETTINGS_FILE', 'r') as f:
    settings = json.load(f)
settings['model']['name'] = 'deepseek-chat'
# Set auth type to openai for API-based services
if 'security' not in settings:
    settings['security'] = {}
if 'auth' not in settings['security']:
    settings['security']['auth'] = {}
settings['security']['auth']['preferredType'] = 'openai'
settings['security']['auth']['selectedType'] = 'openai'
# Restore max_tokens for cloud APIs
if 'generationConfig' not in settings:
    settings['generationConfig'] = {}
if 'samplingParams' not in settings['generationConfig']:
    settings['generationConfig']['samplingParams'] = {}
settings['generationConfig']['samplingParams']['max_tokens'] = 8192
with open('$SETTINGS_FILE', 'w') as f:
    json.dump(settings, f, indent=2)
"
        fi
        
        echo "✅ SWITCHED to DeepSeek"
        echo "   Model: deepseek-chat"
        echo "   API: https://api.deepseek.com/v1"
        echo "   Key: sk-...7e2"
        ;;
        
    free)
        echo "🔄 SWITCHING to FREE Qwen API (Alibaba servers via OAuth)"

        # 1. Set environment variables (immediate effect)
        # Qwen OAuth uses internal token management, no need for OPENAI_* vars
        unset OPENAI_BASE_URL
        unset OPENAI_API_KEY

        # 2. Update config.json (Qwen Code reads this)
        cat > "$CONFIG_FILE" << EOF
{
  "api_base": "",
  "api_key": "",
  "model": "coder-model"
}
EOF

        # 3. Update settings.json (Qwen Code also reads this)
        if [ -f "$SETTINGS_FILE" ]; then
            python3 -c "
import json
with open('$SETTINGS_FILE', 'r') as f:
    settings = json.load(f)
settings['model']['name'] = 'coder-model'  # Valid Qwen OAuth model name
# Set auth type to qwen-oauth for FREE API
if 'security' not in settings:
    settings['security'] = {}
if 'auth' not in settings['security']:
    settings['security']['auth'] = {}
settings['security']['auth']['preferredType'] = 'qwen-oauth'
settings['security']['auth']['selectedType'] = 'qwen-oauth'
# Restore max_tokens for cloud APIs
if 'generationConfig' not in settings:
    settings['generationConfig'] = {}
if 'samplingParams' not in settings['generationConfig']:
    settings['generationConfig']['samplingParams'] = {}
settings['generationConfig']['samplingParams']['max_tokens'] = 8192
with open('$SETTINGS_FILE', 'w') as f:
    json.dump(settings, f, indent=2)
"
        fi

        echo "✅ SWITCHED to FREE Qwen API"
        echo "   Model: coder-model"
        echo "   Auth: Qwen OAuth (uses oauth_creds.json)"
        echo "   Note: Subject to rate limits, no API key needed"
        ;;
        
    healer-alpha|healer)
        echo "🔄 SWITCHING to Healer-Alpha (OpenRouter)"
        
        # 1. Set environment variables (immediate effect)
        export OPENAI_BASE_URL="https://openrouter.ai/api/v1"
        export OPENAI_API_KEY="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"
        
        # 2. Update config.json (Qwen Code reads this)
        cat > "$CONFIG_FILE" << EOF
{
  "api_base": "https://openrouter.ai/api/v1",
  "api_key": "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",
  "model": "xiaomi/mimo-v2-omni"
}
EOF
        
        # 3. Update settings.json (Qwen Code also reads this)
        if [ -f "$SETTINGS_FILE" ]; then
            python3 -c "
import json
with open('$SETTINGS_FILE', 'r') as f:
    settings = json.load(f)
settings['model']['name'] = 'xiaomi/mimo-v2-omni'  # Healer-Alpha (stealth MiMo-V2-Omni)
# Set auth type to openai for API-based services
if 'security' not in settings:
    settings['security'] = {}
if 'auth' not in settings['security']:
    settings['security']['auth'] = {}
settings['security']['auth']['preferredType'] = 'openai'
settings['security']['auth']['selectedType'] = 'openai'
# Restore max_tokens for cloud APIs
if 'generationConfig' not in settings:
    settings['generationConfig'] = {}
if 'samplingParams' not in settings['generationConfig']:
    settings['generationConfig']['samplingParams'] = {}
settings['generationConfig']['samplingParams']['max_tokens'] = 8192
with open('$SETTINGS_FILE', 'w') as f:
    json.dump(settings, f, indent=2)
"
        fi
        
        echo "✅ SWITCHED to Healer-Alpha (MiMo-V2-Omni)"
        echo "   Model: xiaomi/mimo-v2-omni"
        echo "   API: https://openrouter.ai/api/v1"
        echo "   Key: sk-or-v1-...75c"
        ;;
        
    status)
        echo "📊 CURRENT STATUS:"
        echo "   OPENAI_BASE_URL: ${OPENAI_BASE_URL:-not set}"
        if [ -n "$OPENAI_API_KEY" ]; then
            echo "   OPENAI_API_KEY: ${OPENAI_API_KEY:0:10}..."
        else
            echo "   OPENAI_API_KEY: (empty - using OAuth)"
        fi
        if [ -f "$CONFIG_FILE" ]; then
            echo "   config.json:"
            python3 -c "
import json
with open('$CONFIG_FILE', 'r') as f:
    config = json.load(f)
print(f'     API: {config.get(\"api_base\", \"not found\")}')
print(f'     Model: {config.get(\"model\", \"not found\")}')
key = config.get(\"api_key\", \"\")
if key:
    print(f'     Key: {key[:10]}...')
else:
    print(f'     Key: (empty - OAuth)')
"
        fi
        if [ -f "$SETTINGS_FILE" ]; then
            echo "   settings.json model:"
            python3 -c "
import json
with open('$SETTINGS_FILE', 'r') as f:
    settings = json.load(f)
print(f'     {settings.get(\"model\", {}).get(\"name\", \"not found\")}')
"
        fi
        return 0
        ;;
        
    *)
        echo "Usage: . ~/.qwen-switch-real.sh [llama|local|deepseek|free|healer-alpha|status]"
        echo ""
        echo "  llama         - Switch to llama.cpp Qwen3.5-9B GGUF (NEW)"
        echo "  local         - Switch to local vLLM (qwen-coder-14b)"
        echo "  deepseek      - Switch to DeepSeek API (deepseek-chat)"
        echo "  free          - Switch to FREE Qwen API (qwen-max, rate limited)"
        echo "  healer-alpha  - Switch to Healer-Alpha on OpenRouter"
        echo "  status        - Show current configuration"
        return 1
        ;;
esac

echo ""
echo "💡 To use: Run 'qwen' in THIS terminal"
echo "   (Changes apply to current terminal only)"