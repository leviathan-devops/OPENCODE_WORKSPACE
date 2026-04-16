#!/bin/bash
# Qwen with Local Qwen Coder - PROPER FIX
# Forces local execution with proper environment variable passing

echo "🤖 Qwen with Local Qwen Coder (PROPER FIX)"
echo "======================================"
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

echo "🔧 Applying proper environment configuration:"

# Set environment variables that will persist to the qwen process
export OPENAI_API_BASE="http://localhost:8001/v1"
export OPENAI_API_KEY="qwen-local-execution"
export OPENAI_MODEL="qwen-coder-7b-local"
export QWEN_API_BASE="http://localhost:8001/v1"
export QWEN_API_KEY="qwen-local-execution"

# Clear conflicting environment variables
unset GLM_API_KEY GLM_API_BASE QWEN_API_KEY_OLD QWEN_API_BASE_OLD

echo "   ✅ OPENAI_API_BASE: $OPENAI_API_BASE"
echo "   ✅ OPENAI_API_KEY: $OPENAI_API_KEY"
echo "   ✅ OPENAI_MODEL: $OPENAI_MODEL"
echo "   ✅ QWEN_API_BASE: $QWEN_API_BASE"
echo "   ✅ QWEN_API_KEY: $QWEN_API_KEY"

# Pass all arguments to qwen command with proper environment
echo ""
echo "🚀 Launching Qwen with LOCAL Qwen Coder..."
echo "📡 Using endpoint: $OPENAI_API_BASE"
echo "🔑 API Key: $OPENAI_API_KEY"
echo ""

# Execute qwen with all environment variables properly set
env OPENAI_API_BASE="$OPENAI_API_BASE" \
    OPENAI_API_KEY="$OPENAI_API_KEY" \
    OPENAI_MODEL="$OPENAI_MODEL" \
    QWEN_API_BASE="$QWEN_API_BASE" \
    QWEN_API_KEY="$QWEN_API_KEY" \
    qwen "$@"