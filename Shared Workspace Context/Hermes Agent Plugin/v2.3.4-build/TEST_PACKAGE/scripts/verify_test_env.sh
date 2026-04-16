#!/bin/bash
#===============================================================================
# Verify Test Environment
# Checks that all prerequisites for testing are met
#===============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

HERMES_WS="/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.1-build"
PROJECT_DIR="/tmp/hermes-test-project"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        Hermes v2.1 — Test Environment Verification           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

check() {
    local name="$1"
    local cmd="$2"
    echo -n "Checking: $name ... "
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

check_dir() {
    local name="$1"
    local dir="$2"
    echo -n "Checking: $name ($dir) ... "
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ MISSING${NC}"
        return 1
    fi
}

check_file() {
    local name="$1"
    local file="$2"
    echo -n "Checking: $name ... "
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ MISSING${NC}"
        return 1
    fi
}

FAIL_COUNT=0

echo "=== Directory Structure ==="
check_dir "Hermes workspace" "$HERMES_WS" || ((FAIL_COUNT++))
check_dir "Test package" "$HERMES_WS/TEST_PACKAGE" || ((FAIL_COUNT++))
check_dir "Test project" "$PROJECT_DIR" || ((FAIL_COUNT++))
check_dir "Scripts dir" "$HERMES_WS/TEST_PACKAGE/scripts" || ((FAIL_COUNT++))
echo ""

echo "=== Test Package Files ==="
check_file "TEST_PLAN.md" "$HERMES_WS/TEST_PACKAGE/TEST_PLAN.md" || ((FAIL_COUNT++))
check_file "TEST_EXECUTION_SCRIPT.sh" "$HERMES_WS/TEST_PACKAGE/TEST_EXECUTION_SCRIPT.sh" || ((FAIL_COUNT++))
check_file "TEST_CHECKLIST.md" "$HERMES_WS/TEST_PACKAGE/TEST_CHECKLIST.md" || ((FAIL_COUNT++))
check_file "REAL_TIME_LOG.md" "$HERMES_WS/TEST_PACKAGE/REAL_TIME_LOG.md" || ((FAIL_COUNT++))
check_file "TEST_PROJECT_READY.md" "$HERMES_WS/TEST_PACKAGE/TEST_PROJECT_READY.md" || ((FAIL_COUNT++))
echo ""

echo "=== Test Project Files ==="
check_file "README.md" "$PROJECT_DIR/README.md" || ((FAIL_COUNT++))
check_file "TODO.md" "$PROJECT_DIR/TODO.md" || ((FAIL_COUNT++))
check_file "KNOWN_BUGS.md" "$PROJECT_DIR/KNOWN_BUGS.md" || ((FAIL_COUNT++))
check_file "routes.ts" "$PROJECT_DIR/src/api/routes.ts" || ((FAIL_COUNT++))
check_file "processor.py" "$PROJECT_DIR/src/core/processor.py" || ((FAIL_COUNT++))
echo ""

echo "=== System Requirements ==="
check "Node.js" "node --version"
check "Python" "python3 --version"
check "Git" "git --version"
check "Bash" "bash --version"
echo ""

echo "=== Environment Variables ==="
echo "HERMES_WS: $HERMES_WS"
echo "PROJECT_DIR: $PROJECT_DIR"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║            All checks passed! Environment is ready.           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║        $FAIL_COUNT check(s) failed. Please fix before testing.        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
