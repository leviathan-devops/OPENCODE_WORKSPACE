#!/bin/bash
# Final Terminal Agent Launcher - Manual Operation Only
# Launch this in separate terminals for multi-agent execution

export DEEPSEEK_API_KEY="<REDACTED_SET_VIA_ENV>"

# Check if model is ready
MODEL_PATH="$HOME/qwen-model"
if [ ! -f "$MODEL_PATH/model-00001-of-00004.safetensors" ]; then
    echo "❌ Model files not found!"
    echo "   Expected files in $MODEL_PATH/"
    echo "   Run: /home/leviathan/OPENCODE_WORKSPACE/prepare-model.sh"
    exit 1
fi

# Kill any existing process on this port
pkill -f "llama-server.*$1"
pkill -f "python.*$1"

echo "🚀 Starting DeepSeek Coder Agent - Terminal $1"
echo "🧠 Role: Execution Motor Cortex"
echo "📍 Port: $1"
echo "🤖 Model: Qwen2.5-Coder-7B"
echo "⚡ Architecture: Dual-Brain (DeepSeek R1 + Local Execution)"
echo ""
echo "📡 API: http://localhost:$1/v1"
echo "🔗 Models: http://localhost:$1/v1/models"
echo "💬 Chat: http://localhost:$1/v1/chat/completions"
echo ""

# Start LLaMA.cpp server directly with safetensors directory
# Using -ngl 99 to use all available GPU layers
/tmp/llama.cpp/build/bin/llama-server \
    --model "$MODEL_PATH" \
    -c 2048 \
    --ctx-size 4096 \
    -ngl 99 \
    --port "$1" \
    --host 0.0.0.0 \
    --mlock