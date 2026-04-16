#!/bin/bash
# Start all Qwen Coder Agents on boot

export DEEPSEEK_API_KEY="sk-e8e93e31b582423e-fdaa4ab8e9347e2"

echo "🚀 Starting Qwen Coder Agents (Dual-Brain Architecture)"

# Start agents on ports 8001-8005
for port in 8001 8002 8003 8004 8005; do
    echo "🤖 Starting Agent on port $port"
    
    # Check if agent is already running
    if curl -s "http://localhost:$port/v1/models" > /dev/null 2>&1; then
        echo "   ✅ Agent on port $port already running"
    else
        # Start agent in background
        nohup python3 /home/leviathan/OPENCODE_WORKSPACE/llama-coder-server-fixed.py $port > /home/leviathan/OPENCODE_WORKSPACE/agent-$port.log 2>&1 &
        
        # Wait for agent to start
        for i in {1..10}; do
            if curl -s "http://localhost:$port/v1/models" > /dev/null 2>&1; then
                echo "   ✅ Agent on port $port started successfully"
                break
            fi
            echo "   ⏳ Waiting for agent on port $port... ($i/10)"
            sleep 2
        done
        
        # Check if agent started successfully
        if ! curl -s "http://localhost:$port/v1/models" > /dev/null 2>&1; then
            echo "   ❌ Failed to start agent on port $port"
        fi
    fi
done

echo ""
echo "🎯 Dual-Brain Architecture Active"
echo "📡 Agent Ports: 8001-8005"
echo "🔑 API Key: qwen-local-execution"
echo "🧠 DeepSeek R1 + Qwen Coder Integration Ready"
echo ""
echo "💡 Use any port 8001-8005 for Qwen Code"
echo "🔗 Example: http://localhost:8001/v1"