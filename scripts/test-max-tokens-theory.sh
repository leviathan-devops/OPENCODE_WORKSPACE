#!/bin/bash
# Test max_tokens theory

echo "=== Testing max_tokens theory ==="
echo ""

source ~/.bash_aliases 2>/dev/null || source ~/.bashrc

echo "Theory: Qwen Code reads settings.json ONCE at startup and caches it."
echo "If you switch models without restarting Qwen Code, it uses cached max_tokens."
echo ""

echo "1. Current settings (should be from last test):"
cat ~/.qwen/settings.json | grep -A5 '"generationConfig"'
echo ""

echo "2. Switching to local vLLM:"
qwen-local
echo ""

echo "3. Settings after switch:"
cat ~/.qwen/settings.json | grep -A5 '"generationConfig"'
echo ""

echo "4. Testing vLLM directly with max_tokens=3072:"
curl -s -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "qwen-coder-14b",
       "messages": [{"role": "user", "content": "Say hello"}],
       "max_tokens": 3072
     }' \
     http://localhost:8000/v1/chat/completions > /tmp/test-local.json

if grep -q "choices" /tmp/test-local.json; then
    echo "✅ vLLM accepts max_tokens=3072"
else
    echo "❌ vLLM rejects max_tokens=3072"
    cat /tmp/test-local.json
fi
echo ""

echo "=== Conclusion ==="
echo "If settings.json shows max_tokens=3072 and vLLM accepts it,"
echo "but Qwen Code still sends 8192, then Qwen Code is caching the value."
echo ""
echo "Solution: Exit Qwen Code completely after switching to local vLLM,"
echo "then start fresh with 'qwen --yolo' or 'qwen-run-local --yolo'"