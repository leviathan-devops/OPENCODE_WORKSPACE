#!/bin/bash
# Kraken V2.0 TUI Test - Carbon Copy Approach
# Tests plugin loading in actual OpenCode TUI

set -e

echo "=== Kraken V2.0 TUI Container Test ==="
echo "Testing: Does Kraken V2.0 load correctly in OpenCode TUI?"
echo ""

TEST_DIR="/tmp/kraken-v2-tui-test-$(date +%s)"
mkdir -p "$TEST_DIR/config"
mkdir -p "$TEST_DIR/artifacts"

# 1. Carbon copy - copy entire local OpenCode config
echo "[1/6] Creating carbon copy of OpenCode config..."
cp -a /home/leviathan/.config/opencode "$TEST_DIR/config" 2>/dev/null || {
  echo "  No existing config, creating fresh..."
  mkdir -p "$TEST_DIR/config"
}

# 2. Update config to ONLY have Kraken V2.0
echo "[2/6] Configuring plugins (Kraken V2.0 only)..."
cat > "$TEST_DIR/config/opencode.json" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///root/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js"
  ],
  "agent": {}
}
EOF

# 3. Install Kraken V2.0 plugin
echo "[3/6] Installing Kraken V2.0 plugin..."
mkdir -p "$TEST_DIR/config/plugins/kraken-agent-v2.0/dist"
cp -r /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Active\ Context/V2.0-Build-Final/dist/* "$TEST_DIR/config/plugins/kraken-agent-v2.0/dist/"

# 4. Verify plugin bundle
echo "[4/6] Verifying plugin bundle..."
PLUGIN_SIZE=$(stat -c%s "$TEST_DIR/config/plugins/kraken-agent-v2.0/dist/index.js" 2>/dev/null || echo "0")
echo "  Plugin size: $PLUGIN_SIZE bytes"
if [ "$PLUGIN_SIZE" -gt 50000 ]; then
  echo "  ✓ Bundle looks valid (>50KB)"
else
  echo "  ✗ Bundle too small, may be invalid"
fi

# 5. Check OpenCode version
echo "[5/6] Checking OpenCode container version..."
CONTAINER_VERSION=$(docker run --rm ghcr.io/anomalyco/opencode:latest opencode --version 2>/dev/null || echo "unknown")
echo "  Container version: $CONTAINER_VERSION"

# 6. Test TUI launch
echo "[6/6] Testing TUI launch..."
echo ""

# Launch TUI with timeout and capture output
# The TUI will initialize and show startup messages
docker run --rm \
  -v "$TEST_DIR/config":/root/.config/opencode \
  -w /root/.config/opencode \
  ghcr.io/anomalyco/opencode:latest \
  timeout 8 opencode 2>&1 | tee "$TEST_DIR/artifacts/tui-output.log" || true

echo ""
echo "=== TUI Output Analysis ==="
if grep -q "kraken" "$TEST_DIR/artifacts/tui-output.log" 2>/dev/null; then
  echo "✓ Found 'kraken' references in TUI output"
elif grep -q "Plugin loaded" "$TEST_DIR/artifacts/tui-output.log" 2>/dev/null; then
  echo "✓ Found plugin loading message"
elif grep -q "error\|Error\|ERROR" "$TEST_DIR/artifacts/tui-output.log" 2>/dev/null; then
  echo "✗ Found errors in TUI output"
  grep -i "error\|Error\|ERROR" "$TEST_DIR/artifacts/tui-output.log" | head -5
else
  echo "? Could not determine if plugin loaded"
fi

# Check for agent toggle
if grep -q "agent\|toggle\|dropdown" "$TEST_DIR/artifacts/tui-output.log" 2>/dev/null; then
  echo "✓ Found agent-related UI elements"
fi

echo ""
echo "=== Test artifacts saved to: $TEST_DIR ==="
echo "To re-run test manually:"
echo "  docker run --rm -it -v $TEST_DIR/config:/root/.config/opencode ghcr.io/anomalyco/opencode:latest"
