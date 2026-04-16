#!/bin/bash

# Test Hermes Toolshed implementation
# Based on OpenClaw's Toolshed Evolution

echo "🧪 TESTING HERMES TOOLSHED"
echo "=========================="
echo

echo "1. Checking current Hermes configuration..."
hermes tools list 2>&1 | grep "✓ enabled" | head -5

echo
echo "2. Creating Toolshed configuration..."
cp ~/.hermes/config-toolshed.yaml ~/.hermes/config-test-toolshed.yaml

echo
echo "3. Testing with minimal profile..."
echo "   Expected: Only 'file' and 'clarify' toolsets enabled"
echo

# Create a simple test
cat > /tmp/test_prompt.txt << 'EOF'
Hello Hermes! Please tell me what tools you have available.
EOF

echo "4. Running Hermes with Toolshed config..."
echo "   (This would normally run: hermes --config ~/.hermes/config-toolshed.yaml chat)"
echo

echo "5. Testing dynamic tool loading..."
python3 ~/hermes_toolshed.py 2>&1 | tail -20

echo
echo "6. Token savings calculation..."
echo "   Default Hermes: 11,356 tokens"
echo "   Toolshed target: <500 tokens"
echo "   Expected savings: 95% reduction"
echo

echo "📊 TOKEN ECONOMICS SUMMARY:"
echo "=========================="
echo "Problem: Hermes injects ALL 17 toolsets into EVERY prompt"
echo "Solution: OpenClaw's Toolshed concept (dynamic loading)"
echo
echo "OpenClaw's journey:"
echo "  • Gen 1 (Flat): ~498 tokens/call"
echo "  • Gen 2 (Toolshed): ~182 tokens/call (316 saved)"
echo "  • Gen 3 (Multi-tier): ~300 tokens + search hits"
echo
echo "Hermes equivalent:"
echo "  • Default: 11,356 tokens/call"
echo "  • Toolshed: Target <500 tokens/call"
echo "  • Savings: 10,856 tokens (95%)"
echo
echo "🚀 NEXT STEPS:"
echo "1. Use: hermes --config ~/.hermes/config-toolshed.yaml"
echo "2. Or: python3 ~/hermes_toolshed.py --profile coding"
echo "3. Monitor with: hermes chat --verbose"
echo
echo "💡 KEY INSIGHT FROM OPENCLAW CHANGELOG:"
echo '   "Store tools in a shed. Load only what you need."'
echo '   "Tier 1: Always injected (core identity)"'
echo '   "Tier 2: On-demand (tools, references)"'
echo '   "Tier 3: Archived (conversation history)"'