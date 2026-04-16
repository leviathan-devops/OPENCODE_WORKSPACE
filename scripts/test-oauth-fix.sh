#!/bin/bash
# Test OAuth switching fix

echo "=== Testing OAuth Switching Fix ==="
echo ""

source ~/.bash_aliases 2>/dev/null || source ~/.bashrc

echo "1. Starting from DeepSeek (API mode):"
qwen-deepseek
echo "Auth in settings:"
python3 -c "
import json
settings = json.load(open('$HOME/.qwen/settings.json'))
print('  selectedType:', settings.get('security', {}).get('auth', {}).get('selectedType', 'not found'))
print('  preferredType:', settings.get('security', {}).get('auth', {}).get('preferredType', 'not found'))
"
echo ""

echo "2. Switching to FREE (OAuth mode):"
qwen-free
echo "Auth in settings:"
python3 -c "
import json
settings = json.load(open('$HOME/.qwen/settings.json'))
print('  selectedType:', settings.get('security', {}).get('auth', {}).get('selectedType', 'not found'))
print('  preferredType:', settings.get('security', {}).get('auth', {}).get('preferredType', 'not found'))
"
echo ""

echo "3. Switching BACK to DeepSeek (should work now):"
qwen-deepseek
echo "Auth in settings:"
python3 -c "
import json
settings = json.load(open('$HOME/.qwen/settings.json'))
print('  selectedType:', settings.get('security', {}).get('auth', {}).get('selectedType', 'not found'))
print('  preferredType:', settings.get('security', {}).get('auth', {}).get('preferredType', 'not found'))
"
echo ""

echo "4. Testing Healer-Alpha (API mode):"
qwen-healer-alpha
echo "Auth in settings:"
python3 -c "
import json
settings = json.load(open('$HOME/.qwen/settings.json'))
print('  selectedType:', settings.get('security', {}).get('auth', {}).get('selectedType', 'not found'))
print('  preferredType:', settings.get('security', {}).get('auth', {}).get('preferredType', 'not found'))
"
echo ""

echo "5. Back to Local vLLM (API mode):"
qwen-local
echo "Auth in settings:"
python3 -c "
import json
settings = json.load(open('$HOME/.qwen/settings.json'))
print('  selectedType:', settings.get('security', {}).get('auth', {}).get('selectedType', 'not found'))
print('  preferredType:', settings.get('security', {}).get('auth', {}).get('preferredType', 'not found'))
"
echo ""

echo "=== Test Complete ==="
echo "All switches should now work properly, including switching OUT of OAuth mode."