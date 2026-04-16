#!/bin/bash
# Guide for using local vLLM with fixed max_tokens

echo "=========================================="
echo "  QWEN LOCAL VLLM - FIXED MAX_TOKENS"
echo "=========================================="
echo ""

echo "PROBLEM: Qwen Code sends max_tokens=8192 to local vLLM"
echo "SOLUTION: Automatically set max_tokens=3072 for local vLLM"
echo ""

source ~/.bash_aliases 2>/dev/null || source ~/.bashrc

echo "1. To use local vLLM CORRECTLY:"
echo "   ----------------------------"
echo "   a) If Qwen Code is running, EXIT it (Ctrl+C)"
echo "   b) Run: qwen-local"
echo "   c) Run: qwen --yolo"
echo ""
echo "   OR use direct command:"
echo "   qwen-run-local --yolo"
echo ""

echo "2. What happens when you run 'qwen-local':"
echo "   ---------------------------------------"
qwen-local
echo ""
echo "   ✅ Sets max_tokens=3072 in settings.json"
echo "   ✅ Updates config.json for local API"
echo "   ✅ Sets environment variables"
echo ""

echo "3. Verify the fix:"
echo "   ---------------"
echo "   Current max_tokens: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['generationConfig']['samplingParams']['max_tokens'])")"
echo "   (Should be 3072 for local vLLM)"
echo ""

echo "4. If you still get max_tokens error:"
echo "   ----------------------------------"
echo "   Qwen Code might be caching settings."
echo "   Solution:"
echo "   1. Completely exit Qwen Code"
echo "   2. Run 'qwen-local' again"
echo "   3. Start fresh with 'qwen --yolo'"
echo ""

echo "5. Other model toggles:"
echo "   --------------------"
echo "   qwen-deepseek      # DeepSeek (max_tokens=8192)"
echo "   qwen-free          # FREE Qwen API (max_tokens=8192)"
echo "   qwen-healer-alpha  # Healer-Alpha (max_tokens=8192)"
echo ""

echo "=========================================="
echo "  READY TO USE LOCAL VLLM! 🚀"
echo "=========================================="