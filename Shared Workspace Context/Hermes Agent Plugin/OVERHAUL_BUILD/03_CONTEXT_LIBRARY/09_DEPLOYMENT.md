# Deployment — How to Ship

## Pre-Ship Checklist

Before container testing, these must all pass:

- [ ] `bun build.ts` exits 0
- [ ] `dist/index.js` mtime > all `src/**/*.ts` mtime
- [ ] `bun test-e2e.ts` passes 147/147 (100%)
- [ ] All broken tools fixed (sast_scan, imports, symbols, grill)
- [ ] Brainstorm-gate guard fix incorporated (`.hermes/` check)
- [ ] Integration harness created (`test-real-session.ts`)
- [ ] Hook verification log produced (29/29 hooks with evidence)
- [ ] Delegation chain verified (hermes→analyst→builder→reviewer)
- [ ] Phase state machine verified (all 7 transitions)
- [ ] Memory persistence verified (cross-session recall)

---

## Build Output

```
v3-build/
├── dist/
│   └── index.js          ← Plugin bundle (562KB)
├── src/                   ← TypeScript source
│   ├── index.ts
│   ├── agents/
│   ├── hooks/
│   ├── tools/
│   ├── config/
│   └── services/
├── test-e2e.ts            ← E2E test suite
├── test-real-session.ts   ← Integration test suite
├── test-delegation-chain.ts
└── package.json
```

---

## Docker Container Build

### Dockerfile.hermes
```dockerfile
FROM oven/bun:1.0 AS base
WORKDIR /app

# Copy hermes plugin
COPY v3-build/dist/index.js /app/hermes-agent/
COPY v3-build/test-real-session.ts /app/
COPY v3-build/test-delegation-chain.ts /app/

# Install OpenCode
RUN bun add -g opencode-ai@latest

# Entry point
CMD ["bun", "run", "test-real-session.ts"]
```

### Build Command
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/
docker build -t hermes-v3-test -f v3-build/Dockerfile.hermes .
```

---

## Container TUI Replica Test (Per AGENTS.md)

The container test uses **Docker sandbox** per AGENTS.md Shark protocol. Local device files NOT affected.

### TUI Test Script
```bash
#!/bin/bash
# test-tui-replica.sh — runs in Docker container

set -e

echo "=== Hermes v3 TUI Replica Test ==="

# 1. Verify hermes appears in agent toggle
echo "[TEST] Agent toggle presence..."
opencode --list-agents 2>/dev/null | grep -q "hermes" && echo "PASS: hermes in toggle" || echo "FAIL: hermes not in toggle"

# 2. Verify brainstorm gate fires
echo "[TEST] Brainstorm gate..."
echo "build a login system" | opencode --attach --agent hermes 2>&1 | \
  grep -q "questions\|design\|approach" && echo "PASS: brainstorm gate asks questions" || echo "FAIL: brainstorm gate bypassed"

# 3. Verify plan gate
echo "[TEST] Plan gate (TBD rejection)..."
echo "TBD implementation" | opencode --attach --agent hermes 2>&1 | \
  grep -q "TBD\|placeholder\|incomplete" && echo "PASS: plan gate rejects TBD" || echo "FAIL: plan gate passed TBD"

# 4. Verify TDD enforcement
echo "[TEST] TDD enforcement..."
echo "write src/auth.js" | opencode --attach --agent hermes 2>&1 | \
  grep -q "test.*first\|TDD\|no src without test" && echo "PASS: TDD enforced" || echo "FAIL: TDD bypassed"

# 5. Verify /Hermes command routing
echo "[TEST] /Hermes command routing..."
echo "/hermes status" | opencode --attach --agent hermes 2>&1 | \
  grep -q "phase\|memory\|session" && echo "PASS: /hermes routes" || echo "FAIL: /hermes broken"

# 6. Verify phase persistence
echo "[TEST] Phase persistence..."
opencode --attach --agent hermes <<'EOF'
/hermes status
EOF
# Check phase.json exists and has valid state
grep -q "phase" ~/.hermes/phase.json && echo "PASS: phase persisted" || echo "FAIL: phase not persisted"

echo "=== TUI Replica Test Complete ==="
```

### Run Container Test
```bash
docker run --rm -it hermes-v3-test /bin/bash /app/test-tui-replica.sh
```

---

## SHIP Gate Criteria

| Criteria | Pass Condition | Test Method |
|----------|--------------|-------------|
| **Agent toggle** | `hermes` appears in OpenCode agent dropdown | `opencode --list-agents \| grep hermes` |
| **Brainstorm gate** | "build login" → asks questions, NO code block | Automated interaction + grep |
| **Plan gate** | Plan with TBD → rejected with specific error | Automated interaction + grep |
| **TDD gate** | Build without test → blocked with specific error | Automated interaction + grep |
| **Delegation gate** | Coder without reviewer → blocked | Delegation chain test |
| **Self-review gate** | Self-approval attempt → detected and blocked | Hook verification test |
| **Debugging spiral** | 5 identical failures → spiral detected | Hook verification test |
| **/Hermes routing** | `/Hermes status` → returns valid JSON | Automated interaction |
| **Phase persistence** | Resume → same phase as before detach | Container test |
| **Memory persistence** | Recall → prior session data returned | Cross-session test |
| **No Spider regression** | Spider coder writes files while Hermes loaded | Regression test |
| **No codegen bypass** | hermes cannot generate code without TDD gate | Automated interaction |

**SHIP gate is ALL-OR-NOTHING:** Any single failure resets to PLAN with context + debug log.

---

## OpenCode Config Registration

After SHIP gate passes, add to `~/.config/opencode/opencode.json`:

```json
{
  "plugins": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v3-build/dist/index.js"
  ]
}
```

**Note:** If Spider Agent or other plugins are present, ensure hook order in opencode.json places hermes-agent AFTER spider-agent (hook execution order matters — guardrails before knowledge injectors, Hermes-specific hooks after Spider's global hooks).

---

## Monitoring Post-Ship

After deployment, monitor:

1. **Hook firing logs** — Every hook should log when it fires
2. **Phase transitions** — `.hermes/phase.json` should show correct state
3. **Memory growth** — `~/.hermes/memory/` should stay under 50MB
4. **Delegation ledger** — All delegations should be recorded
5. **Error rates** — Tool failures should be < 1% after fallback fixes

---

## Rollback Procedure

If SHIP gate fails:
1. Revert opencode.json to previous plugin config
2. Document failure in HANDOVER/
3. Reset to PLAN phase with debug log
4. Identify specific failure point
5. Apply fix
6. Re-run build/test/verify cycle
