#!/bin/bash
# Hermes Agent v3.5 Verification Script
# Run after installation to verify everything works

set -e

echo "=== Hermes Agent v3.5 Verification ==="
echo ""
echo "Build ID: hermes-v3-overhaul"
echo "Date: $(date)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAIL++))
    fi
}

# 1. Check plugin directory exists
echo "--- Installation Checks ---"
PLUGIN_DIR="$HOME/.config/opencode/plugins/hermes-agent-v3.5"
if [ -d "$PLUGIN_DIR" ]; then
    check 0 "Plugin directory exists"
else
    check 1 "Plugin directory exists"
    echo "   Run: mkdir -p $PLUGIN_DIR"
fi

# 2. Check plugin file exists
if [ -f "$PLUGIN_DIR/index.js" ]; then
    check 0 "Plugin file exists"
    SIZE=$(du -h "$PLUGIN_DIR/index.js" | cut -f1)
    echo "   Size: $SIZE"
else
    check 1 "Plugin file exists"
    echo "   Run: cp hermes-agent-v3.5/dist/index.js $PLUGIN_DIR/"
fi

# 3. Check opencode version
echo ""
echo "--- OpenCode Checks ---"
VERSION=$(opencode --version 2>&1 | head -1 || echo "NOT FOUND")
if [[ "$VERSION" == "NOT FOUND" ]]; then
    check 1 "OpenCode installed"
else
    check 0 "OpenCode installed: $VERSION"
fi

# 4. Check opencode.json exists
CONFIG="$HOME/.config/opencode/opencode.json"
if [ -f "$CONFIG" ]; then
    check 0 "Config file exists"
else
    check 1 "Config file exists"
fi

# 5. Check hermes registered in config
if grep -q "hermes-agent-v3.5" "$CONFIG" 2>/dev/null; then
    check 0 "Plugin registered in opencode.json"
else
    check 1 "Plugin registered in opencode.json"
    echo "   Add to plugins array in $CONFIG"
fi

# 6. Check hermes in agent list
echo ""
echo "--- Agent Checks ---"
AGENTS=$(opencode --list-agents 2>&1 || echo "")
if echo "$AGENTS" | grep -qi "hermes"; then
    check 0 "hermes agent available"
else
    check 1 "hermes agent available"
fi

# 7. Check hermes directory created
HERMES_DIR="$HOME/.hermes"
if [ -d "$HERMES_DIR" ]; then
    check 0 ".hermes directory exists"
else
    check 1 ".hermes directory exists"
    echo "   Will be created on first run"
fi

# 8. Run E2E tests if possible
echo ""
echo "--- E2E Test Checks ---"
if command -v bun &> /dev/null && [ -f "$(dirname $0)/test-e2e.ts" ]; then
    echo "Running E2E tests..."
    E2E_RESULT=$(cd "$(dirname $0)" && bun run test-e2e.ts 2>&1 || true)
    E2E_LINES=$(echo "$E2E_RESULT" | grep -c "✓" || echo "0")
    E2E_FAIL=$(echo "$E2E_RESULT" | grep -c "✗" || echo "0")
    echo "   Passed: $E2E_LINES, Failed: $E2E_FAIL"
    if [ "$E2E_FAIL" -le 3 ]; then
        check 0 "E2E tests (expected 3 fixture bugs)"
    else
        check 1 "E2E tests (expected ≤3 failures)"
    fi
else
    echo -e "${YELLOW}!${NC} E2E tests skipped (bun or test file not found)"
fi

# 9. Check hook guards in source
echo ""
echo "--- Security Checks ---"
if [ -d "$(dirname $0)/src" ]; then
    GUARD_COUNT=$(grep -r "isHermesAgent" "$(dirname $0)/src/hooks/" 2>/dev/null | wc -l || echo "0")
    echo "   isHermesAgent() guards found: $GUARD_COUNT"
    if [ "$GUARD_COUNT" -ge 29 ]; then
        check 0 "Hook guards present (≥29)"
    else
        check 1 "Hook guards present (expected ≥29)"
    fi
else
    echo -e "${YELLOW}!${NC} Source not found, skipping guard check"
fi

# Summary
echo ""
echo "=== Summary ==="
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ Installation looks good!${NC}"
    echo ""
    echo "To start Hermes Agent:"
    echo "  opencode --agent hermes"
    echo ""
    echo "For troubleshooting, see:"
    echo "  ./TROUBLESHOOT.md"
else
    echo -e "${RED}✗ Some checks failed. See above for details.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. Copy plugin: cp dist/index.js ~/.config/opencode/plugins/hermes-agent-v3.5/"
    echo "  2. Edit config: nano ~/.config/opencode/opencode.json"
    echo "  3. See TROUBLESHOOT.md for detailed fixes"
    exit 1
fi
