#!/usr/bin/env bash
# Start llama.cpp Qwen3.5-9B server and switch Qwen Code to use it

set -e

echo "=== llama.cpp Qwen3.5-9B Server Launcher ==="
echo ""

# Check if model exists
MODEL_PATH="/home/leviathan/OPENCODE_WORKSPACE/models/gguf/Qwen3.5-9B-Q4_K_M.gguf"
if [ ! -f "$MODEL_PATH" ]; then
    echo "❌ ERROR: Model file not found: $MODEL_PATH"
    echo "   Please download the model first."
    exit 1
fi

# Check if already running
if pgrep -f "llama-server.*Qwen3.5" > /dev/null 2>&1; then
    echo "✅ llama.cpp server already running"
else
    echo "🚀 Starting llama.cpp server..."
    echo "   Model: Qwen3.5-9B-Q4_K_M.gguf (5.3GB)"
    echo "   GPU: RTX 4080 Laptop (full offload)"
    echo "   Context: 4096 tokens"
    echo ""
    
    # Start server in background
    nohup /home/leviathan/OPENCODE_WORKSPACE/llama.cpp/build/bin/llama-server \
        -m "$MODEL_PATH" \
        --host 0.0.0.0 \
        --port 8000 \
        -ngl 99 \
        -c 4096 \
        --batch-size 512 \
        --threads 8 \
        > /tmp/llama-server.log 2>&1 &
    
    echo "   Waiting for server to start..."
    sleep 30
    
    # Check if server is ready
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Server is ready!"
    else
        echo "⚠️  Server may still be loading, please wait a moment..."
        sleep 10
    fi
fi

# Switch Qwen Code to use llama.cpp
echo ""
source /home/leviathan/OPENCODE_WORKSPACE/.qwen-switch-real.sh llama

echo ""
echo "=== Ready for Qwen Code ==="
echo "Run: qwen --yolo"
echo ""
echo "Server logs: tail -f /tmp/llama-server.log"
echo "Health check: curl http://localhost:8000/health"
