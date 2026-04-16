#!/bin/bash
set -e

echo "========================================"
echo "Deep Planning Mode - Test Script"
echo "========================================"

echo ""
echo "[1/7] Running mechanical tests..."

# Test 1: Pattern Detection
echo "  Test 1: Pattern Detection..."
node -e "
const { scanRequirements } = require('./dist/patterns');
const findings = scanRequirements('This should create a feature: user authentication');
if (findings.length === 0) {
  console.error('FAIL: No patterns detected');
  process.exit(1);
}
console.log('  PASS: Found', findings.length, 'patterns');
"

# Test 2: No Duplicate Findings
echo "  Test 2: No Duplicate Findings..."
node -e "
const { scanRequirements } = require('./dist/patterns');
const content = 'should do this should do that should do something';
const findings = scanRequirements(content);
if (findings.length !== 3) {
  console.error('FAIL: Expected 3 findings, got', findings.length);
  process.exit(1);
}
console.log('  PASS: Found exactly 3 findings (no duplicates)');
"

# Test 3: SafetyCount Prevents Hangs
echo "  Test 3: SafetyCount Prevents Hangs..."
node -e "
const { scanRequirements } = require('./dist/patterns');
const content = 'should '.repeat(200);
const start = Date.now();
const findings = scanRequirements(content, { maxMatches: 100 });
const elapsed = Date.now() - start;
if (elapsed > 5000) {
  console.error('FAIL: Took too long:', elapsed, 'ms');
  process.exit(1);
}
console.log('  PASS: Completed in', elapsed, 'ms');
"

# Test 4: Line Numbers Accurate
echo "  Test 4: Line Numbers Accurate..."
node -e "
const { scanRequirements } = require('./dist/patterns');
const content = 'line one\nshould find this\nline three';
const findings = scanRequirements(content);
const line2 = findings.find(f => f.line === 2);
if (!line2) {
  console.error('FAIL: Line 2 not found');
  process.exit(1);
}
console.log('  PASS: Line numbers accurate');
"

# Test 5: Evidence is Real
echo "  Test 5: Evidence is Real Code..."
node -e "
const { scanRequirements } = require('./dist/patterns');
const findings = scanRequirements('should do something important');
if (!findings[0].evidence || findings[0].evidence.length === 0) {
  console.error('FAIL: No evidence');
  process.exit(1);
}
console.log('  PASS: Evidence is real:', findings[0].evidence);
"

# Test 6: Constraint Validation
echo "  Test 6: Constraint Validation..."
node -e "
const { scanConstraints } = require('./dist/patterns');
const findings = scanConstraints('This must be done within 3 hours');
if (findings.length === 0) {
  console.error('FAIL: No constraints found');
  process.exit(1);
}
console.log('  PASS: Found constraint:', findings[0].match);
"

# Test 7: Dependency Detection
echo "  Test 7: Dependency Detection..."
node -e "
const { scanFileDependencies } = require('./dist/patterns');
const findings = scanFileDependencies('import { foo } from \"./bar\"');
if (findings.length === 0) {
  console.error('FAIL: No dependencies found');
  process.exit(1);
}
console.log('  PASS: Found dependency:', findings[0].match);
"

echo ""
echo "[2/7] Testing index exports..."
node -e "
const plugin = require('./dist/index');
if (!plugin.plugin) {
  console.error('FAIL: No plugin export');
  process.exit(1);
}
console.log('  PASS: Plugin exported correctly');
"

echo ""
echo "[3/7] Testing routeCommand..."
node -e "
const { routeCommand } = require('./dist/index');
routeCommand('plan this', 'build a feature').then(result => {
  if (!result.success) {
    console.error('FAIL:', result.output);
    process.exit(1);
  }
  console.log('  PASS: Command routed successfully');
});
"

echo ""
echo "[4/7] Testing command handlers..."
node -e "
const { routeCommand } = require('./dist/index');

Promise.all([
  routeCommand('deep plan build auth system', 'build auth system with JWT'),
  routeCommand('analyze deps', 'import foo from \"./bar\"'),
  routeCommand('what could go wrong', 'might fail on timeout'),
]).then(results => {
  for (const r of results) {
    if (!r.success) {
      console.error('FAIL:', r.output);
      process.exit(1);
    }
  }
  console.log('  PASS: All commands executed');
});
"

echo ""
echo "[5/7] Testing hooks..."
node -e "
const { getToolBlockingHook } = require('./dist/index');
const hook = getToolBlockingHook();
if (!hook.handler) {
  console.error('FAIL: No hook handler');
  process.exit(1);
}
console.log('  PASS: Hook registered correctly');
"

echo ""
echo "[6/7] Testing state management..."
node -e "
const { getState, resetState } = require('./dist/index');
resetState();
const state = getState();
if (state.mode !== 'idle') {
  console.error('FAIL: State not reset');
  process.exit(1);
}
console.log('  PASS: State management works');
"

echo ""
echo "[7/7] Running TypeScript type check..."
npm run typecheck

echo ""
echo "========================================"
echo "All tests passed!"
echo "========================================"
