# FIX-B: Iteration Escalation — Structured State Emission

**Severity:** CRITICAL
**File:** `src/hooks/v4.1/gate-hook.ts`
**Audit ref:** NEW-2

---

## THE PROBLEM

After escalation, the agent doesn't see the new iteration immediately:

```typescript
// gate-hook.ts lines 58-60
if (verifyLoopResult.action === 'escalate') {
  console.log(`[Shark] ITERATION ESCALATION: ${verifyLoopResult.iteration} — returning to PLAN`);
}
```

**What happens:**
1. `handleVerifyFailure()` updates `gateManager` internal state (iteration incremented, verifyAttempts reset)
2. Log is emitted to console
3. Nothing forces the system-transform hook to fire
4. The next message the agent sends would see the new state via system-transform hook — but there's a delay
5. If the session crashes before the next message, the escalated state might be lost (relies on compaction hook)

**The architecture issue:** `tool.execute.after` cannot call `experimental.chat.system.transform`. There's no direct path. The best we can do is emit a structured log the agent can parse to detect iteration changes immediately.

---

## VERIFICATION COMMANDS

Before fix — verify escalation emits unstructured log:

```bash
grep "ITERATION ESCALATION" src/hooks/v4.1/gate-hook.ts
# Expected: log exists but no structured state emission
```

After fix — verify structured state emission:

```bash
grep -c "\[SHARK STATE\] iteration=" src/hooks/v4.1/gate-hook.ts
# Expected: 1+
```

---

## MECHANICAL CHECKLIST

- [ ] After escalation, structured `[SHARK STATE] iteration=X` log is emitted
- [ ] The log format is parseable by the agent
- [ ] `npx tsc --noEmit` passes
- [ ] `bun build` succeeds

---

## EXACT FIX

### File: `src/hooks/v4.1/gate-hook.ts`

**FIND lines 58-60:**

```typescript
        if (verifyLoopResult.action === 'escalate') {
          console.log(`[Shark] ITERATION ESCALATION: ${verifyLoopResult.iteration} — returning to PLAN`);
        }
```

**REPLACE WITH:**

```typescript
        if (verifyLoopResult.action === 'escalate') {
          const escalatedIteration = verifyLoopResult.iteration;
          console.log(`[Shark] ITERATION ESCALATION: ${escalatedIteration} — returning to PLAN`);

          // Structured state emission — agent can parse this to detect iteration change immediately
          // Format: [SHARK STATE] key=value key2=value2
          // The system-transform hook would pick up state on the next message,
          // but this structured log lets the agent detect the change in current context window
          console.log(`[SHARK STATE] iteration=${escalatedIteration} gate=plan verifyAttempts=0`);
        }
```

---

## WHY THIS WORKS

The structured log `[SHARK STATE] iteration=V1.1 gate=plan verifyAttempts=0`:
1. Is written to the session console output
2. The agent sees console output in its context
3. Even before the next message fires system-transform hook, the agent can parse the console output to know the iteration changed
4. This is the best we can do given OpenCode's hook architecture — tool.execute.after cannot trigger system-transform directly

---

## BUILD VERIFICATION

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Structured state emission must exist
SHARK_STATE=$(grep -c "\[SHARK STATE\] iteration=" src/hooks/v4.1/gate-hook.ts 2>/dev/null || echo "0")
echo "Structured state emission refs: $SHARK_STATE"

if [ "$SHARK_STATE" -lt 1 ]; then
  echo "FAIL: Structured state emission missing"
  exit 1
fi

echo "PASS: Structured state emission present"

# TypeScript
npx tsc --noEmit || exit 1

# Build
bun build src/index.ts --outdir dist --target bun --format esm --bundle || exit 1

echo "All checks pass"
exit 0
```

---

*Fix-B complete. Iteration escalation now emits structured state the agent can parse.*