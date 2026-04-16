#!/bin/bash
# Kraken V2.0 Container Test Script
# Follows carbon-copy approach from Shark Agent container testing

set -e

echo "=== Kraken V2.0 Container Test ==="
echo ""

# Test directory
TEST_DIR="/tmp/kraken-v2-test-$(date +%s)"
mkdir -p "$TEST_DIR/config"
mkdir -p "$TEST_DIR/artifacts"

# 1. Copy local OpenCode config (carbon copy)
echo "[1/5] Copying local OpenCode config..."
cp -a /home/leviathan/.config/opencode "$TEST_DIR/config" || true

# 2. Prepare Kraken V2.0 plugin
echo "[2/5] Copying Kraken V2.0 plugin..."
mkdir -p "$TEST_DIR/config/plugins/kraken-agent-v2.0"
cp -r /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Active\ Context/V2.0-Build-Final/dist/* "$TEST_DIR/config/plugins/kraken-agent-v2.0/"

# 3. Update opencode.json to ONLY have Kraken V2.0 (remove others)
echo "[3/5] Updating opencode.json..."
cat > "$TEST_DIR/config/opencode.json" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///root/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js"
  ]
}
EOF

# 4. Check OpenCode version in container
echo "[4/5] Checking OpenCode container version..."
docker run --rm ghcr.io/anomalyco/opencode:latest opencode --version || echo "Could not get version"

# 5. Run container test with TUI
echo "[5/5] Running TUI test..."
echo "---"

# Run TUI test - start opencode without command to launch TUI
# We use a timeout and capture the initial output
docker run --rm -it \
  -v "$TEST_DIR/config":/root/.config/opencode \
  -w /root/.config/opencode \
  -e "TERM=xterm" \
  ghcr.io/anomalyco/opencode:latest \
  timeout 10 opencode 2>&1 | head -50 || true

echo "---"
echo ""
echo "=== Test Complete ==="
echo "To manually test TUI, run:"
echo "docker run --rm -it -v $TEST_DIR/config:/root/.config/opencode -w /root/.config/opencode ghcr.io/anomalyco/opencode:latest"

# Cleanup
rm -rf "$TEST_DIR"
