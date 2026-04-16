#!/bin/bash

echo "=== Shark Frankenstein + OpenCode-Ultra Integration Test ==="
echo "Test Date: $(date)"
echo

# Test 1: Check plugin loading
echo "1. Testing plugin loading..."
PLUGIN_CHECK=$(timeout 5 opencode debug config 2>&1 | grep -A2 '"plugin"' | tail -1)
if echo "$PLUGIN_CHECK" | grep -q "opencode-ultra"; then
    echo "   ✅ Plugin loaded: opencode-ultra"
else
    echo "   ❌ Plugin not loaded"
    exit 1
fi
echo

# Test 2: Check default agent
echo "2. Testing default agent..."
DEFAULT_AGENT=$(timeout 5 opencode debug config 2>&1 | grep '"default_agent"' | cut -d'"' -f4)
if [ "$DEFAULT_AGENT" = "sisyphus" ]; then
    echo "   ✅ Default agent: sisyphus (Kraken Brain)"
else
    echo "   ❌ Default agent mismatch: $DEFAULT_AGENT"
fi
echo

# Test 3: Test agent registration
echo "3. Testing agent registration..."
AGENT_OUTPUT=$(timeout 5 opencode run --agent sisyphus "Test" 2>&1 | head -30)
if echo "$AGENT_OUTPUT" | grep -q "Agents registered"; then
    echo "   ✅ Agents registered successfully"
    # Extract agent list
    AGENT_LIST=$(echo "$AGENT_OUTPUT" | grep "agents: \[" | sed 's/.*agents: \[//' | sed 's/\].*//')
    AGENT_COUNT=$(echo "$AGENT_LIST" | tr ',' '\n' | wc -l)
    echo "   ✅ Registered agents: $AGENT_COUNT"
else
    echo "   ❌ Agent registration failed"
fi
echo

# Test 4: Test model assignment
echo "4. Testing model assignments..."
if echo "$AGENT_OUTPUT" | grep -q "> sisyphus · glm-5"; then
    echo "   ✅ Sisyphus using GLM-5 (Kraken Brain configured)"
else
    MODEL_USED=$(echo "$AGENT_OUTPUT" | grep "> sisyphus ·" | sed 's/.*> sisyphus · //')
    echo "   ⚠️ Sisyphus using: $MODEL_USED"
fi
echo

# Test 5: Check provider configuration
echo "5. Testing provider configuration..."
PROVIDER_COUNT=$(grep -c '"provider":' ~/.config/opencode/opencode.json)
echo "   ✅ Configured providers: $PROVIDER_COUNT"
echo "   Providers:"
grep '"0-.*":' ~/.config/opencode/opencode.json | sed 's/.*"0-//' | sed 's/".*//' | while read provider; do
    echo "   - 0-$provider"
done
echo

# Test 6: Check opencode-ultra configuration
echo "6. Testing opencode-ultra configuration..."
if [ -f ~/.config/opencode/opencode-ultra.json ]; then
    echo "   ✅ Configuration file exists"
    AGENT_CONFIG_COUNT=$(grep -c '"model":' ~/.config/opencode/opencode-ultra.json)
    echo "   ✅ Configured agents: $AGENT_CONFIG_COUNT"
else
    echo "   ❌ Configuration file missing"
fi
echo

echo "=== Integration Test Summary ==="
echo "OpenCode-Ultra v0.9.9 integrated with Shark Frankenstein architecture"
echo "Agent mappings configured with Shark model assignments"
echo "Dual-brain providers configured (Micro: local vLLM, Macro: GLM/DeepSeek)"
echo
echo "Next steps:"
echo "1. Create Shark CLI wrapper for user-friendly commands"
echo "2. Implement dual-brain task routing"
echo "3. Integrate Shark safety stack"
echo "4. Add custom agent fragments for Shark roles"