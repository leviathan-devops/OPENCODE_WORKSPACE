# FIX 4: Delegation Gate — DOES NOT BLOCK (HIGH)

**Severity**: HIGH — gate exists but doesn't enforce
**Status**: MUST FIX
**Source File**: `src/hooks/delegation-gate.ts`
**Source Lines**: 21-31

---

## THE PROBLEM

The delegation gate is supposed to block task completion without reviewer approval, but it only annotates the args with `_gate_blocked` — it does NOT set `output.blocked = true`.

**v2.3 Plan Specification** says:
```typescript
if (task?.metadata?.reviewerApproved !== true) {
  output.blocked = true;  // ← SPEC REQUIRES THIS
  output.message = `[DELEGATION GATE] Cannot mark task ${taskId} as complete...`;
}
```

**Actual code**:
```typescript
output.args = {
  ...args,
  _gate_blocked: {
    gate: "reviewer_approval",
    message: `...`,
  },
};
// NO output.blocked = true
```

The gate annotates but does NOT block. An agent could ignore the `_gate_blocked` message and proceed anyway.

---

## EXACT FIX

**File**: `v2.3.1-build/src/hooks/delegation-gate.ts`

**Find (lines 19-33)**:
```typescript
      if (status === "complete" || status === "done") {
        const reviewerApproved = checkReviewerApproval(taskId, sessionID, input.worktree);
        if (!reviewerApproved) {
          output.args = {
            ...args,
            _gate_blocked: {
              gate: "reviewer_approval",
              message: `[DELEGATION GATE] Cannot mark task ${taskId} as complete without reviewer approval.

@${QA_AGENTS.join(", @")} must verify the work first.`,
            },
          };
        }
      }
```

**Replace with**:
```typescript
      if (status === "complete" || status === "done") {
        const reviewerApproved = checkReviewerApproval(taskId, sessionID, input.worktree);
        if (!reviewerApproved) {
          // BLOCK enforcement — not just annotation
          (output as any).blocked = true;
          output.args = {
            ...args,
            _gate_blocked: {
              gate: "reviewer_approval",
              message: `[DELEGATION GATE] Cannot mark task ${taskId} as complete without reviewer approval.

@${QA_AGENTS.join(", @")} must verify the work first.`,
            },
          };
        }
      }
```

**Change Summary**:
- Add `(output as any).blocked = true;` BEFORE setting args
- This causes OpenCode to actually block the tool execution, not just annotate

---

## VERIFICATION

```bash
# 1. Verify blocked assignment exists
grep -n "blocked = true" v2.3.1-build/src/hooks/delegation-gate.ts
# Expected: "(output as any).blocked = true"

# 2. Verify blocked is set BEFORE args
grep -nB2 "_gate_blocked" v2.3.1-build/src/hooks/delegation-gate.ts | head -5
# Expected: "blocked = true" appears before "_gate_blocked"

# 3. Build must succeed
cd v2.3.1-build && bun build.ts && echo "BUILD_OK"
# Expected: BUILD_OK
```

---

## MECHANICAL ENFORCEMENT CHECKLIST

- [ ] `(output as any).blocked = true` exists in delegation-gate.ts
- [ ] `blocked = true` is set before `_gate_blocked` annotation
- [ ] `bun build.ts` exits 0

