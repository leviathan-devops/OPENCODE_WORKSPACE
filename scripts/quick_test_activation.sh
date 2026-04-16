#!/bin/bash

# Quick test of both activation scripts
echo "🚀 QUICK ACTIVATION TEST"
echo "======================="

# Test Shark Agent activation
echo "🦈 Testing Shark Agent activation..."
cat > test_shark_mission.sh << 'EOF'
#!/bin/bash
echo "🎯 Testing Shark Agent with simple mission..."
cd /home/leviathan/OPENCODE_WORKSPACE/shark-agent
python3 skills/shark-agent/run.py "list current directory contents"
EOF
chmod +x test_shark_mission.sh

# Test DeepSeek Brain activation  
echo "🧠 Testing DeepSeek Brain activation..."
cat > test_advisory.sh << 'EOF'
#!/bin/bash
echo "🔍 Testing DeepSeek Brain with advisory request..."
cd /home/leviathan/OPENCODE_WORKSPACE/shark-agent
python3 skills/deepseek-brain/run.py "Analyze this Python code for improvements: print('hello world')"
EOF
chmod +x test_advisory.sh

echo "✅ Activation test scripts created"
echo ""
echo "To test (requires API key for full functionality):"
echo "1. export DEEPSEEK_API_KEY='your-api-key-here'"
echo "2. ./test_shark_mission.sh"
echo "3. ./test_advisory.sh"
echo ""
echo "Architecture verification:"
echo "- 🦈 Shark Agent: Pilot architecture (DeepSeek controls)"
echo "- 🧠 DeepSeek Brain: Advisory architecture (Qwen controls)"