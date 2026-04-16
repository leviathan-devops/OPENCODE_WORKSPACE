#!/bin/bash
# vLLM Proxy Startup Script
# This proxy caps max_tokens to 3072 for Qwen Code compatibility

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROXY_SCRIPT="$SCRIPT_DIR/vllm-proxy.py"
PIDFILE="/tmp/vllm-proxy.pid"
LOGFILE="/tmp/vllm-proxy.log"

# Check if already running
if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "vLLM proxy already running (PID: $PID)"
        exit 0
    else
        rm -f "$PIDFILE"
    fi
fi

# Start proxy
echo "Starting vLLM proxy on port 8081..."
nohup python3 "$PROXY_SCRIPT" > "$LOGFILE" 2>&1 &
PID=$!
echo $PID > "$PIDFILE"

sleep 2

# Verify it's running
if kill -0 "$PID" 2>/dev/null; then
    echo "✓ vLLM proxy started (PID: $PID)"
    echo "✓ Qwen Code should connect to: http://localhost:8081"
    echo "✓ max_tokens will be capped at 3072"
    echo "✓ Logs: $LOGFILE"
else
    echo "✗ Failed to start proxy"
    cat "$LOGFILE"
    exit 1
fi
