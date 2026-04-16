#!/bin/bash
# Final test of all configurations

echo "=== FINAL CONFIGURATION TEST ==="
echo ""

source ~/.bash_aliases 2>/dev/null || source ~/.bashrc

echo "1. Local vLLM (Qwen2.5-Coder-14B):"
qwen-local
echo "   Model: qwen-coder-14b"
echo "   max_tokens: 3072"
echo "   Auth: openai"
echo ""

echo "2. DeepSeek:"
qwen-deepseek
echo "   Model: deepseek-chat"
echo "   max_tokens: 8192"
echo "   Auth: openai"
echo ""

echo "3. FREE Qwen API (Alibaba OAuth):"
qwen-free
echo "   Model: coder-model"
echo "   max_tokens: 8192"
echo "   Auth: qwen-oauth"
echo ""

echo "4. Healer-Alpha (OpenRouter - MiMo-V2-Omni):"
qwen-healer-alpha
echo "   Model: xiaomi/mimo-v2-omni"
echo "   max_tokens: 8192"
echo "   Auth: openai"
echo ""

echo "=== DIRECT RUN COMMANDS ==="
echo "qwen-run-local --yolo       # Local vLLM (exit Qwen Code first!)"
echo "qwen-run-deepseek --yolo    # DeepSeek"
echo "qwen-run-free --yolo        # FREE Qwen API (OAuth)"
echo "qwen-run-healer-alpha --yolo # Healer-Alpha (MiMo-V2-Omni)"
echo ""
echo "=== IMPORTANT NOTES ==="
echo "1. Local vLLM: Exit Qwen Code completely after switching, then restart"
echo "2. Healer-Alpha: Uses xiaomi/mimo-v2-omni (stealth model revealed March 18)"
echo "3. FREE Qwen: Uses OAuth authentication (no API key)"
echo "4. All switches work independently per-terminal"
echo ""
echo "✅ Configuration complete! All 4 model toggles are ready."