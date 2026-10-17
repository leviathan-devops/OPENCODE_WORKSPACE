#!/bin/bash
# DeepSeek Multi-Agent Launcher
# Sets up 5 simultaneous Shark Agent instances for dual-brain architecture

export DEEPSEEK_API_KEY="<REDACTED_SET_VIA_ENV>"

echo "🚀 DeepSeek Multi-Agent Launcher"
echo "🧠 Dual-Brain Architecture: DeepSeek R1 + Qwen Coder"
echo "👥 Setting up 5 simultaneous agent instances..."
echo ""

# Function to start an agent instance
start_agent() {
    local agent_id=$1
    local port=$((8000 + agent_id - 1))
    
    echo "🤖 Starting Shark Agent $agent_id on port $port"
    
    # Create agent directory
    mkdir -p ~/agents/agent-$agent_id
    
    # Create agent config
    cat > ~/agents/agent-$agent_id/config.json << EOF
{
  "model": "qwen-coder-7b",
  "api_base": "http://localhost:$port/v1",
  "api_key": "deepseek-local-execution",
  "max_tokens": 2048,
  "temperature": 0.1,
  "top_p": 0.95,
  "tool_choice": "auto",
  "timeout": 60,
  "retry_attempts": 3,
  "architecture": "dual-brain",
  "agent_id": $agent_id,
  "role": "execution_motor"
}
EOF

    # Start agent-specific server if not running
    if ! curl -s http://localhost:$port/v1/models > /dev/null; then
        echo "🔧 Starting Coder Agent $agent_id..."
        python3 -c "
import sys
sys.path.insert(0, '/home/leviathan')
from simple_coder_server import CoderAgentHandler
from http.server import HTTPServer

server = HTTPServer(('0.0.0.0', $port), CoderAgentHandler)
print(f'🚀 Agent $agent_id ready on port $port')
server.serve_forever()
" > ~/agents/agent-$agent_id/server.log 2>&1 &
        
        # Wait for server to start
        sleep 3
        
        if ! curl -s http://localhost:$port/v1/models > /dev/null; then
            echo "❌ Failed to start Agent $agent_id"
            return 1
        fi
    fi
    
    echo "✅ Agent $agent_id ready on port $port"
    return 0
}

# Start all 5 agents
for i in {1..5}; do
    start_agent $i
    if [ $? -eq 0 ]; then
        echo "✨ Agent $i operational"
    else
        echo "💥 Agent $1 failed"
    fi
done

echo ""
echo "🎯 Multi-Agent System Status"
echo "📍 Agent Ports: 8001-8005"
echo "🧠 Architecture: Dual-Brain (DeepSeek R1 + 5x Qwen Coder)"
echo "🤖 Each agent ready for independent execution"
echo ""
echo "📡 Test connectivity:"
echo "curl http://localhost:8001/v1/models"
echo "curl http://localhost:8002/v1/models"
echo "curl http://localhost:8003/v1/models"
echo "curl http://localhost:8004/v1/models"
echo "curl http://localhost:8005/v1/models"
echo ""
echo "🚀 System ready for DeepSeek R1 multi-agent execution!"