#!/bin/bash
# Qwen with Local Qwen Coder - Dual-Brain Architecture

echo "🤖 Qwen with Local Qwen Coder"
echo "============================="
echo "🧠 Architecture: Dual-Brain (DeepSeek R1 + Local Qwen)"
echo "💰 Cost: 100% free execution tokens"
echo "📍 Model: Qwen2.5-Coder-7B (Local GPU)"
echo "🔗 API: http://localhost:8001/v1"
echo ""
echo "💡 Usage: Local execution with DeepSeek R1 compatibility"
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

# Create temporary config for local model
TEMP_CONFIG=$(mktemp)
cat > "$TEMP_CONFIG" << EOF
{
  "model": "qwen-coder-7b-local",
  "api_base": "http://localhost:8001/v1",
  "api_key": "qwen-local-execution",
  "temperature": 0.1,
  "max_tokens": 2048,
  "top_p": 0.95
}
EOF

echo "🚀 Launching Qwen with Local Qwen Coder..."
echo "📡 Using endpoint: http://localhost:8001/v1"
echo ""

# Export local config and launch qwen
export QWEN_CONFIG_FILE="$TEMP_CONFIG"
exec qwen "$@"