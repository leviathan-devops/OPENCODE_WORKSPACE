#!/bin/bash
# Shark Agent v4.8.3 Verification Script
# Run after installation to verify everything works

set -e

echo "=== Shark Agent v4.8.3 Verification ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check plugin exists
echo "1. Checking plugin file..."
if [ -f "index.js" ]; then
    echo -e "${GREEN}✓${NC} Plugin file exists"
else
    echo -e "${RED}✗${NC} Plugin file NOT found"
    exit 1
fi

# Check opencode version
echo ""
echo "2. Checking opencode version..."
VERSION=$(opencode --version 2>&1 | head -1 || echo "not found")
echo "   OpenCode version: $VERSION"

# Check config
echo ""
echo "3. Checking opencode.json..."
if [ -f ~/.config/opencode/opencode.json ]; then
    echo -e "${GREEN}✓${NC} Config file exists"
    if grep -q "shark-agent-v4.8.3" ~/.config/opencode/opencode.json; then
        echo -e "${GREEN}✓${NC} Plugin registered in config"
    else
        echo -e "${RED}✗${NC} Plugin NOT registered"
    fi
else
    echo -e "${RED}✗${NC} Config file NOT found"
fi

# Run pattern tests
echo ""
echo "4. Running pattern tests..."
if bun run test-patterns.ts > /dev/null 2>&1; then
    RESULT=$(bun run test-patterns.ts 2>&1 | tail -1)
    echo -e "${GREEN}✓${NC} Pattern tests: $RESULT"
else
    echo -e "${RED}✗${NC} Pattern tests FAILED"
fi

# Quick firewall test
echo ""
echo "5. Quick firewall test..."
RESULT=$(opencode run "npm test" --agent shark --model opencode/big-pickle 2>&1 | grep -i "ANTI-SLOP" | head -1 || echo "")
if [ -n "$RESULT" ]; then
    echo -e "${GREEN}✓${NC} Firewall working: npm test blocked"
else
    echo -e "${RED}✗${NC} Firewall may not be working"
fi

echo ""
echo "=== Verification Complete ==="
echo ""
echo "To start Shark Agent TUI:"
echo "  opencode --agent shark --model opencode/big-pickle"
echo ""
echo "To test in container:"
echo "  docker exec -i YOUR_CONTAINER /path/to/opencode run \"TEST\" --agent shark"
