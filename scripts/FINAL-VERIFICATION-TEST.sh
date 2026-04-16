#!/bin/bash
# FINAL COMPLETE VERIFICATION TEST FOR 7B QWEN MODEL

echo "🚀 STARTING COMPLETE 7B MODEL VERIFICATION TEST"
echo "================================================"

# Cleanup
echo "🧹 Cleaning up existing processes..."
pkill -f llama-server 2>/dev/null || true
sleep 5

# Check environment
echo "📊 CHECKING ENVIRONMENT"
echo "VRAM Before:"
nvidia-smi --query-gpu=memory.used,memory.total --format=csv

# Verify model exists
echo ""
echo "📦 VERIFYING 7B MODEL"
if [ -f "/home/leviathan/OPENCODE_WORKSPACE/models/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf" ]; then
    echo "✅ 7B Model found"
    ls -lh /home/leviathan/OPENCODE_WORKSPACE/models/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf
else
    echo "❌ 7B Model not found"
    exit 1
fi

# Verify server binary
echo ""
echo "🔧 VERIFYING LLAMA.CPP SERVER"
LLAMA_BIN=$(find ~/llama.cpp/build -name "llama-server" -type f 2>/dev/null | head -1)
if [ -z "$LLAMA_BIN" ]; then
    echo "❌ llama-server binary not found"
    exit 1
fi
echo "✅ Server binary found: $LLAMA_BIN"

# Start server with explicit logging
echo ""
echo "🌐 STARTING SERVER"
echo "Starting at: $(date)"
timeout 300 $LLAMA_BIN \
    --model /home/leviathan/OPENCODE_WORKSPACE/models/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf \
    --ctx-size 4096 \
    --n-gpu-layers -1 \
    --host 0.0.0.0 \
    --port 8000 \
    --threads 8 \
    --batch-size 512 \
    --ubatch-size 128 \
    2>&1 | tee ~/final-verification-test.log &

SERVER_PID=$!
echo "Server PID: $SERVER_PID"
echo "Waiting for server to start..."

# Monitor server startup
echo ""
echo "⏱️ MONITORING SERVER STARTUP"
for i in {1..10}; do
    echo "Attempt $i/10 - Checking server status..."
    if curl -s --max-time 5 http://localhost:8000/v1/models > /dev/null 2>&1; then
        echo "✅ Server is responding!"
        break
    fi
    sleep 15
done

# Check final status
echo ""
echo "📋 FINAL VERIFICATION"

# Check if process is still running
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "✅ Server process is running (PID: $SERVER_PID)"
else
    echo "❌ Server process has terminated"
    echo "Server exit code: $?"
fi

# Test API endpoints
echo ""
echo "🧪 TESTING API ENDPOINTS"

# Test models endpoint
echo "Testing /v1/models endpoint..."
if curl -s --max-time 10 http://localhost:8000/v1/models > /dev/null 2>&1; then
    echo "✅ /v1/models endpoint is responding"
    echo "Models Response:"
    curl -s http://localhost:8000/v1/models | jq . 2>/dev/null || echo "Raw response: $(curl -s http://localhost:8000/v1/models 2>/dev/null)"
else
    echo "❌ /v1/models endpoint not responding"
fi

# Test chat completion
echo ""
echo "Testing /v1/chat/completions endpoint..."
CHAT_RESPONSE=$(timeout 30 curl -s -X POST "http://localhost:8000/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "Qwen2.5-Coder-7B-Instruct",
        "messages": [
            {"role": "system", "content": "You are a helpful coding assistant."},
            {"role": "user", "content": "Write a Python function to add two numbers"}
        ],
        "temperature": 0.7,
        "max_tokens": 100
    }' 2>/dev/null)

if echo "$CHAT_RESPONSE" | jq . > /dev/null 2>&1; then
    echo "✅ Chat completion working"
    echo "Response preview:"
    echo "$CHAT_RESPONSE" | jq -r '.choices[0].message.content' | head -3
else
    echo "❌ Chat completion failed"
    echo "Response: $CHAT_RESPONSE"
fi

# Test with different prompt
echo ""
echo "Testing with coding prompt..."
CODE_RESPONSE=$(timeout 30 curl -s -X POST "http://localhost:8000/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "Qwen2.5-Coder-7B-Instruct", 
        "messages": [
            {"role": "user", "content": "Explain what a Python decorator is"}
        ],
        "temperature": 0.3,
        "max_tokens": 150
    }' 2>/dev/null)

if echo "$CODE_RESPONSE" | jq . > /dev/null 2>&1; then
    echo "✅ Coding explanation working"
    echo "Response preview:"
    echo "$CODE_RESPONSE" | jq -r '.choices[0].message.content' | head -2
else
    echo "❌ Coding explanation failed"
fi

# Final VRAM check
echo ""
echo "📊 FINAL VRAM STATUS"
nvidia-smi --query-gpu=memory.used,memory.total --format=csv

# Save complete log
echo ""
echo "💾 SAVING COMPLETE VERIFICATION LOG"
cp ~/final-verification-test.log ~/FINAL-COMPLETE-7B-VERIFICATION-LOG.txt
echo "✅ Complete verification saved to: ~/FINAL-COMPLETE-7B-VERIFICATION-LOG.txt"

# Summary
echo ""
echo "🎯 VERIFICATION SUMMARY"
echo "========================"
echo "Test Start Time: $(date)"
echo "Server PID: $SERVER_PID"
echo "7B Model: /home/leviathan/OPENCODE_WORKSPACE/models/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf"
echo "Server Address: http://localhost:8000"
echo "Verification Complete: $(date)"

# Cleanup
echo ""
echo "🧹 CLEANING UP..."
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
echo "✅ Test completed"