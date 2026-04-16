# FIX-03: Iteration Loop Fictional — Wire to Hook

**Severity:** CRITICAL
**Source file:** `src/hooks/v4.1/gate-hook.ts`
**Audit ref:** CRITICAL-3

---

## THE PROBLEM

`GateManager.handleVerifyFailure()` exists (`gates.ts:160-169`) but **nothing calls it**. The iteration loop (3 VERIFY failures → escalate to PLAN) is fictional.

The gate-hook's `checkGateAdvance()` advances build→test and test→verify, but:
- When on VERIFY gate, it always returns `null` (line 98)
- No code path calls `handleVerifyFailure()`
- VERIFY failures are not tracked
- Iteration never escalates

**Current `checkGateAdvance` (line 98):**
```typescript
return null;  // Always null — VERIFY never advances
```

---

## VERIFICATION COMMANDS

Before fix — verify `handleVerifyFailure` is never called:

```bash
grep -c "handleVerifyFailure" src/hooks/v4.1/gate-hook.ts
# Expected: 0 (not called)
```

After fix — verify `handleVerifyFailure` is called:

```bash
grep -c "handleVerifyFailure" src/hooks/v4.1/gate-hook.ts
# Expected: 1+ (called)
```

---

## MECHANICAL CHECKLIST

- [ ] `handleVerifyFailure()` is called from gate-hook
- [ ] Iteration escalation triggers after 3 VERIFY failures
- [ ] After escalation, currentIteration is incremented (e.g., V1.0 → V1.1)
- [ ] After escalation, currentGate resets to 'plan'
- [ ] `npx tsc --noEmit` passes
- [ ] `bun build` succeeds

---

## EXACT FIX

### File: `src/hooks/v4.1/gate-hook.ts`

**FIND the `createGateHook` function's return (around line 15-46), specifically the auto-advance section:**

Replace lines 39-46:
```typescript
    // Auto-advance gates based on tool results
    const shouldAdvance = checkGateAdvance(tool, args, result, currentGate);
    if (shouldAdvance && gateManager.canTransition(shouldAdvance)) {
      gateManager.passCurrentGate();
      gateManager.transitionTo(shouldAdvance);
      console.log(`[Shark] Gate advanced: ${currentGate} → ${shouldAdvance}`);
    }
```

**REPLACE WITH:**
```typescript
    // Auto-advance gates based on tool results
    const shouldAdvance = checkGateAdvance(tool, args, result, currentGate);
    if (shouldAdvance && gateManager.canTransition(shouldAdvance)) {
      gateManager.passCurrentGate();
      gateManager.transitionTo(shouldAdvance);
      console.log(`[Shark] Gate advanced: ${currentGate} → ${shouldAdvance}`);
    }

    // Check for VERIFY failure — iteration loop
    if (currentGate === 'verify') {
      const resultStr = result ? JSON.stringify(result) : '';
      const hasError = resultStr.includes('"error"') || resultStr.includes('"status":"error"');
      const hasFailure = hasError || resultStr.includes('fail') || resultStr.includes('FAIL');

      if (hasFailure) {
        const verifyResult = gateManager.handleVerifyFailure();
        console.log(`[Shark] VERIFY failure detected (attempt ${gateManager.getState().verifyAttempts}/3)`);

        if (verifyResult.action === 'escalate') {
          console.log(`[Shark] ITERATION ESCALATION: ${verifyResult.iteration} — returning to PLAN`);
          // Injection: system-transform hook will pick up the new iteration on next prompt
        }
      }
    }
```

**This adds:**
- Detects when on VERIFY gate and tool result shows failure
- Calls `handleVerifyFailure()` to track attempt count
- If escalation triggered (3rd failure), logs the new iteration
- System-transform hook already injects current iteration into prompts — no additional wiring needed

---

## IMPORTANT NOTES

### Verification Is Not Automated

The VERIFY gate cannot be auto-advanced like BUILD→TEST. "Verification" requires human or agent judgment about whether SPEC.md alignment is correct. The iteration loop in this fix handles **failure** cases — when verification fails 3 times, escalate.

The VERIFY gate itself is a **stop point** — the agent must explicitly call `shark-gate --action advance` when verification passes. This fix only handles the failure path.

### Iteration Tracking

The `gateManager.getState()` returns the current `verifyAttempts` count and `currentIteration`. The system-transform hook already reads these and injects into the agent's system prompt. After escalation, the agent sees the new iteration on its next prompt.

---

## BUILD VERIFICATION

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# handleVerifyFailure must be called in gate-hook
HVF=$(grep -c "handleVerifyFailure" src/hooks/v4.1/gate-hook.ts 2>/dev/null || echo "0")
echo "handleVerifyFailure references in gate-hook: $HVF"

if [ "$HVF" -lt 1 ]; then
  echo "FAIL: handleVerifyFailure not called"
  exit 1
fi

echo "PASS: handleVerifyFailure is called"

# TypeScript
npx tsc --noEmit || exit 1

# Build
bun build src/index.ts --outdir dist --target bun --format esm --bundle || exit 1

echo "All checks pass"
exit 0
```

---

*Fix-03 complete. Iteration loop wired to hook.*
