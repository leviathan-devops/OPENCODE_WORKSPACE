# SHARK Testing Plan

## Quick Start Test

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/packages/opencode

# 1. Build and verify
bun typecheck
bun test
bun run build

# 2. Test CLI
./dist/opencode-linux-x64/bin/opencode shark --help
./dist/opencode-linux-x64/bin/opencode --help | grep shark

# 3. Run all firewall tests
for i in 1 2 4 5 6 7 9; do
  echo "=== Testing Firewall $i ==="
  ./dist/opencode-linux-x64/bin/opencode shark --test-firewall $i
  echo
done

# 4. Check audit log
./dist/opencode-linux-x64/bin/opencode shark --audit-log
```

## Comprehensive Test Suite

### Phase 1: Build Verification
```bash
# 1. Type checking
bun typecheck
# Expected: 0 errors

# 2. Unit tests
bun test test/enforcement/enforcer.test.ts
# Expected: 14 tests pass

# 3. Full test suite
bun test
# Expected: 1375+ pass, failures are pre-existing

# 4. Build binary
bun run build
# Expected: dist/ directory with binaries
```

### Phase 2: CLI Verification
```bash
# 1. Verify shark command exists
./dist/opencode-linux-x64/bin/opencode --help | grep shark
# Expected: "shark" in command list

# 2. Test shark help
./dist/opencode-linux-x64/bin/opencode shark --help
# Expected: Shows all shark options

# 3. Test wizard
./dist/opencode-linux-x64/bin/opencode shark --wizard
# Expected: Wizard output

# 4. Test binary wrapper
./bin/opencode --help
# Expected: No ES module errors
```

### Phase 3: Firewall Tests (Should BLOCK)

#### Firewall 1-2: Guardian Protection
```bash
# Test 1: System path (should block)
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 1
# Expected: ❌ BLOCKED [guardian] Guardian blocked write to SYSTEM zone

# Test 2: Personal path (should block)
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 2
# Expected: ❌ BLOCKED [guardian] Guardian blocked write to PERSONAL zone

# Manual test: Try actual write
echo "test" | ./dist/opencode-linux-x64/bin/opencode run "write /etc/test-file"
# Expected: SHARK Firewall [guardian]: Guardian blocked write to SYSTEM zone
```

#### Firewall 4: Mock Mode Detection
```bash
# Test 4: Mock pattern (should block)
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 4
# Expected: ❌ BLOCKED [mock-mode] Mock mode pattern detected

# Manual test: Try mock command
echo "I would run npm install in a real environment" | ./dist/opencode-linux-x64/bin/opencode run
# Expected: SHARK Firewall [mock-mode]: Mock mode pattern detected
```

#### Firewall 5: Theatrical Code Detection
```bash
# Test 5: Unused function (should block)
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 5
# Expected: ❌ BLOCKED [theatrical-code] Theatrical code: Function 'unusedHelper' is defined but never called or exported

# Manual test: Write theatrical code
cat > test-theatrical.ts << 'EOF'
function helper1() { return 1 }
function helper2() { return 2 }
function helper3() { return 3 }
// Only main is called
function main() { return helper1() }
main()
EOF
echo "test" | ./dist/opencode-linux-x64/bin/opencode run "write test.ts --content \"$(cat test-theatrical.ts)\""
# Expected: SHARK Firewall [theatrical-code]: Theatrical code: Function 'helper2' is defined but never called or exported
```

#### Firewall 6: Style Guide Enforcement
```bash
# Test 6: Multi-word variable (should block)
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 6
# Expected: ❌ BLOCKED [style-guide] Style guide violations: Multi-word identifier 'overlyLongVariableName' has 3 words (max: 2)

# Manual test: Write bad style
cat > test-style.ts << 'EOF'
const overlyLongVariableName = 1
const anotherBadVariableName = 2
const good = 3
EOF
echo "test" | ./dist/opencode-linux-x64/bin/opencode run "write test.ts --content \"$(cat test-style.ts)\""
# Expected: SHARK Firewall [style-guide]: Style guide violations: ...
```

#### Firewall 7: Repo Root Test Prevention
```bash
# Test 7: Repo root test (should block)
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 7
# Expected: ❌ BLOCKED [repo-root-test] Tests must be run from package directory using workdir parameter, not repo root

# Manual test: Try npm test from root
echo "test" | ./dist/opencode-linux-x64/bin/opencode run "bash --command 'npm test'"
# Expected: SHARK Firewall [repo-root-test]: Tests must be run from package directory using workdir parameter, not repo root
```

#### Firewall 9: Documentation Validation
```bash
# Test 9: Theatrical docs (should block)
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 9
# Expected: ❌ BLOCKED [documentation] Theatrical documentation: ...

# Manual test: Write theatrical README
cat > test-readme.md << 'EOF'
# Project
This would work in a real environment.
TODO: implement the rest.
For demonstration purposes only.
EOF
echo "test" | ./dist/opencode-linux-x64/bin/opencode run "write README.md --content \"$(cat test-readme.md)\""
# Expected: SHARK Firewall [documentation]: Theatrical documentation: ...
```

### Phase 4: Positive Tests (Should ALLOW)

```bash
# 1. Normal code (should allow)
cat > good-code.ts << 'EOF'
const x = 1
const y = 2
function add(a: number, b: number) {
  return a + b
}
const result = add(x, y)
EOF
echo "test" | ./dist/opencode-linux-x64/bin/opencode run "write good.ts --content \"$(cat good-code.ts)\""
# Expected: Success, file written

# 2. Normal command (should allow)
echo "test" | ./dist/opencode-linux-x64/bin/opencode run "bash --command 'ls -la'"
# Expected: Success, command runs

# 3. Workspace file (should allow)
echo "test" | ./dist/opencode-linux-x64/bin/opencode run "write src/test.txt --content 'test content'"
# Expected: Success, file written in workspace
```

### Phase 5: Audit Log Verification

```bash
# 1. Check audit log exists
ls -la .shark/audit.log
# Expected: File exists

# 2. View audit log
./dist/opencode-linux-x64/bin/opencode shark --audit-log
# Expected: Shows all test entries

# 3. Verify log format
head -5 .shark/audit.log | jq .
# Expected: JSON entries with timestamp, tool, allowed, reason, firewall
```

### Phase 6: Performance Testing

```bash
# 1. Baseline timing (without enforcement)
time echo "test" | SHARK_DISABLED=1 ./dist/opencode-linux-x64/bin/opencode run "write test.txt --content 'test'"

# 2. With enforcement timing
time echo "test" | ./dist/opencode-linux-x64/bin/opencode run "write test.txt --content 'test'"

# 3. Compare results
# Expected: < 100ms overhead for enforcement
```

## Expected Results Matrix

| Test | Command | Expected Result | Verification |
|------|---------|----------------|--------------|
| Build | `bun typecheck` | 0 errors | ✅ |
| Unit Tests | `bun test test/enforcement/` | 14 pass | ✅ |
| CLI Help | `./dist/... shark --help` | Shows options | ✅ |
| Firewall 1 | `--test-firewall 1` | ❌ BLOCKED [guardian] | ✅ |
| Firewall 2 | `--test-firewall 2` | ❌ BLOCKED [guardian] | ✅ |
| Firewall 4 | `--test-firewall 4` | ❌ BLOCKED [mock-mode] | ✅ |
| Firewall 5 | `--test-firewall 5` | ❌ BLOCKED [theatrical-code] | ✅ |
| Firewall 6 | `--test-firewall 6` | ❌ BLOCKED [style-guide] | ✅ |
| Firewall 7 | `--test-firewall 7` | ❌ BLOCKED [repo-root-test] | ✅ |
| Firewall 9 | `--test-firewall 9` | ❌ BLOCKED [documentation] | ✅ |
| Positive 1 | Write good code | ✅ ALLOWED | ✅ |
| Positive 2 | Run normal command | ✅ ALLOWED | ✅ |
| Audit Log | `--audit-log` | Shows entries | ✅ |
| Performance | Timing test | < 100ms overhead | ✅ |

## Troubleshooting Guide

### If tests fail:

#### Type check errors:
```bash
# Check specific file
bun typecheck src/enforcement/enforcer.ts
# Fix import statements (use `type` keyword)
```

#### Test failures:
```bash
# Run specific test
bun test test/enforcement/enforcer.test.ts -t "mock detection"
# Check test expectations vs implementation
```

#### CLI command missing:
```bash
# Verify command registration
grep -n "SharkCommand" src/index.ts
# Should show import and .command() line
```

#### Binary wrapper errors:
```bash
# Test wrapper directly
node ./bin/opencode --help
# Fix ES module imports if needed
```

#### Firewall not blocking:
```bash
# Check enforcement integration
grep -n "enforceSharkArchitecture" src/tool/tool.ts
# Should be lines 82-91
```

### Common Issues:

1. **ES module errors in `bin/opencode`**
   - Solution: Ensure all `require()` → `import`
   - Use `import { spawnSync } from "child_process"`

2. **Type-only import errors**
   - Solution: Add `type` keyword: `import { type AuditEntry }`

3. **Firewall logic incorrect**
   - Solution: Check pattern matching in validation modules
   - Test with `console.log()` debugging

4. **Audit log not created**
   - Solution: Check `.shark/` directory permissions
   - Verify `AuditLogger` constructor path

## Success Criteria

The build is **READY FOR PRODUCTION** when:

1. ✅ All 9 firewalls block as designed
2. ✅ Normal operations are not blocked
3. ✅ Audit log is created and readable
4. ✅ CLI is stable and user-friendly
5. ✅ Performance overhead is acceptable (< 100ms)
6. ✅ All tests pass (1375+ total)
7. ✅ TypeScript compiles with 0 errors

## Final Verification Script

```bash
#!/bin/bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/packages/opencode

echo "=== SHARK FINAL VERIFICATION ==="
echo

echo "1. Type checking..."
bun typecheck && echo "✅ PASS" || echo "❌ FAIL"

echo "2. Unit tests..."
bun test test/enforcement/enforcer.test.ts && echo "✅ PASS" || echo "❌ FAIL"

echo "3. Build..."
bun run build && echo "✅ PASS" || echo "❌ FAIL"

echo "4. CLI command..."
./dist/opencode-linux-x64/bin/opencode --help | grep -q shark && echo "✅ PASS" || echo "❌ FAIL"

echo "5. Firewall tests..."
ALL_PASS=true
for i in 1 2 4 5 6 7 9; do
  if ./dist/opencode-linux-x64/bin/opencode shark --test-firewall $i 2>&1 | grep -q "BLOCKED"; then
    echo "  Firewall $i: ✅ PASS"
  else
    echo "  Firewall $i: ❌ FAIL"
    ALL_PASS=false
  fi
done

echo "6. Audit log..."
./dist/opencode-linux-x64/bin/opencode shark --audit-log 2>&1 | grep -q "SHARK Audit Log" && echo "✅ PASS" || echo "❌ FAIL"

echo
if $ALL_PASS; then
  echo "🎉 SHARK VERIFICATION COMPLETE - READY FOR PRODUCTION"
else
  echo "⚠️  SHARK VERIFICATION FAILED - CHECK ERRORS"
  exit 1
fi
```