#!/bin/bash
# DeepSeek Dual-Brain Architecture - Coder Agent Launcher
# This script launches the Qwen Coder Agent for multi-agent support

export DEEPSEEK_API_KEY="<REDACTED_SET_VIA_ENV>"

# Check if model is ready
MODEL_PATH="$HOME/qwen-model"
if [ ! -f "$MODEL_PATH/model-00001-of-00004.safetensors" ]; then
    echo "❌ Model not ready yet. Downloading..."
    # Continue download if interrupted
    cd ~ && hf download Qwen/Qwen2.5-Coder-7B-Instruct --local-dir qwen-model
fi

# Kill any existing processes
pkill -f "simple-coder-server"
pkill -f "coder-server"
sleep 2

# Start coder agent server
echo "🚀 Starting DeepSeek Coder Agent (Instance $1)"
echo "🧠 Dual-Brain Architecture: DeepSeek R1 + Qwen Coder"
echo "📍 Server: http://localhost:8000"

python3 /home/leviathan/OPENCODE_WORKSPACE/simple-coder-server.py 2>&1 | while read line; do
    echo "[Coder-Agent-$1] $line"
done &

# Wait for server to start
sleep 5

# Test if server is running
if curl -s http://localhost:8000/v1/models > /dev/null; then
    echo "✅ Coder Agent $1 is ready on port 8000"
    echo "🤖 Role: Execution Motor Cortex"
    echo "🔗 API: http://localhost:8000/v1"
else
    echo "❌ Failed to start Coder Agent $1"
    exit 1
fi

# Keep script running
wait