#!/bin/bash
# Qwen with Local Qwen Coder - AGGRESSIVE CONFIG OVERRIDE
# Complete config file replacement to force local endpoint

echo "🤖 Qwen with Local Qwen Coder (AGGRESSIVE OVERRIDE)"
echo "================================================="
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

echo "🔧 AGGRESSIVE CONFIG OVERRIDE:"

# Create comprehensive config directory override
CONFIG_DIR="/tmp/qwen-local-config"
mkdir -p "$CONFIG_DIR"

# Override Qwen Code configuration
cat > "$CONFIG_DIR/config.json" << 'EOF'
{
  "auth": {
    "type": "api_key",
    "api_key": "qwen-local-execution"
  },
  "api_base": "http://localhost:8001/v1",
  "model": "qwen-coder-7b-local",
  "use_local": true,
  "ignore_config_files": true
}
EOF

cat > "$CONFIG_DIR/settings.json" << 'EOF'
{
  "auth_type": "api_key",
  "api_base": "http://localhost:8001/v1",
  "model": "qwen-coder-7b-local",
  "api_key": "qwen-local-execution",
  "use_local_endpoint": true
}
EOF

# Override Qwen CLI config
cat > "$CONFIG_DIR/qwen-config.json" << 'EOF'
{
  "api_base": "http://localhost:8001/v1",
  "api_key": "qwen-local-execution",
  "model": "qwen-coder-7b-local",
  "force_local": true
}
EOF

echo "   ✅ Config directory override: $CONFIG_DIR"
echo "   ✅ Qwen Code config: Created"
echo "   ✅ Qwen Code settings: Created"
echo "   ✅ Qwen CLI config: Created"

# Use config directory override
export QWEN_CONFIG_DIR="$CONFIG_DIR"
export QWEN_CODE_CONFIG_DIR="$CONFIG_DIR"

# Execute with maximum configuration override
echo ""
echo "🚀 Launching Qwen with AGGRESSIVE configuration override..."
echo "📡 Using endpoint: http://localhost:8001/v1"
echo "🔑 API Key: qwen-local-execution"
echo ""

# Execute qwen with all config overrides
env \
  QWEN_CONFIG_DIR="$CONFIG_DIR" \
  QWEN_CODE_CONFIG_DIR="$CONFIG_DIR" \
  QWEN_API_BASE="http://localhost:8001/v1" \
  QWEN_API_KEY="qwen-local-execution" \
  qwen "$@"

# Cleanup
rm -rf "$CONFIG_DIR"