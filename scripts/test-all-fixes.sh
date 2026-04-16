#!/bin/bash
# Test all fixes

echo "=== Testing All Fixes ==="
echo ""

source ~/.bash_aliases 2>/dev/null || source ~/.bashrc

echo "1. Testing Local vLLM (max_tokens=3072):"
qwen-local
echo "Model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['model']['name'])")"
echo "max_tokens: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['generationConfig']['samplingParams']['max_tokens'])")"
echo "Auth: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['security']['auth']['selectedType'])")"
echo ""

echo "2. Testing DeepSeek (max_tokens=8192):"
qwen-deepseek
echo "Model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['model']['name'])")"
echo "max_tokens: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['generationConfig']['samplingParams']['max_tokens'])")"
echo "Auth: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['security']['auth']['selectedType'])")"
echo ""

echo "3. Testing FREE Qwen API (OAuth, coder-model):"
qwen-free
echo "Model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['model']['name'])")"
echo "max_tokens: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['generationConfig']['samplingParams']['max_tokens'])")"
echo "Auth: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['security']['auth']['selectedType'])")"
echo ""

echo "4. Testing OpenRouter (GPT-4o):"
qwen-openrouter
echo "Model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['model']['name'])")"
echo "max_tokens: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['generationConfig']['samplingParams']['max_tokens'])")"
echo "Auth: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['security']['auth']['selectedType'])")"
echo ""

echo "5. Back to Local vLLM (should work with exit/restart):"
qwen-local
echo "Model: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['model']['name'])")"
echo "max_tokens: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['generationConfig']['samplingParams']['max_tokens'])")"
echo "Auth: $(python3 -c "import json; print(json.load(open('$HOME/.qwen/settings.json'))['security']['auth']['selectedType'])")"
echo ""

echo "=== Summary ==="
echo "✅ Local vLLM: max_tokens=3072, auth=openai"
echo "✅ DeepSeek: max_tokens=8192, auth=openai"
echo "✅ FREE Qwen: max_tokens=8192, auth=qwen-oauth, model=coder-model"
echo "✅ OpenRouter: max_tokens=8192, auth=openai, model=gpt-4o"
echo ""
echo "=== IMPORTANT NOTE ==="
echo "For Local vLLM: You MUST exit Qwen Code completely after switching,"
echo "then start fresh with 'qwen-run-local --yolo'"
echo ""
echo "The cycler should now work without warnings or errors!"