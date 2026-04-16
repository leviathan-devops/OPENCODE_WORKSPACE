#!/bin/bash
# Qwen with Local Qwen Coder - COMPLETE FIX
# Forces local execution by overriding configuration files

echo "🤖 Qwen with Local Qwen Coder (COMPLETE FIX)"
echo "==========================================="
echo "🧠 Architecture: Dual-Brain (DeepSeek R1 + Local Qwen)"
echo "💰 Cost: 100% free execution tokens"
echo "📍 Model: Qwen2.5-Coder-7B (Local GPU)"
echo "🔗 API: http://localhost:8001/v1"
echo ""

# Check if local agents are running
if ! curl -s http://localhost:8001/v1/models > /dev/null; then
    echo "⚠️  Local agents not running!"
    echo "   Starting local agents..."
    sudo systemctl start qwen-coders.service
    sleep 3
    
    # Check again after starting
    if ! curl -s http://localhost:8001/v1/models > /dev/null; then
        echo "❌ Failed to start local agents"
        exit 1
    fi
fi

# Check if qwen command exists
if ! command -v qwen &> /dev/null; then
    echo "❌ Qwen command not found"
    exit 1
fi

# Create temporary directory for override configs
TEMP_DIR=$(mktemp -d)

# Override Qwen Code configuration
cat > "$TEMP_DIR/qwen-code-config.json" << 'EOF'
{
  "auth": {
    "type": "api_key",
    "api_key": "qwen-local-execution"
  },
  "api_base": "http://localhost:8001/v1",
  "model": "qwen-coder-7b-local"
}
EOF

cat > "$TEMP_DIR/qwen-code-settings.json" << 'EOF'
{
  "auth_type": "api_key",
  "api_base": "http://localhost:8001/v1",
  "model": "qwen-coder-7b-local",
  "api_key": "qwen-local-execution"
}
EOF

# Override Qwen CLI configuration
cat > "$TEMP_DIR/qwen-config.json" << 'EOF'
{
  "api_base": "http://localhost:8001/v1",
  "api_key": "qwen-local-execution",
  "model": "qwen-coder-7b-local"
}
EOF

echo "🔧 Applying configuration overrides:"

# Set environment variables to override config files
export QWEN_CODE_CONFIG_FILE="$TEMP_DIR/qwen-code-config.json"
export QWEN_CODE_SETTINGS_FILE="$TEMP_DIR/qwen-code-settings.json"
export QWEN_CONFIG_FILE="$TEMP_DIR/qwen-config.json"

# Also set standard environment variables
export OPENAI_API_BASE="http://localhost:8001/v1"
export OPENAI_API_KEY="qwen-local-execution"
export OPENAI_MODEL="qwen-coder-7b-local"

# Clear conflicting environment variables
unset GLM_API_KEY GLM_API_BASE QWEN_API_KEY QWEN_API_BASE

echo "   ✅ Qwen Code config: $QWEN_CODE_CONFIG_FILE"
echo "   ✅ Qwen Code settings: $QWEN_CODE_SETTINGS_FILE"
echo "   ✅ Qwen CLI config: $QWEN_CONFIG_FILE"
echo "   ✅ Environment: OPENAI_API_BASE=$OPENAI_API_BASE"
echo "   ✅ Environment: OPENAI_API_KEY=$OPENAI_API_KEY"
echo "   ✅ Environment: OPENAI_MODEL=$OPENAI_MODEL"

# Pass all arguments to qwen command
echo ""
echo "🚀 Launching Qwen with LOCAL Qwen Coder..."
echo "📡 Using endpoint: http://localhost:8001/v1"
echo "🔑 API Key: qwen-local-execution"
echo ""

# Execute qwen with all configuration overrides
exec qwen "$@"

# Cleanup (this won't be reached due to exec)
rm -rf "$TEMP_DIR"