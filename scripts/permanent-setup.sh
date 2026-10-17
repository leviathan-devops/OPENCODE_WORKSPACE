#!/bin/bash
# Permanent Qwen Coder Agents Setup
# One-time setup for boot-time auto-start

export DEEPSEEK_API_KEY="<REDACTED_SET_VIA_ENV>"

echo "🚀 Permanent Qwen Coder Agents Setup"
echo "=================================="

# Check if already set up
if systemctl is-enabled qwen-coders.service >/dev/null 2>&1; then
    echo "✅ System already configured for permanent operation"
    echo ""
    echo "Current status:"
    /home/leviathan/OPENCODE_WORKSPACE/qwen-agents-status.sh status
    exit 0
fi

echo "🔧 Setting up permanent auto-start on boot..."

# Enable systemd service
sudo systemctl daemon-reload
sudo systemctl enable qwen-coders.service

# Start service immediately
sudo systemctl start qwen-coders.service

# Wait for service to start
sleep 5

# Verify all agents are running
echo "🧪 Verifying all agents are running..."
/home/leviathan/OPENCODE_WORKSPACE/qwen-agents-status.sh test

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SETUP COMPLETE!"
    echo "==============="
    echo ""
    echo "✅ Qwen Coder Agents will auto-start on boot"
    echo "✅ All 5 agents running on ports 8001-8005"
    echo "✅ Service: qwen-coders.service"
    echo ""
    echo "🎯 IMMEDIATE USAGE:"
    echo "   Status: /home/leviathan/OPENCODE_WORKSPACE/qwen-agents-status.sh status"
    echo "   Test:   /home/leviathan/OPENCODE_WORKSPACE/qwen-agents-status.sh test"
    echo "   Start:  /home/leviathan/OPENCODE_WORKSPACE/qwen-agents-status.sh start"
    echo "   Stop:   /home/leviathan/OPENCODE_WORKSPACE/qwen-agents-status.sh stop"
    echo "   Logs:   /home/leviathan/OPENCODE_WORKSPACE/qwen-agents-status.sh logs"
    echo ""
    echo "📡 Qwen Code Configuration:"
    echo "   API Base: http://localhost:8001/v1 (or any port 8001-8005)"
    echo "   API Key: qwen-local-execution"
    echo "   Model: qwen-coder-7b-local"
    echo ""
    echo "🧠 Dual-Brain Architecture Ready:"
    echo "   • DeepSeek R1: Thinking/Reasoning (when needed)"
    echo "   • Qwen Coder: Local Execution (100% of the time)"
    echo "   • Boot Auto-Start: Permanent operation"
    echo "   • Multi-Agent: 5 independent instances"
    echo ""
    echo "💰 Token Savings: 100% for execution tokens"
    echo "🔒 Privacy: All execution stays local"
    echo ""
    echo "🚀 SYSTEM IS READY - JUST USE IT!"
    exit 0
else
    echo "❌ Setup failed - check logs with:"
    echo "   sudo journalctl -u qwen-coders.service"
    exit 1
fi