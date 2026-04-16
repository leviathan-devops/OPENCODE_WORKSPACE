#!/bin/bash
# KRAKEN V2.0 - Self-Test Suite
# Version: 2.0.0
# Purpose: Verify Kraken V2.0 is functioning correctly

pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

skip() {
    echo -e "${YELLOW}⚠️ SKIP${NC}: $1"
    TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
}

# ====================
# TEST SUITE A: PLUGIN LOADING
# ====================
echo ""
echo "━━━ TEST SUITE A: PLUGIN LOADING ━━━"

echo ""
echo "A1: Plugin file exists..."
if [ -f "$HOME/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js" ]; then
    pass "Plugin file exists"
else
    fail "Plugin file not found"
fi

echo ""
echo "A2: Plugin size ~52KB..."
size=$(wc -c < "$HOME/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js" 2>/dev/null || echo "0")
if [ "$size" -gt 50000 ] && [ "$size" -lt 55000 ]; then
    pass "Plugin size: $size bytes (expected ~52KB)"
else
    fail "Plugin size: $size bytes (expected ~52KB)"
fi

echo ""
echo "A3: Plugin loads without error..."
if opencode debug config --print-logs 2>&1 | grep -q "\[Kraken V2.0\] Agent registered"; then
    pass "Plugin loads and registers agent"
else
    fail "Plugin failed to load or register"
fi

echo ""
echo "A4: Config not corrupted..."
config_before=$(cat "$HOME/.config/opencode/opencode.json" 2>/dev/null | md5sum | cut -d' ' -f1)
opencode --version >/dev/null 2>&1 || true
config_after=$(cat "$HOME/.config/opencode/opencode.json" 2>/dev/null | md5sum | cut -d' ' -f1)
if [ "$config_before" = "$config_after" ]; then
    pass "Config unchanged after loading"
else
    fail "Config was modified during load"
fi

# ====================
# TEST SUITE B: AGENT REGISTRATION
# ====================
echo ""
echo "━━━ TEST SUITE B: AGENT REGISTRATION ━━━"

echo ""
echo "B1: Kraken in agent list..."
if opencode debug agent kraken 2>&1 | grep -q '"name": "kraken"'; then
    pass "Kraken appears in agent list"
else
    fail "Kraken not found in agent list"
fi

echo ""
echo "B2: Kraken agent config correct..."
if opencode debug agent kraken 2>&1 | grep -q '"mode": "primary"'; then
    pass "Kraken mode is primary"
else
    fail "Kraken mode incorrect"
fi

echo ""
echo "B3: Kraken color correct..."
if opencode debug agent kraken 2>&1 | grep -q '"color": "#8B5CF6"'; then
    pass "Kraken color is #8B5CF6 (purple)"
else
    fail "Kraken color incorrect"
fi

echo ""
echo "B4: Kraken tools registered..."
# Tools are registered in the config, check opencode debug config
if opencode debug config 2>&1 | grep -q '"kraken-status": true'; then
    pass "kraken-status tool registered"
else
    fail "kraken-status tool not found"
fi
if opencode debug config 2>&1 | grep -q '"kraken-gate-status": true'; then
    pass "kraken-gate-status tool registered"
else
    fail "kraken-gate-status tool not found"
fi

# ====================
# TEST SUITE C: HOOKS
# ====================
echo ""
echo "━━━ TEST SUITE C: HOOK FUNCTIONALITY ━━━"

echo ""
echo "C1: Event hooks registered..."
if opencode debug config 2>&1 | grep -q "session.created\|session.compacting"; then
    pass "Session hooks present"
else
    fail "Session hooks not found"
fi

echo ""
echo "C2: Chat message hook registered..."
if opencode debug config 2>&1 | grep -q "chat.message"; then
    pass "chat.message hook present"
else
    fail "chat.message hook not found"
fi

echo ""
echo "C3: Tool execute hooks registered..."
if opencode debug config 2>&1 | grep -q "tool.execute"; then
    pass "tool.execute hooks present"
else
    fail "tool.execute hooks not found"
fi

echo ""
echo "C4: Hooks not using array format..."
hook_arrays=$(grep -c "\[.*create.*Hook.*\]" "$HOME/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js" 2>/dev/null || echo "0")
if [ "$hook_arrays" = "0" ]; then
    pass "No hook arrays found (format correct)"
else
    fail "Found $hook_arrays hook array(s)"
fi

# ====================
# TEST SUITE D: CROSS-AGENT SAFETY
# ====================
echo ""
echo "━━━ TEST SUITE D: CROSS-AGENT SAFETY ━━━"

echo ""
echo "D1: Shark agent still works..."
if opencode debug agent shark 2>&1 | grep -q '"name": "shark"'; then
    pass "Shark agent functional"
else
    fail "Shark agent broken"
fi

echo ""
echo "D2: Manta agent still works..."
if opencode debug agent manta 2>&1 | grep -q '"name": "manta"'; then
    pass "Manta agent functional"
else
    fail "Manta agent broken"
fi

echo ""
echo "D3: Other plugins load..."
if opencode debug config --print-logs 2>&1 | grep -q "coding-subagents.*loading plugin"; then
    pass "coding-subagents plugin loads"
else
    fail "coding-subagents plugin failed"
fi
if opencode debug config --print-logs 2>&1 | grep -q "opencode-plugin-engineering.*loading plugin"; then
    pass "opencode-plugin-engineering plugin loads"
else
    fail "opencode-plugin-engineering plugin failed"
fi

echo ""
echo "D4: No errors in config..."
errors=$(opencode debug config 2>&1 | grep -c "error=" || echo "0")
if [ "$errors" = "0" ]; then
    pass "No errors in config"
else
    fail "Found $errors error(s)"
fi

# ====================
# SUMMARY
# ====================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  TEST SUMMARY                                                ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Tests Passed: $TESTS_PASSED"
echo "║  Tests Failed: $TESTS_FAILED"
echo "║  Total Tests:  $((TESTS_PASSED + TESTS_FAILED))"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED - KRAKEN V2.0 IS OPERATIONAL${NC}"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED - REVIEW OUTPUT ABOVE${NC}"
    exit 1
fi
