#!/bin/bash
# Debug local vLLM max_tokens issue

echo "=== Debugging max_tokens issue ==="
echo ""

source ~/.bash_aliases 2>/dev/null || source ~/.bashrc

echo "1. Current settings.json:"
cat ~/.qwen/settings.json
echo ""

echo "2. Switching to local vLLM..."
qwen-local
echo ""

echo "3. Settings after switch:"
cat ~/.qwen/settings.json
echo ""

echo "4. Testing vLLM API with max_tokens=4096..."
curl -s -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "qwen-coder-14b",
       "messages": [{"role": "user", "content": "Say hello"}],
       "max_tokens": 4096
     }' \
     http://localhost:8000/v1/chat/completions > /tmp/test-4096.json 2>&1

if grep -q "choices" /tmp/test-4096.json; then
    echo "✅ vLLM accepts max_tokens=4096"
else
    echo "❌ vLLM rejects max_tokens=4096"
    cat /tmp/test-4096.json
fi
echo ""

echo "5. Testing vLLM API with max_tokens=8192..."
curl -s -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "qwen-coder-14b",
       "messages": [{"role": "user", "content": "Say hello"}],
       "max_tokens": 8192
     }' \
     http://localhost:8000/v1/chat/completions > /tmp/test-8192.json 2>&1

if grep -q "400" /tmp/test-8192.json; then
    echo "✅ vLLM correctly rejects max_tokens=8192 (expected error)"
    echo "   Error: $(cat /tmp/test-8192.json)"
else
    echo "❌ vLLM unexpectedly accepts max_tokens=8192"
fi
echo ""

echo "=== Conclusion ==="
echo "If settings.json shows max_tokens=4096 but Qwen Code still sends 8192,"
echo "then Qwen Code is ignoring settings.json or getting the value elsewhere."