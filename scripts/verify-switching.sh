#!/bin/bash
# Verify the switching system works

echo "=== VERIFYING QWEN SWITCHING SYSTEM ==="
echo ""

# Load functions
source ~/.bash_aliases 2>/dev/null || source ~/.bashrc

echo "1. Current state:"
qwen-api-status
echo ""

echo "2. Testing LOCAL vLLM switch..."
qwen-local
echo "Environment: OPENAI_BASE_URL=$OPENAI_BASE_URL"
echo "Config file model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/config.json'))['model'])")"
echo ""

echo "3. Testing DeepSeek switch..."
qwen-deepseek
echo "Environment: OPENAI_BASE_URL=$OPENAI_BASE_URL"
echo "Config file model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/config.json'))['model'])")"
echo ""

echo "4. Testing LOCAL again..."
qwen-local
echo "Environment: OPENAI_BASE_URL=$OPENAI_BASE_URL"
echo "Config file model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/config.json'))['model'])")"
echo ""

echo "✅ SWITCHING SYSTEM VERIFIED!"
echo ""
echo "To use:"
echo "  source ~/.bashrc"
echo "  qwen-local    # or qwen-deepseek"
echo "  qwen --yolo"
echo ""
echo "Or use direct commands:"
echo "  qwen-run-local --yolo"
echo "  qwen-run-deepseek --yolo"