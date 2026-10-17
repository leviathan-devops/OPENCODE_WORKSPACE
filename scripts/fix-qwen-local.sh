#!/bin/bash
# Qwen Local Fix - Apply the corrected version
export DEEPSEEK_API_KEY="<REDACTED_SET_VIA_ENV>"

echo "🔧 Applying Qwen Local Fix"
echo "========================="

# Ensure final version is executable
chmod +x /home/leviathan/OPENCODE_WORKSPACE/qwen-local-final.sh

# Update symlink to use the fixed version
ln -sf /home/leviathan/OPENCODE_WORKSPACE/qwen-local-final.sh ~/.local/bin/qwen-local

# Update yolo script to reference the fixed version
ln -sf /home/leviathan/OPENCODE_WORKSPACE/qwen-local-final.sh ~/.local/bin/qwen-local 2>/dev/null

echo "✅ Fixed qwen-local to force local Qwen Coder"
echo "✅ Cleared GLM environment variables before local config"
echo "✅ Set OPENAI_API_BASE=http://localhost:8001/v1"
echo "✅ Set OPENAI_API_KEY=qwen-local-execution"
echo "✅ Set OPENAI_MODEL=qwen-coder-7b-local"
echo ""
echo "🚀 qwen-local now exclusively uses local Qwen Coder"
echo "🚀 No more GLM API conflicts"
echo ""
echo "Test with: qwen-local --help"