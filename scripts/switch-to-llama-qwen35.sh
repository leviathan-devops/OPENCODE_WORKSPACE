#!/usr/bin/env bash
# Switch Qwen Code to use llama.cpp Qwen3.5-9B backend

set -e

PROXY_PORT=8001
BACKEND_PORT=8000

echo "=== Qwen Code Backend Switcher ==="
echo ""

# Stop existing proxy if running
if pgrep -f "vllm-proxy.py" > /dev/null 2>&1; then
    echo "Stopping existing proxy..."
    pkill -f "vllm-proxy.py" || true
    sleep 2
fi

# Check if llama.cpp server is running
if ! pgrep -f "llama-server.*Qwen3.5" > /dev/null 2>&1; then
    echo "Starting llama.cpp Qwen3.5-9B server on port $BACKEND_PORT..."
    nohup /home/leviathan/OPENCODE_WORKSPACE/start-llama-qwen35.sh > /tmp/llama-server.log 2>&1 &
    echo "Waiting for server to start..."
    sleep 10
    
    # Wait for server to be ready
    for i in {1..30}; do
        if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
            echo "llama.cpp server is ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "Warning: Server may not be fully ready yet"
        fi
        sleep 2
    done
else
    echo "llama.cpp server already running"
fi

# Start proxy
echo "Starting proxy on port $PROXY_PORT..."
nohup /home/leviathan/OPENCODE_WORKSPACE/vllm-venv/bin/python3 /home/leviathan/OPENCODE_WORKSPACE/vllm-proxy.py > /tmp/vllm-proxy.log 2>&1 &
sleep 2

# Verify proxy is running
if pgrep -f "vllm-proxy.py" > /dev/null 2>&1; then
    echo ""
    echo "✅ Qwen Code is now configured to use llama.cpp Qwen3.5-9B backend"
    echo ""
    echo "Backend: llama.cpp server on http://localhost:$BACKEND_PORT"
    echo "Proxy:   http://localhost:$PROXY_PORT (for Qwen Code)"
    echo ""
    echo "To use: Run 'qwen --yolo' or your usual Qwen Code command"
    echo "To check status: curl http://localhost:$BACKEND_PORT/health"
    echo "To view logs: tail -f /tmp/llama-server.log"
else
    echo "❌ Failed to start proxy"
    exit 1
fi
