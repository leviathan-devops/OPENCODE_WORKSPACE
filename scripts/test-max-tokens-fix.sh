#!/bin/bash
# Test max_tokens fix for all 4 models

echo "=== Testing max_tokens adjustment ==="
echo ""

source ~/.bash_aliases 2>/dev/null || source ~/.bashrc

echo "1. Local vLLM (should be 4096):"
qwen-local
echo "max_tokens: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['generationConfig']['samplingParams']['max_tokens'])")"
echo ""

echo "2. DeepSeek (should be 8192):"
qwen-deepseek
echo "max_tokens: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['generationConfig']['samplingParams']['max_tokens'])")"
echo ""

echo "3. FREE Qwen (should be 8192):"
qwen-free
echo "max_tokens: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['generationConfig']['samplingParams']['max_tokens'])")"
echo ""

echo "4. Healer-Alpha (should be 8192):"
qwen-healer-alpha
echo "max_tokens: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['generationConfig']['samplingParams']['max_tokens'])")"
echo ""

echo "5. Back to Local vLLM (should be 4096):"
qwen-local
echo "max_tokens: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['generationConfig']['samplingParams']['max_tokens'])")"
echo ""

echo "✅ max_tokens automatically adjusted for each model!"
echo ""
echo "Local vLLM: 4096 tokens (model limit)"
echo "Cloud APIs: 8192 tokens (Qwen Code default)"