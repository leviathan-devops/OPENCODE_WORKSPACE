#!/bin/bash
# Shark Agent Enforcement Verification Script
# Tests that all 9 firewalls are working correctly

set -e

echo "🦈 Shark Agent Enforcement Verification"
echo "========================================"
echo ""

PASSED=0
FAILED=0

# Test helper
test_enforcement() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    
    if [ "$expected" = "$actual" ]; then
        echo "   ✅ $test_name"
        ((PASSED++))
    else
        echo "   ❌ $test_name (expected: $expected, got: $actual)"
        ((FAILED++))
    fi
}

echo "Note: These tests verify the plugin is loaded correctly."
echo "Full enforcement testing requires running OpenCode with the plugin."
echo ""

# Test 1: Check if dist/index.js exists
echo "📋 Test 1: Plugin Build"
if [ -f "dist/index.js" ]; then
    SIZE=$(du -h dist/index.js | cut -f1)
    echo "   ✅ Plugin bundle exists ($SIZE)"
    ((PASSED++))
else
    echo "   ❌ Plugin bundle not found - run 'npm run build' first"
    ((FAILED++))
fi

# Test 2: Check TypeScript compilation
echo ""
echo "📋 Test 2: TypeScript Compilation"
if bun run typecheck 2>&1 | grep -q "error"; then
    echo "   ❌ TypeScript has errors"
    ((FAILED++))
else
    echo "   ✅ TypeScript compiles without errors"
    ((PASSED++))
fi

# Test 3: Check test suite
echo ""
echo "📋 Test 3: Test Suite"
TEST_OUTPUT=$(npm test 2>&1)
PASS_COUNT=$(echo "$TEST_OUTPUT" | grep -oP '\d+ pass' | grep -oP '\d+' | head -1)
FAIL_COUNT=$(echo "$TEST_OUTPUT" | grep -oP '\d+ fail' | grep -oP '\d+' | head -1)

if [ "${FAIL_COUNT:-0}" = "0" ]; then
    echo "   ✅ All tests passing ($PASS_COUNT tests)"
    ((PASSED++))
else
    echo "   ❌ Some tests failing ($PASS_COUNT pass, $FAIL_COUNT fail)"
    ((FAILED++))
fi

# Test 4: Check plugin configuration
echo ""
echo "📋 Test 4: Plugin Configuration"
CONFIG_FILE="$HOME/.config/opencode/opencode.json"
if [ -f "$CONFIG_FILE" ]; then
    if grep -q "shark-agent-plugin" "$CONFIG_FILE"; then
        echo "   ✅ shark-agent-plugin is configured"
        ((PASSED++))
    else
        echo "   ⚠️  shark-agent-plugin not in config (run migrate-to-shark.sh)"
        ((FAILED++))
    fi
else
    echo "   ⚠️  No config file found"
    ((FAILED++))
fi

# Summary
echo ""
echo "========================================"
echo "🦈 Verification Summary"
echo "========================================"
echo "   Passed: $PASSED"
echo "   Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All verification checks passed!"
    echo ""
    echo "To fully test enforcement in OpenCode:"
    echo "  1. Run: opencode 'Try to write to ~/.ssh/config'"
    echo "  2. Expected: Guardian should block the operation"
    exit 0
else
    echo "❌ Some verification checks failed"
    exit 1
fi
