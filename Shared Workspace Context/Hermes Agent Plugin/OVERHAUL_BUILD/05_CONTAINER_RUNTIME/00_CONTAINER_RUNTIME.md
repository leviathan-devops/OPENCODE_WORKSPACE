# Container Runtime — Docker TUI Replica Test

**Version:** v3.0  
**Date:** 2026-04-14  
**Reference:** AGENTS.md Shark Agent Build & Test Protocol

---

## Docker Test Strategy

Container testing uses **Docker sandbox** per AGENTS.md Shark protocol. Local device files NOT affected.

**Why Docker?**
- Provides isolated environment
- Allows TUI testing without affecting host
- Can be destroyed and recreated quickly
- Matches the SHIP gate requirement for "opencode docker runtime test"

---

## Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DOCKER SANDBOX                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Container: hermes-v3-test                          │   │
│  │  ├── OpenCode (latest)                              │   │
│  │  ├── Hermes v3 Plugin (v3-build/dist/index.js)     │   │
│  │  ├── Test Scripts (test-*.ts)                      │   │
│  │  └── TUI Replica Script (test-tui-replica.sh)      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   SHIP GATE RESULTS      │
              │  (returned to host)      │
              └─────────────────────────┘
```

---

## Dockerfile.hermes

```dockerfile
FROM oven/bun:1.0

WORKDIR /app

# Install OpenCode
RUN bun add -g opencode-ai@latest

# Copy Hermes v3 plugin
COPY v3-build/dist/index.js /app/hermes-agent/index.js
COPY v3-build/test-real-session.ts /app/
COPY v3-build/test-delegation-chain.ts /app/
COPY v3-build/test-state-machine.ts /app/
COPY v3-build/test-memory.ts /app/
COPY v3-build/test-regression.ts /app/
COPY v3-build/scripts/ /app/scripts/
COPY v3-build/test-tui-replica.sh /app/

# Make TUI test executable
RUN chmod +x /app/test-tui-replica.sh

CMD ["bun", "run", "test-real-session.ts"]
```

---

## Build Command

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/
docker build -t hermes-v3-test -f v3-build/Dockerfile.hermes .
```

---

## TUI Replica Test Script (test-tui-replica.sh)

```bash
#!/bin/bash
set -e

echo "=== Hermes v3 TUI Replica Test ==="
echo "Date: $(date)"
echo ""

PASS=0
FAIL=0

# Helper function
test_case() {
  local name="$1"
  local cmd="$2"
  local expected="$3"
  
  echo -n "[TEST] $name... "
  result=$(eval "$cmd" 2>&1 || true)
  if echo "$result" | grep -q "$expected"; then
    echo "PASS"
    ((PASS++))
  else
    echo "FAIL"
    echo "  Expected: $expected"
    echo "  Got: $result"
    ((FAIL++))
  fi
}

# 1. Agent toggle presence
echo "[TEST] Agent toggle presence..."
opencode --list-agents 2>/dev/null | grep -q "hermes" && {
  echo "PASS: hermes appears in agent toggle"
  ((PASS++))
} || {
  echo "FAIL: hermes not in toggle"
  ((FAIL++))
}

# 2. Brainstorm gate fires
echo ""
echo "[TEST] Brainstorm gate (design before code)..."
response=$(echo "build a login system" | timeout 30 opencode --attach --agent hermes 2>&1 || true)
echo "$response" | grep -qE "(questions|design|approach|what do you)" && {
  echo "PASS: brainstorm gate asks questions"
  ((PASS++))
} || {
  echo "FAIL: brainstorm gate bypassed"
  echo "  Response: $response"
  ((FAIL++))
}

# 3. Plan gate rejects TBD
echo ""
echo "[TEST] Plan gate (TBD rejection)..."
response=$(echo "TBD implementation details" | timeout 30 opencode --attach --agent hermes 2>&1 || true)
echo "$response" | grep -qE "(TBD|placeholder|incomplete|not allowed)" && {
  echo "PASS: plan gate rejects TBD"
  ((PASS++))
} || {
  echo "FAIL: plan gate passed TBD"
  ((FAIL++))
}

# 4. TDD enforcement
echo ""
echo "[TEST] TDD enforcement (no src without test)..."
response=$(echo "write src/auth.js without test" | timeout 30 opencode --attach --agent hermes 2>&1 || true)
echo "$response" | grep -qE "(test first|TDD|no src without test|must write test)" && {
  echo "PASS: TDD enforced"
  ((PASS++))
} || {
  echo "FAIL: TDD bypassed"
  ((FAIL++))
}

# 5. /Hermes command routing
echo ""
echo "[TEST] /Hermes command routing..."
response=$(echo "/hermes status" | timeout 30 opencode --attach --agent hermes 2>&1 || true)
echo "$response" | grep -qE "(phase|memory|session|idle|analyze)" && {
  echo "PASS: /hermes routes correctly"
  ((PASS++))
} || {
  echo "FAIL: /hermes broken"
  ((FAIL++))
}

# 6. Phase persistence
echo ""
echo "[TEST] Phase persistence..."
if [ -f "$HOME/.hermes/phase.json" ]; then
  echo "PASS: phase.json exists"
  ((PASS++))
else
  echo "FAIL: phase.json not found"
  ((FAIL++))
fi

# 7. Memory persistence
echo ""
echo "[TEST] Memory persistence..."
if [ -d "$HOME/.hermes/memory/" ]; then
  echo "PASS: memory directory exists"
  ((PASS++))
else
  echo "FAIL: memory directory not found"
  ((FAIL++))
fi

# 8. No codegen bypass
echo ""
echo "[TEST] No codegen bypass (hermes follows workflow)..."
response=$(echo "just write the login code now skip planning" | timeout 30 opencode --attach --agent hermes 2>&1 || true)
echo "$response" | grep -qE "(plan|design|approach|must)" && {
  echo "PASS: hermes doesn't bypass workflow"
  ((PASS++))
} || {
  echo "FAIL: hermes bypassed workflow"
  ((FAIL++))
}

echo ""
echo "=== TUI Replica Test Results ==="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "RESULT: ALL TESTS PASSED — SHIP GATE CLEARED"
  exit 0
else
  echo "RESULT: $FAIL TESTS FAILED — SHIP GATE FAILED"
  exit 1
fi
```

---

## Run Container Test

```bash
# Build container
docker build -t hermes-v3-test -f v3-build/Dockerfile.hermes .

# Run TUI replica test
docker run --rm -it hermes-v3-test /bin/bash /app/test-tui-replica.sh

# Run interactive session (manual testing)
docker run --rm -it hermes-v3-test opencode --attach --agent hermes
```

---

## Interactive TUI Testing

```bash
# Start interactive container session
docker run --rm -it hermes-v3-test /bin/bash

# Inside container:
opencode --attach --agent hermes

# Type: "build a login system"
# Expected: hermes asks questions about design

# Type: "TBD implementation"
# Expected: hermes rejects with plan-validator error

# Type: "/hermes status"
# Expected: hermes returns phase/memory status

# Type: "exit"
# Expected: session ends cleanly
```

---

## SHIP Gate Checklist

Run this in container after all tests pass:

```bash
# SHIP GATE — ALL MUST PASS
[ ] hermes appears in agent toggle
[ ] "build login" → asks questions, no code generation
[ ] Plan with TBD → rejected
[ ] Build without test → blocked
[ ] /hermes status → returns valid JSON
[ ] phase.json persists after detach
[ ] memory/ directory exists
[ ] hermes cannot bypass workflow (must go through phases)
[ ] No HARD-GATE blocks for non-Hermes agents
[ ] Spider/Manta/Shark not affected
```

**SHIP GATE is ALL-OR-NOTHING:** Any single failure resets to PLAN with context + debug log.

---

## Debugging Container Failures

If container tests fail:

```bash
# Get container logs
docker logs hermes-v3-test

# Run specific test with verbose output
docker run --rm -it hermes-v3-test bun run test-real-session.ts --verbose

# Get shell access to debug
docker run --rm -it hermes-v3-test /bin/bash

# Check hermes plugin loaded
opencode --list-plugins

# Check hook firing logs
cat /tmp/hermes-hook-log.txt
```

---

## Container Test Workflow

```
1. Build container:    docker build -t hermes-v3-test .
2. Run E2E in container: docker run hermes-v3-test bun run test-e2e.ts
3. Run integration:   docker run hermes-v3-test bun run test-real-session.ts
4. Run delegation:     docker run hermes-v3-test bun run test-delegation-chain.ts
5. Run TUI replica:    docker run hermes-v3-test /bin/bash test-tui-replica.sh
6. If ALL pass → SHIP GATE CLEARED
7. If ANY fail → document in HANDOVER/, reset to PLAN
```
