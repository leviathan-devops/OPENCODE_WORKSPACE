# Testing — Mechanical Verification Approach

## Principle: Verify-First Discipline

**No "looks good" verification.** Every component must demonstrate firing evidence before considered working. E2E tests alone are insufficient — they run in mock context.

### Evidence Types

| Evidence Type | Example | Acceptable? |
|--------------|---------|------------|
| Log output | `console.log("brainstorm-gate fired")` | ✅ Yes |
| State change | `.hermes/phase.json` content before/after | ✅ Yes |
| File output | Test file created, snapshot written | ✅ Yes |
| Error message | Blocked tool returns specific error string | ✅ Yes |
| Network trace | hermes_recall returns prior session data | ✅ Yes |
| E2E test passing | `bun test-e2e.ts` exits 0 | ⚠️ Necessary but not sufficient |
| Code exists | File present in dist/index.js | ❌ No — code may exist and not fire |

---

## Testing Layers

### Layer 1: E2E Tests (Necessary Baseline)
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/v3-build/
bun test-e2e.ts
```
**What it proves:** Code parses, basic tool logic works, mock context handling
**What it does NOT prove:** Hooks fire in real OpenCode, delegation works, state persists

### Layer 2: Integration Tests (Real Session)
New file: `test-real-session.ts`
- Spawns actual OpenCode process with hermes-agent loaded
- Fires real tool calls
- Captures log output with hook firing evidence
- Verifies state changes

### Layer 3: Delegation Chain Tests
New file: `test-delegation-chain.ts`
- Spawns session, sends "implement X"
- Verifies hermes→analyst→builder→reviewer chain fires
- Captures delegation ledger entries
- Verifies phase advances

### Layer 4: Container TUI Tests
Per AGENTS.md Shark protocol:
```bash
docker build -t hermes-test -f Dockerfile.hermes .
docker exec hermes-test opencode --attach --agent hermes
# Automated interaction script
```

---

## Mechanical Hook Verification

### Hook Verification Matrix (from 02_WORKFLOW)

Every hook must have firing evidence before considered verified:

```
[ ] brainstorm-gate     → "build a login" → must ask questions, not code
[ ] plan-validator     → send TBD plan → must reject with error
[ ] tdd-enforcer       → write src/ without test → must block
[ ] delegation-gate    → coder write without reviewer → must block
[ ] phase-monitor      → phase_complete call → must log state change
[ ] knowledge-injector → any tool call → must inject context next turn
[ ] system-enhancer    → session start → must inject HERMES.md
[ ] self-review        → self-approval attempt → must detect
[ ] debugging-spiral   → 5 identical failures → must detect
[ ] supervisor-loop    → any tool call → must feed supervisor
... (all 29 hooks)
```

### Verification Session Structure
```typescript
// test-real-session.ts
async function verifyHook(hookName: string, trigger: () => Promise<void>) {
  const evidence: HookEvidence[] = [];
  const originalLog = console.log;
  
  // Intercept logs
  console.log = (...args) => {
    evidence.push({ type: "log", message: args.join(" "), ts: Date.now() });
    originalLog.apply(console, args);
  };
  
  await trigger(); // Fire the hook
  
  console.log = originalLog;
  
  // Check evidence
  const hasEvidence = evidence.some(e => e.message.includes(hookName));
  return { hookName, hasEvidence, evidence };
}
```

---

## Phase State Machine Tests

### Transition Test Matrix
```typescript
const TRANSITIONS: [PhaseName, PhaseName][] = [
  ["idle", "analyze"],
  ["analyze", "plan"],
  ["plan", "build"],
  ["build", "review"],
  ["build", "debug"],
  ["review", "debug"],
  ["review", "complete"],
  ["debug", "build"],
  ["debug", "review"],
];

for (const [from, to] of TRANSITIONS) {
  test(`transition ${from} → ${to}`, async () => {
    // Set phase to 'from'
    // Call phase_complete('to')
    // Verify state advanced
    // Verify .hermes/phase.json updated
  });
}
```

### Hot-Reload Persistence Test
```typescript
test("phase persists across hot-reload", async () => {
  // Start session, advance to 'plan' phase
  // Simulate hot-reload (clear module cache)
  // Restart hook system
  // Verify phase is still 'plan' from disk
});
```

---

## Memory System Tests

### Cross-Session Memory Test
```typescript
test("memory persists across sessions", async () => {
  // Session A: hermes_remember("test-key", "test-value")
  // End Session A
  // Session B: hermes_recall("test-key")
  // Verify returns "test-value"
});
```

### Context Injection Test
```typescript
test("knowledge-injector fires every turn", async () => {
  // Setup: memory has data
  // Turn 1: call any tool
  // Turn 2: verify injected context appears in system prompt
});
```

---

## Delegation Chain Tests

### Chain Verification
```typescript
test("delegation chain fires correctly", async () => {
  // Send: "implement user authentication"
  // Verify:
  // 1. hermes delegates to analyst
  // 2. analyst returns specs
  // 3. hermes delegates to builder
  // 4. builder runs TDD (test first)
  // 5. hermes delegates to reviewer
  // 6. reviewer returns approval
  // 7. phase advances to complete
});
```

---

## Regression Tests

### Spider Agent Regression
```typescript
test("hermes does not block spider coder", async () => {
  // With hermes-agent loaded:
  // Spider coder tries to write file
  // Verify: write succeeds (brainstorm-gate guard works)
});
```

### No Codegen Bypass
```typescript
test("hermes cannot bypass TDD gate", async () => {
  // Send: "build login" (no design approval)
  // Verify: no code generation tool calls
  // Verify: questions returned instead
});
```

---

## Test Execution Order

```
PHASE 1: Foundation
├── 1.1 E2E baseline (must pass 144/147 before starting)
├── 1.2 Tool fixes verified individually
├── 1.3 Build verification discipline established
└── 1.4 Integration harness created

PHASE 2: Hook Verification
├── 2.1 brainstorm-gate verified
├── 2.2 plan-validator verified
├── 2.3 tdd-enforcer verified
├── ... (all 29 hooks)
└── 2.n HOOK_VERIFICATION_LOG.md produced

PHASE 3: Delegation Chain
├── 3.1 analyst delegation verified
├── 3.2 builder delegation verified
├── 3.3 reviewer delegation verified
└── 3.n Full chain verified

PHASE 4: State Machine
├── 4.1 All 7 transitions verified
└── 4.2 Persistence verified

PHASE 5: Memory System
├── 5.1 hermes_remember verified
├── 5.2 hermes_recall verified
├── 5.3 Cross-session verified
└── 5.4 Context injection verified

PHASE 6: Integration
├── 6.1 Full TDD cycle
├── 6.2 Multi-turn session
├── 6.3 No regressions
└── 6.4 E2E 147/147

PHASE 7: Container Ship
├── 7.1 Docker build
├── 7.2 TUI replica test
└── 7.3 SHIP gate pass
```

---

## Pass Criteria Summary

| Phase | Gate | Pass Criteria |
|-------|------|-------------|
| Foundation | Build | dist mtime > src mtime, E2E ≥144/147 |
| Hook Verification | Test | 29/29 hooks have firing evidence |
| Delegation Chain | Test | Full chain fires, no broken links |
| State Machine | Test | All 7 transitions work, persistence survives hot-reload |
| Memory System | Test | Cross-session recall returns prior data |
| Integration | Test | Full TDD cycle, 147/147 E2E, no regressions |
| Container Ship | SHIP | TUI replica passes all SHIP criteria |
