#!/bin/bash
# VERIFY_SHIP.sh — Verify Hermes v3.5 ship package integrity
# Run from: hermes-agent-v3.5/

set -e

echo "=== HERMES v3.5 SHIP PACKAGE VERIFICATION ==="
echo "Checkpoint: CP-SHIP-2026-04-15"
echo ""

PASS=0
FAIL=0

check() {
    if [ $1 -eq 0 ]; then
        echo "  ✓ $2"
        PASS=$((PASS + 1))
    else
        echo "  ✗ $2"
        FAIL=$((FAIL + 1))
    fi
}

# Check directory structure
echo "=== Directory Structure ==="
[ -d "src" ] && [ -d "src/hooks" ] && [ -d "src/services" ] && [ -d "src/tools" ] && [ -d "src/skills" ]
check $? "src/ structure complete (hooks, services, tools, skills)"

# Check dist
echo ""
echo "=== Build Artifacts ==="
[ -f "dist/index.js" ]
check $? "dist/index.js exists"

if [ -f "dist/index.js" ]; then
    SIZE=$(du -h dist/index.js | cut -f1)
    echo "  Size: $SIZE"
fi

# Check skills
echo ""
echo "=== Skills ==="
SKILL_COUNT=$(ls src/skills/*.md 2>/dev/null | wc -l || echo "0")
echo "  Skill count: $SKILL_COUNT"
[ "$SKILL_COUNT" -ge 11 ]
check $? "At least 11 skills (expected 11)"

# Check integration tests
echo ""
echo "=== Integration Tests ==="
[ -f "integration-tests/full-test-suite.ts" ]
check $? "Integration test suite exists"

# Check docs
echo ""
echo "=== Documentation ==="
[ -f "README.md" ] && [ -f "HANDOVER.md" ] && [ -f "SHIP_GATE.md" ]
check $? "Core docs exist (README, HANDOVER, SHIP_GATE)"

# Check checkpoint manifest
echo ""
echo "=== Checkpoint ==="
[ -f "CHECKPOINTS/CP-SHIP-2026-04-15/MANIFEST.md" ]
check $? "Ship checkpoint manifest exists"

# Try build
echo ""
echo "=== Build Test ==="
bun build src/index.ts --outdir=dist --target=bun > /dev/null 2>&1
check $? "Build succeeds (bun build src/index.ts --outdir=dist --target=bun)"

# Summary
echo ""
echo "=== SUMMARY ==="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "✅ SHIP PACKAGE VERIFIED"
    exit 0
else
    echo "❌ $FAIL CHECKS FAILED"
    exit 1
fi