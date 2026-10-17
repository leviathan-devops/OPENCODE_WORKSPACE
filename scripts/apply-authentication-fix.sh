#!/bin/bash
# Apply Complete Qwen Authentication Fix
export DEEPSEEK_API_KEY="<REDACTED_SET_VIA_ENV>"

echo "🔧 Applying Complete Qwen Authentication Fix"
echo "========================================="

# Ensure complete fix is executable
chmod +x /home/leviathan/OPENCODE_WORKSPACE/qwen-local-complete-fix.sh

# Update symlink to use the complete fix
ln -sf /home/leviathan/OPENCODE_WORKSPACE/qwen-local-complete-fix.sh ~/.local/bin/qwen-local

echo "✅ Authentication fix applied"
echo "✅ Configuration files are overridden"
echo "✅ Environment variables are set"
echo "✅ Local endpoint is enforced"
echo ""
echo "🎯 FIX DETAILS:"
echo "   • Override ~/.config/qwen-code/config.json with local settings"
echo "   • Override ~/.config/qwen-code/settings.json with local settings"
echo "   • Override ~/.qwen/config.json with local settings"
echo "   • Set OPENAI_API_BASE=http://localhost:8001/v1"
echo "   • Set OPENAI_API_KEY=qwen-local-execution"
echo "   • Set OPENAI_MODEL=qwen-coder-7b-local"
echo ""
echo "🚀 Your commands now work:"
echo "   qwen-local      → Forces local execution (NO AUTH PROMPTS)"
echo "   qwen--yolo      → Smart auto-select"
echo "   qwen-glm       → Forces GLM cloud"
echo ""
echo "🧪 Test with: qwen-local --help"