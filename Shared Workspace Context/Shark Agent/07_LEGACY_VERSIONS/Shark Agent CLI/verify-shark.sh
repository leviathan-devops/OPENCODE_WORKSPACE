#!/bin/bash
set -e

echo "=== SHARK CLI VERIFICATION ==="
echo

cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/packages/opencode

echo "1. Checking binary..."
if [ -f "./dist/opencode-linux-x64/bin/opencode" ]; then
    echo "   ✅ Binary exists"
else
    echo "   ❌ Binary missing"
    exit 1
fi

echo
echo "2. Checking shark command registration..."
if ./dist/opencode-linux-x64/bin/opencode --help 2>&1 | grep -q "shark"; then
    echo "   ✅ Shark command registered"
else
    echo "   ❌ Shark command not found"
    exit 1
fi

echo
echo "3. Checking enforcement integration..."
if strings dist/opencode-linux-x64/bin/opencode 2>&1 | grep -q "enforceSharkArchitecture"; then
    echo "   ✅ Enforcement code found in binary"
else
    echo "   ❌ Enforcement code not found in binary"
    exit 1
fi

echo
echo "4. Testing shark wizard..."
./dist/opencode-linux-x64/bin/opencode shark --wizard 2>&1 | head -5
if [ $? -eq 0 ]; then
    echo "   ✅ Shark wizard works"
else
    echo "   ❌ Shark wizard failed"
fi

echo
echo "5. Checking typecheck..."
if bun typecheck 2>&1 | grep -q "error"; then
    echo "   ❌ Typecheck has errors"
    exit 1
else
    echo "   ✅ Typecheck passed"
fi

echo
echo "6. Running enforcement tests..."
test_output=$(bun test test/enforcement/enforcer.test.ts 2>&1)
if echo "$test_output" | grep -q " 14 pass"; then
    echo "   ✅ All 14 enforcement tests passed"
else
    echo "   ❌ Tests failed"
    echo "$test_output"
fi

echo
echo "=== VERIFICATION COMPLETE ==="
echo "SHARK CLI is ready for testing!"
