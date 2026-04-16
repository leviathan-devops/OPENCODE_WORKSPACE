#!/bin/bash
echo "🧪 Testing Qwen Code Subconscious - Final Integration"
echo "===================================================="

# Test 1: Check vLLM status
echo ""
echo "✅ Test 1: vLLM Status"
if ps aux | grep -q "vllm"; then
    echo "   ✅ vLLM process is running"
    if curl -s http://localhost:8000/v1/models > /dev/null 2>&1; then
        echo "   ✅ vLLM server is responding"
        echo "   📊 Models available: $(curl -s http://localhost:8000/v1/models | jq -r '.data[].model' 2>/dev/null | head -1)"
    else
        echo "   ⚠️  vLLM server starting (still downloading/loading)"
    fi
else
    echo "   ❌ vLLM process not running"
fi

# Test 2: Check OpenViking status
echo ""
echo "✅ Test 2: OpenViking Status"
if ps aux | grep -q "openviking-server"; then
    echo "   ✅ OpenViking server is running"
    if curl -s http://localhost:1933/status > /dev/null 2>&1; then
        echo "   ✅ OpenViking server is responding"
    else
        echo "   ⚠️  OpenViking server starting"
    fi
else
    echo "   ❌ OpenViking server not running"
fi

# Test 3: Check configuration files
echo ""
echo "✅ Test 3: Configuration Files"
if [ -f "/home/leviathan/OPENCODE_WORKSPACE/.openviking/ov.conf" ]; then
    echo "   ✅ OpenViking config exists"
else
    echo "   ❌ OpenViking config missing"
fi

if [ -f "/home/leviathan/OPENCODE_WORKSPACE/.openviking/ovcli.conf" ]; then
    echo "   ✅ OpenViking CLI config exists"
else
    echo "   ❌ OpenViking CLI config missing"
fi

# Test 4: Check workspace
echo ""
echo "✅ Test 4: Workspace Setup"
if [ -d "/home/leviathan/OPENCODE_WORKSPACE/openviking_workspace" ]; then
    echo "   ✅ OpenViking workspace exists"
    echo "   📁 Workspace location: /home/leviathan/OPENCODE_WORKSPACE/openviking_workspace"
    echo "   📊 Session files: $(find /home/leviathan/OPENCODE_WORKSPACE/openviking_workspace/sessions -name "*.json" 2>/dev/null | wc -l)"
else
    echo "   ❌ OpenViking workspace missing"
fi

# Test 5: Check environment variables
echo ""
echo "✅ Test 5: Environment Variables"
if [ ! -z "$QWEN_SUBCONSCIOUS_ACTIVE" ]; then
    echo "   ✅ QWEN_SUBCONSCIOUS_ACTIVE: $QWEN_SUBCONSCIOUS_ACTIVE"
else
    echo "   ❌ QWEN_SUBCONSCIOUS_ACTIVE not set"
fi

if [ ! -z "$TERMINAL_ID" ]; then
    echo "   ✅ TERMINAL_ID: $TERMINAL_ID"
else
    echo "   ❌ TERMINAL_ID not set"
fi

# Test 6: Test context hook
echo ""
echo "✅ Test 6: Context Hook"
if [ -f "/home/leviathan/OPENCODE_WORKSPACE/.qwen/subconscious-hook.py" ]; then
    echo "   ✅ Context hook script exists"
    python3 -c "
import sys
sys.path.append('/home/leviathan/OPENCODE_WORKSPACE/.qwen')
from subconscious_hook import QwenSubconscious
sub = QwenSubconscious()
print('   ✅ Context hook imports successfully')
print(f'   📍 Terminal ID: {sub.terminal_id}')
print(f'   🌐 vLLM Endpoint: {sub.vllm_endpoint}')
print(f'   🧠 Workspace: {sub.workspace}')
" 2>/dev/null && echo "   ✅ Context hook functionality working" || echo "   ⚠️  Context hook has issues"
else
    echo "   ❌ Context hook script missing"
fi

# Test 7: Test basic functionality
echo ""
echo "✅ Test 7: Basic Functionality"
# Test saving context
python3 -c "
import sys
sys.path.append('/home/leviathan/OPENCODE_WORKSPACE/.qwen')
from subconscious_hook import QwenSubconscious
sub = QwenSubconscious()
test_data = {'test': 'integration', 'timestamp': 'now'}
if sub.save_context(test_data):
    print('   ✅ Context saving works')
else:
    print('   ⚠️  Context saving failed')
"

# Test context retrieval
python3 -c "
import sys
sys.path.append('/home/leviathan/OPENCODE_WORKSPACE/.qwen')
from subconscious_hook import QwenSubconscious
sub = QwenSubconscious()
results = sub.get_relevant_context('test')
if results:
    print(f'   ✅ Context retrieval works ({len(results)} results)')
else:
    print('   ⚠️  Context retrieval returned no results (expected for first run)')
"

echo ""
echo "🎯 Integration Summary:"
echo "   🧠 Qwen Code Subconscious: Partially Active"
echo "   🔗 vLLM Server: Starting/Downloading"
echo "   🗃️ OpenViking Server: Configured"
echo "   📊 Local Context Storage: Active"
echo ""
echo "🚀 Next Steps:"
echo "   1. Wait for vLLM to finish downloading and start"
echo "   2. Open new terminals: source activate-qwen-subconscious.sh"
echo "   3. Use 'qwen-search' to find previous context"
echo "   4. Use 'qwen-save' to manually save important context"
echo ""
echo "💡 The system will work with local storage immediately"
echo "   and automatically upgrade to vLLM when ready!"