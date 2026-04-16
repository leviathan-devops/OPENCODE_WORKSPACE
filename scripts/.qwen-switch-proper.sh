#!/bin/bash
# Proper Qwen API switching that updates Qwen Code settings
# Usage: . ~/.qwen-switch-proper.sh [local|deepseek]

SWITCH_TO="${1:-local}"
SETTINGS_FILE="$HOME/.qwen/settings.json"

case "$SWITCH_TO" in
    local|vllm)
        echo "Switching to LOCAL vLLM API"
        export OPENAI_BASE_URL="http://localhost:8000/v1"
        export OPENAI_API_KEY="vllm-local-key"
        
        # Update Qwen Code settings (both files)
        if [ -f "$SETTINGS_FILE" ]; then
            python3 -c "
import json
# Update settings.json
with open('$SETTINGS_FILE', 'r') as f:
    settings = json.load(f)
settings['model']['name'] = 'qwen-coder-14b'
with open('$SETTINGS_FILE', 'w') as f:
    json.dump(settings, f, indent=2)

# Update config.json
config_file = '$HOME/.qwen/config.json'
try:
    with open(config_file, 'r') as f:
        config = json.load(f)
    config['api_base'] = 'http://localhost:8000/v1'
    config['api_key'] = 'vllm-local-key'
    config['model'] = 'qwen-coder-14b'
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
except:
    # Create config.json if it doesn't exist
    config = {
        'api_base': 'http://localhost:8000/v1',
        'api_key': 'vllm-local-key',
        'model': 'qwen-coder-14b'
    }
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
"
            echo "✓ Qwen Code settings updated to use model: qwen-coder-14b"
        else
            echo "⚠ Could not find Qwen settings file: $SETTINGS_FILE"
        fi
        ;;
        
    deepseek)
        echo "Switching to DeepSeek API"
        export OPENAI_BASE_URL="https://api.deepseek.com/v1"
        export OPENAI_API_KEY="sk-e8e93e31b582423e9fdaa4ab8e9347e2"
        
        # Update Qwen Code settings (both files)
        if [ -f "$SETTINGS_FILE" ]; then
            python3 -c "
import json
# Update settings.json
with open('$SETTINGS_FILE', 'r') as f:
    settings = json.load(f)
settings['model']['name'] = 'deepseek-chat'
with open('$SETTINGS_FILE', 'w') as f:
    json.dump(settings, f, indent=2)

# Update config.json
config_file = '$HOME/.qwen/config.json'
try:
    with open(config_file, 'r') as f:
        config = json.load(f)
    config['api_base'] = 'https://api.deepseek.com/v1'
    config['api_key'] = 'sk-e8e93e31b582423e9fdaa4ab8e9347e2'
    config['model'] = 'deepseek-chat'
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
except:
    # Create config.json if it doesn't exist
    config = {
        'api_base': 'https://api.deepseek.com/v1',
        'api_key': 'sk-e8e93e31b582423e9fdaa4ab8e9347e2',
        'model': 'deepseek-chat'
    }
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
"
            echo "✓ Qwen Code settings updated to use model: deepseek-chat"
        else
            echo "⚠ Could not find Qwen settings file: $SETTINGS_FILE"
        fi
        ;;
        
    status)
        echo "Current API: ${OPENAI_BASE_URL:-not set}"
        if [ -f "$SETTINGS_FILE" ]; then
            python3 -c "
import json
with open('$SETTINGS_FILE', 'r') as f:
    settings = json.load(f)
print('Qwen Code model:', settings.get('model', {}).get('name', 'unknown'))
"
        fi
        return 0
        ;;
        
    *)
        echo "Usage: . ~/.qwen-switch-proper.sh [local|deepseek|status]"
        echo ""
        echo "  local     - Use local vLLM with model 'qwen-coder-14b'"
        echo "  deepseek  - Use DeepSeek API with model 'deepseek-chat'"
        echo "  status    - Show current settings"
        return 1
        ;;
esac

echo "API endpoint: $OPENAI_BASE_URL"
echo "Run 'qwen' in this terminal to use the new settings"