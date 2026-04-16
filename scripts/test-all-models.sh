#!/bin/bash
# Test ALL Qwen model toggles

echo "=========================================="
echo "  TESTING ALL 4 QWEN MODEL TOGGLES"
echo "=========================================="
echo ""

# Load functions
source ~/.bash_aliases 2>/dev/null || source ~/.bashrc

echo "1. Testing LOCAL vLLM (qwen-coder-14b)..."
echo "----------------------------------------"
qwen-local
echo "API: $OPENAI_BASE_URL"
echo "Config model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/config.json'))['model'])")"
echo ""

echo "2. Testing DeepSeek (deepseek-chat)..."
echo "--------------------------------------"
qwen-deepseek
echo "API: $OPENAI_BASE_URL"
echo "Config model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/config.json'))['model'])")"
echo ""

echo "3. Testing FREE Qwen (qwen-max)..."
echo "----------------------------------"
qwen-free
echo "API: $OPENAI_BASE_URL"
echo "Config model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/config.json'))['model'])")"
echo ""

echo "4. Testing Healer-Alpha (healer-alpha)..."
echo "-----------------------------------------"
qwen-healer-alpha
echo "API: $OPENAI_BASE_URL"
echo "Config model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/config.json'))['model'])")"
echo ""

echo "5. Final status check..."
echo "------------------------"
qwen-api-status
echo ""

echo "✅ ALL 4 MODEL TOGGLES WORKING!"
echo ""
echo "Available commands:"
echo "  qwen-local         # Local vLLM (qwen-coder-14b)"
echo "  qwen-deepseek      # DeepSeek API (deepseek-chat)"
echo "  qwen-free          # FREE Qwen API (qwen-max, rate limited)"
echo "  qwen-healer-alpha  # Healer-Alpha on OpenRouter"
echo "  qwen-api-status    # Check current settings"
echo ""
echo "Direct run commands:"
echo "  qwen-run-local --yolo"
echo "  qwen-run-deepseek --yolo"
echo "  qwen-run-free --yolo"
echo "  qwen-run-healer-alpha --yolo"
echo ""
echo "=========================================="
echo "  READY FOR VIBE CODING! 🎮"
echo "=========================================="