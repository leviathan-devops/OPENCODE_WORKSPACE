# Failure Modes — Recovery Mode

## Failure Mode 1: No Interruption Detected

- **Probability:** Medium
- **Impact:** Cannot recover stream, agent starts fresh
- **Detection:** InterruptionPoint.type = 'UNKNOWN' and feasibility = 'NONE'
- **Mitigation:** Note that recovery was not possible, provide fresh context

## Failure Mode 2: Complete Memory Loss

- **Probability:** Low (rare catastrophic crash)
- **Impact:** No recoverable context at all
- **Detection:** Tool call history empty, last message empty
- **Mitigation:** Flag as TOTAL_LOSS, inject empty recovery with note

## Failure Mode 3: Misidentified Interruption Type

- **Probability:** Medium
- **Impact:** Wrong recovery strategy applied
- **Detection:** Type mismatch (said crash but was scheduled compaction)
- **Mitigation:** Use generic recovery that works for both

## Failure Mode 4: Tool Pattern Ambiguity

- **Probability:** Medium
- **Impact:** Wrong pattern matched, wrong interpretation
- **Detection:** Multiple patterns match with similar confidence
- **Mitigation:** Use highest confidence pattern, flag uncertainty

**Ambiguous Patterns:**

| Scenario | Interpretation A | Interpretation B |
|----------|-----------------|-----------------|
| read(A) → read(A) | Confused, re-reading | Valid re-read for reference |
| read(A) → write(A) | About to edit A | Finished reading, now writing something else |

## Failure Mode 5: Intent Misread

- **Probability:** Medium
- **Impact:** Wrong action identified as pending
- **Detection:** Intent confidence < 0.7
- **Mitigation:** Flag as speculative, note alternative interpretations

## Failure Mode 6: Confidence Inflation

- **Probability:** High (cognitive bias)
- **Impact:** Recovery claims higher confidence than warranted
- **Detection:** Verification reveals conflicts
- **Mitigation:** Use VerificationEngine to ground confidence

## Failure Mode 7: Ghost State Injection

- **Probability:** Low (when Verification is working)
- **Impact:** Agent acts on claims that never happened
- **Detection:** VerificationEngine flags conflicts
- **Mitigation:** Never inject ghost claims above 0.7 confidence

## Failure Mode 8: Narrative Hallucination

- **Probability:** Medium
- **Impact:** Building coherent story from fragments that aren't related
- **Detection:** Narrative doesn't match verified facts
- **Mitigation:** Stick to verified elements in narrative, flag inferred sections

## Failure Mode 9: Recovery Timing Too Slow

- **Probability:** Low
- **Impact:** Agent waits too long for recovery
- **Detection:** Total time > 2 seconds
- **Mitigation:** Set hard timeout, fall back to fresh context

## Failure Mode 10: Mode Selection Error

- **Probability:** Low
- **Impact:** Recovery triggered when injection was needed (or vice versa)
- **Detection:** Wrong output format
- **Mitigation:** Mode selection is deterministic based on trigger

## Anti-Patterns Specific to Recovery

| Anti-Pattern | Description | Prevention |
|--------------|-------------|------------|
| **Recovery Hallucination** | Making up context that wasn't there | Only infer from tool patterns |
| **Confidence Inflation** | Overclaiming recovery quality | Explicit confidence scores required |
| **Intent Assumption** | Claiming "about to" when uncertain | Flag speculative intents |
| **State Fabrication** | Creating memories from whole cloth | Cross-reference with filesystem |
| **Recovery Theater** | Running recovery but adding no value | Validate against actual gap |

## Recovery Confidence Matrix

| Scenario | Expected Confidence | Action |
|----------|---------------------|--------|
| Last 5 seconds, recent tool call | 0.90-1.0 | Use freely |
| Last 30 seconds, clear pattern | 0.80-0.90 | Use with note |
| Last 5 minutes, some gaps | 0.60-0.80 | Use with caution |
| Last hour, significant gaps | 0.40-0.60 | Use as hints only |
| Full session ago, major gaps | 0.20-0.40 | Debugging only |
| No evidence | 0.0-0.20 | Do not use |

## Escalation

When recovery fails:

1. **Log the failure** with interruption point data
2. **Calculate loss** — what percentage of context was recoverable
3. **Notify** — let agent know recovery confidence was low
4. **Inject fresh** — provide default context instead
5. **Preserve artifacts** — keep session for potential manual recovery

```typescript
function handleRecoveryFailure(
  reason: string,
  interruption: InterruptionPoint
): ContextInjection {
  return {
    mode: 'RECOVERY',
    confidenceScore: 0,
    recoveryData: {
      failureReason: reason,
      interruptionPoint: interruption,
      recoveredPercentage: 0,
    },
    // Fall back to minimal fresh context
    currentPosition: { gate: 'unknown', task: 'unknown', blockers: [] },
  };
}
```