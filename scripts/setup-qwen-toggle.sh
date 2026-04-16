#!/bin/bash
# Qwen Model Toggle Setup
# Sets up qwen-glm, qwen-local, and qwen--yolo commands

export DEEPSEEK_API_KEY="sk-e8e93e31e-fdaa4ab8e9347e2"

echo "🎯 Setting up Qwen Model Toggle Commands"
echo "======================================"

# Check if scripts are executable
if [ ! -x "/home/leviathan/OPENCODE_WORKSPACE/qwen-glm.sh" ] || [ ! -x "/home/leviathan/OPENCODE_WORKSPACE/qwen-local.sh" ] || [ ! -x "/home/leviathan/OPENCODE_WORKSPACE/qwen-yolo.sh" ]; then
    echo "❌ Scripts not executable. Fixing permissions..."
    chmod +x /home/leviathan/OPENCODE_WORKSPACE/qwen-*.sh
fi

# Create symlinks if they don't exist
mkdir -p ~/.local/bin

ln -sf /home/leviathan/OPENCODE_WORKSPACE/qwen-glm.sh ~/.local/bin/qwen-glm 2>/dev/null
ln -sf /home/leviathan/OPENCODE_WORKSPACE/qwen-local.sh ~/.local/bin/qwen-local 2>/dev/null
ln -sf /home/leviathan/OPENCODE_WORKSPACE/qwen-yolo.sh ~/.local/bin/qwen-yolo 2>/dev/null
ln -sf /home/leviathan/OPENCODE_WORKSPACE/qwen-yolo.sh ~/.local/bin/qwen--yolo 2>/dev/null

# Add to PATH if not already there
if ! grep -q "export PATH=\"$HOME/.local/bin:\$PATH\"" ~/.bashrc; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi

# Make sure PATH is current
export PATH="$HOME/.local/bin:$PATH"

echo "✅ Qwen toggle commands installed"
echo ""
echo "🎯 AVAILABLE COMMANDS:"
echo "   qwen-glm      → Use GLM cloud API"
echo "   qwen-local   → Use local Qwen Coder (dual-brain)"
echo "   qwen-yolo     → Smart auto-select (YOLO)"
echo "   qwen--yolo    → Same as qwen-yolo (exact match)"
echo ""
echo "📡 TESTING COMMANDS:"
echo "   qwen-glm --help"
echo "   qwen-local --help"
echo "   qwen-yolo --help"
echo ""
echo "🔧 STATUS CHECK:"
echo "   /home/leviathan/OPENCODE_WORKSPACE/qwen-agents-status.sh status"
echo ""

# Test the commands
echo "🧪 Testing commands..."
echo "qwen-glm location:" $(which qwen-glm)
echo "qwen-local location:" $(which qwen-local)
echo "qwen-yolo location:" $(which qwen-yolo)
echo "qwen--yolo location:" $(which qwen--yolo)
echo ""
echo "🚀 SETUP COMPLETE! Use the commands above to toggle models."