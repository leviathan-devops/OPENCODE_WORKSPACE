#!/bin/bash
# Start Qwen 2.5 Coder 7B Server

LLAMA_BIN=$(find ~/llama.cpp/build -name "llama-server" -type f 2>/dev/null | head -1)

if [ -z "$LLAMA_BIN" ]; then
    echo "ERROR: llama-server not found. Did you build llama.cpp?"
    exit 1
fi

# Check for 7B model first
if [ -f "~/models/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf" ]; then
    MODEL_PATH="~/models/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf"
    echo "Using 7B model"
elif [ -f "/home/leviathan/OPENCODE_WORKSPACE/models/gguf/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf" ]; then
    MODEL_PATH="/home/leviathan/OPENCODE_WORKSPACE/models/gguf/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf"
    echo "Using 1.5B model (7B downloading in background)"
else
    echo "ERROR: No model found"
    exit 1
fi

# Kill existing server
pkill -f "llama-server.*8000" 2>/dev/null || true
sleep 2

# Start server
echo "Starting Qwen 2.5 Coder Server on port 8000..."
$LLAMA_BIN \
    --model "$MODEL_PATH" \
    --ctx-size 4096 \
    --n-gpu-layers -1 \
    --host 0.0.0.0 \
    --port 8000 \
    --threads 8 \
    --batch-size 128 \
    --ubatch-size 32 \
    2>&1 | tee ~/qwen-server.log &

echo "Server starting... PID: $!"
echo "Check progress: tail -f ~/qwen-server.log"
echo "Test: curl -s http://localhost:8000/v1/models"