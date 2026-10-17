#!/bin/bash
# Qwen Code Local Agent Setup
# Configures Qwen Code to use local Qwen Coder Agent by default

export DEEPSEEK_API_KEY="<REDACTED_SET_VIA_ENV>"

echo "🚀 Setting up Qwen Code with Local Qwen Coder Agent"
echo "=================================================="

# Check if server is running
if ! curl -s http://localhost:8001/v1/models > /dev/null; then
    echo "❌ Qwen Coder Agent server not running!"
    echo "   Start it with: python3 /home/leviathan/OPENCODE_WORKSPACE/llama-coder-server-fixed.py 8001"
    echo "   Open a new terminal and run the above command, then continue."
    read -p "Press Enter once the server is running..."
fi

# Test connection
echo "📡 Testing connection to Qwen Coder Agent..."
if curl -s http://localhost:8001/v1/models | grep -q "qwen-coder-7b-local"; then
    echo "✅ Connection successful"
else
    echo "❌ Connection failed - check server status"
    exit 1
fi

# Create configuration
echo "📝 Creating Qwen Code configuration..."
mkdir -p ~/.config/qwen-code
cp /home/leviathan/OPENCODE_WORKSPACE/qwen-code-config.json ~/.config/qwen-code/config.json

# Create test script
echo "🧪 Creating test script..."
cp /home/leviathan/OPENCODE_WORKSPACE/test-qwen-code.py ~/.config/qwen-code/test-local-agent.py

# Create terminal launcher
echo "🖥️ Creating terminal launcher..."
cat > ~/.local/bin/qwen-code-local << 'EOF'
#!/bin/bash
# Qwen Code with Local Agent

export DEEPSEEK_API_KEY="<REDACTED_SET_VIA_ENV>"

if [ $# -eq 0 ]; then
    echo "🚀 Qwen Code with Local Qwen Coder Agent"
    echo "=========================================="
    echo "API: http://localhost:8001/v1"
    echo "Key: qwen-local-execution"
    echo "Model: qwen-coder-7b-local"
    echo ""
    echo "Usage: qwen-code-local [options]"
    echo "Options:"
    echo "  --test    Test the local agent"
    echo "  --config  Show configuration"
    echo "  --status  Check server status"
    echo ""
    echo "Start server: python3 /home/leviathan/OPENCODE_WORKSPACE/llama-coder-server-fixed.py 8001"
    exit 0
fi

case $1 in
    --test)
        python3 ~/.config/qwen-code/test-local-agent.py
        ;;
    --config)
        cat ~/.config/qwen-code/config.json | jq '.'
        ;;
    --status)
        if curl -s http://localhost:8001/v1/models > /dev/null; then
            echo "✅ Qwen Coder Agent server is running on port 8001"
        else
            echo "❌ Qwen Coder Agent server is not running"
        fi
        ;;
    *)
        echo "Unknown option: $1"
        exit 1
        ;;
esac
EOF

chmod +x ~/.local/bin/qwen-code-local

echo ""
echo "🎯 Qwen Code Setup Complete!"
echo "============================"
echo ""
echo "📍 Configuration: ~/.config/qwen-code/config.json"
echo "🧪 Test Script: ~/.config/qwen-code/test-local-agent.py"
echo "🖥️  Launcher: qwen-code-local"
echo ""
echo "🚀 Quick Start:"
echo "1. Start server: python3 /home/leviathan/OPENCODE_WORKSPACE/llama-coder-server-fixed.py 8001"
echo "2. Test agent: qwen-code-local --test"
echo "3. Check status: qwen-code-local --status"
echo ""
echo "📡 API Configuration (ready for Qwen Code):"
echo "   Base URL: http://localhost:8001/v1"
echo "   API Key: qwen-local-execution"
echo "   Model: qwen-coder-7b-local"
echo ""
echo "🧠 Dual-Brain Architecture Active:"
echo "   DeepSeek R1: Thinking/Reasoning"
echo "   Qwen Coder: Local Execution"
echo ""
echo "💰 100% Token Savings for Execution!"