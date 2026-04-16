#!/bin/bash
# Qwen with GLM - Current GLM API

echo "🔥 Qwen with GLM (Cloud API)"
echo "============================"
echo "🌐 Using: GLM Flash API"
echo "💰 Cost: Standard API pricing"
echo "📍 Model: GLM default"
echo ""
echo "💡 Usage: Just use 'qwen' command as normal"
echo ""

# Check if qwen command exists and launch it
if command -v qwen &> /dev/null; then
    echo "🚀 Launching Qwen with GLM..."
    exec qwen "$@"
else
    echo "❌ Qwen command not found"
    exit 1
fi