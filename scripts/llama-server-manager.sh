#!/usr/bin/env bash
# Keep-alive launcher for llama.cpp Qwen3.5-9B server

SERVER_BIN="/home/leviathan/OPENCODE_WORKSPACE/llama.cpp/build/bin/llama-server"
MODEL="/home/leviathan/OPENCODE_WORKSPACE/models/gguf/Qwen3.5-9B-Q4_K_M.gguf"
PORT="8000"
LOG="/tmp/llama-server.log"
PID_FILE="/tmp/llama-server.pid"

start_server() {
    echo "🚀 Starting llama.cpp Qwen3.5-9B server..."
    nohup $SERVER_BIN \
        -m $MODEL \
        --host 0.0.0.0 \
        --port $PORT \
        -ngl 99 \
        -c 4096 \
        --batch-size 512 \
        --threads 8 \
        > $LOG 2>&1 &
    
    echo $! > $PID_FILE
    echo "Server started with PID $(cat $PID_FILE)"
    echo "Waiting for server to be ready..."
    
    for i in {1..60}; do
        if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
            echo "✅ Server is ready on port $PORT"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ Server failed to start. Check $LOG for details."
    return 1
}

stop_server() {
    if [ -f $PID_FILE ]; then
        kill $(cat $PID_FILE) 2>/dev/null
        rm -f $PID_FILE
        echo "Server stopped"
    fi
    pkill -f "llama-server.*Qwen3.5" 2>/dev/null
}

status_server() {
    if pgrep -f "llama-server.*Qwen3.5" > /dev/null 2>&1; then
        echo "✅ Server is running"
        curl -s http://localhost:$PORT/health | python3 -m json.tool 2>/dev/null
        echo ""
        echo "Logs: tail -f $LOG"
    else
        echo "❌ Server is not running"
    fi
}

case "${1:-start}" in
    start)
        if pgrep -f "llama-server.*Qwen3.5" > /dev/null 2>&1; then
            echo "✅ Server already running"
        else
            start_server
        fi
        ;;
    stop)
        stop_server
        ;;
    restart)
        stop_server
        sleep 2
        start_server
        ;;
    status)
        status_server
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        ;;
esac
