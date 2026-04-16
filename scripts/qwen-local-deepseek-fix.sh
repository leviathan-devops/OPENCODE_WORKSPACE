#!/bin/bash
# Qwen with Local Qwen Coder - DEEPSEEK APPROVED FIX
# Forces local execution by completely overriding all configuration

echo "🤖 Qwen with Local Qwen Coder (DEEPSEEK FIX)"
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

echo "🔧 DEEPSEEK APPROVED CONFIGURATION OVERRIDE:"

# Clear all possible environment variables that could interfere
unset_vars=(
    "OPENAI_API_KEY" "OPENAI_API_BASE" "OPENAI_MODEL"
    "GLM_API_KEY" "GLM_API_BASE" "GLM_MODEL"
    "QWEN_API_KEY" "QWEN_API_BASE" "QWEN_MODEL"
    "ANTHROPIC_API_KEY" "COHERE_API_KEY"
    "AIDER_API_KEY" "AIDER_API_BASE"
    "QWEN_CODE_API_KEY" "QWEN_CODE_API_BASE"
)

for var in "${unset_vars[@]}"; do
    unset "$var"
done

# Set aggressive environment variables
export OPENAI_API_BASE="http://localhost:8001/v1"
export OPENAI_API_KEY="qwen-local-execution"
export OPENAI_MODEL="qwen-coder-7b-local"

# Also set QWEN-specific variables
export QWEN_API_BASE="http://localhost:8001/v1"
export QWEN_API_KEY="qwen-local-execution"
export QWEN_MODEL="qwen-coder-7b-local"

# Use config file override as backup
export QWEN_CODE_CONFIG_FILE="/tmp/qwen-local-config.json"

# Create config file override
cat > "$QWEN_CODE_CONFIG_FILE" << 'EOF'
{
  "auth": {
    "type": "api_key",
    "api_key": "qwen-local-execution"
  },
  "api_base": "http://localhost:8001/v1",
  "model": "qwen-coder-7b-local"
}
EOF

echo "   ✅ All conflicting environment variables cleared"
echo "   ✅ OPENAI_API_BASE: $OPENAI_API_BASE"
echo "   ✅ OPENAI_API_KEY: $OPENAI_API_KEY"
echo "   ✅ OPENAI_MODEL: $OPENAI_MODEL"
echo "   ✅ Config file override: $QWEN_CODE_CONFIG_FILE"

# Pass all arguments to qwen with maximum environment override
echo ""
echo "🚀 Launching Qwen with DEEPSEEK APPROVED LOCAL configuration..."
echo "📡 Using endpoint: $OPENAI_API_BASE"
echo "🔑 API Key: $OPENAI_API_KEY"
echo ""

# Execute with maximum environment override
env \
  OPENAI_API_BASE="$OPENAI_API_BASE" \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  OPENAI_MODEL="$OPENAI_MODEL" \
  QWEN_API_BASE="$QWEN_API_BASE" \
  QWEN_API_KEY="$QWEN_API_KEY" \
  QWEN_MODEL="$QWEN_MODEL" \
  QWEN_CODE_CONFIG_FILE="$QWEN_CODE_CONFIG_FILE" \
  qwen "$@"

# Cleanup
rm -f "$QWEN_CODE_CONFIG_FILE"