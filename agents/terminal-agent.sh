#!/bin/bash
# Manual Terminal Agent Launcher
# Launch this separately in each of 5 terminals for multi-agent execution

export DEEPSEEK_API_KEY="sk-e8e93e31b582423e-fdaa4ab8e9347e2"

# Check if model is ready
MODEL_PATH="$HOME/qwen-model"
if [ ! -f "$MODEL_PATH/model-00001-of-00004.safetensors" ]; then
    echo "❌ Model not ready. Download in progress..."
    echo "   Run: cd ~ && hf download Qwen/Qwen2.5-Coder-7B-Instruct --local-dir qwen-model"
    exit 1
fi

# Convert model to GGUF if not done yet
GGUF_PATH="$HOME/qwen-model/qwen2.5-coder-7b.gguf"
if [ ! -f "$GGUF_PATH" ]; then
    echo "🔄 Converting model to GGUF format..."
    /tmp/llama.cpp/build/bin/llama-gguf "$MODEL_PATH" --output "$GGUF_PATH"
    if [ $? -ne 0 ]; then
        echo "❌ GGUF conversion failed"
        exit 1
    fi
fi

# Kill any existing process on this port
pkill -f "llama-server.*$1"

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

# Start LLaMA.cpp server with Qwen model
/tmp/llama.cpp/build/bin/llama-server \
    --model "$GGUF_PATH" \
    -c 2048 \
    --ctx-size 4096 \
    --n-gpu-layers 35 \
    --port "$1" \
    --host 0.0.0.0 \
    -ngl 99