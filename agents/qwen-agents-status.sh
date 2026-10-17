#!/bin/bash
# Qwen Coder Agents Status Manager

export DEEPSEEK_API_KEY="<REDACTED_SET_VIA_ENV>"

case "${1:-status}" in
    start)
        echo "🚀 Starting Qwen Coder Agents..."
        sudo systemctl start qwen-coders.service
        sleep 5
        ;;
    stop)
        echo "🛑 Stopping Qwen Coder Agents..."
        sudo systemctl stop qwen-coders.service
        pkill -f "llama-coder-server-fixed"
        ;;
    restart)
        echo "🔄 Restarting Qwen Coder Agents..."
        sudo systemctl restart qwen-coders.service
        sleep 5
        ;;
    status)
        echo "🎯 Qwen Coder Agents Status"
        echo "=========================="
        sudo systemctl is-active qwen-coders.service
        
        echo ""
        echo "📡 Agent Status:"
        for port in 8001 8002 8003 8004 8005; do
            if curl -s "http://localhost:$port/v1/models" > /dev/null; then
                echo "   ✅ Port $port: Active"
            else
                echo "   ❌ Port $port: Inactive"
            fi
        done
        
        echo ""
        echo "🔗 API Endpoints:"
        echo "   http://localhost:8001/v1"
        echo "   http://localhost:8002/v1"
        echo "   http://localhost:8003/v1"
        echo "   http://localhost:8004/v1"
        echo "   http://localhost:8005/v1"
        echo ""
        echo "🔑 API Key: qwen-local-execution"
        echo "🧠 Architecture: Dual-Brain (DeepSeek R1 + Qwen Coder)"
        ;;
    logs)
        echo "📋 Agent Logs:"
        for port in 8001 8002 8003 8004 8005; do
            echo "   Port $port:"
            tail -n 5 "/home/leviathan/OPENCODE_WORKSPACE/agent-$port.log" 2>/dev/null || echo "   No log file"
            echo ""
        done
        ;;
    test)
        echo "🧪 Testing all agents..."
        for port in 8001 8002 8003 8004 8005; do
            echo "   Testing port $port..."
            curl -s "http://localhost:$port/v1/models" > /dev/null && echo "      ✅ Working" || echo "      ❌ Failed"
        done
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|test}"
        exit 1
        ;;
esac