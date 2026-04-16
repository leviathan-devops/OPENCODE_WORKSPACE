# delegation-gate

**Type**: Tool Before Hook
**Hook Key**: `toolBefore` (specific to `architect` and `coder` tools)
**Plugin**: Spider Agent
**Purpose**: Enforce QA gates before delegation to architect or coder agents

---

## Hook Signature

```typescript
type DelegationGateHook = (input: ToolInput) => Promise<void>;
```

---

## Trigger Conditions

Only fires when:
- Tool name is `architect`
- Tool name is `coder`

For all other tools, passes through immediately.

---

## Validation for `architect` Delegation

### 1. Plan Existence Check
```
.swarm/plan.json must exist
```
- Throws: "No plan found. Create plan before delegating to architect."

### 2. Phase Sequence Validation
```
Current phase must be reachable from last completed phase
```
- Reads `.swarm/plan.json`
- Validates phase transitions are sequential
- Prevents skipping phases

### 3. Task Context Validation
```
Delegation must specify valid task_id from plan
```
- Validates task exists in plan
- Ensures task is not already complete
- Prevents re-delegating completed tasks

### 4. Turbo Mode Seeding (if enabled)
```
If turbo mode, seeds evidence from previous phase
```
- Copies relevant evidence to current phase directory
- Speeds up architect's context building

---

## Validation for `coder` Delegation

### 1. Scope Declaration Required
```
declare_scope must have been called before coder delegation
```
- Throws: "Scope not declared. Call declare_scope before delegating to coder."

### 2. File Authority Validation
```
Declared scope must match actual file access needed
```
- Loads `declaredCoderScope` from agent session
- Validates all target files are within scope
- Prevents unbounded file access

### 3. Scope Containment Tracking
```
Delegation tracked in delegation-ledger.json
```
- Records: timestamp, delegator, scope, task_id
- Enables audit trail of all coder work

---

## State Mutations

| Read | Write | Effect |
|------|-------|--------|
| `.swarm/plan.json` | None | Phase/task validation |
| `.swarm/evidence-ledger.json` | None | Turbo mode seeding |
| `agentSession.declaredCoderScope` | None | Scope validation |
| None | `.swarm/delegation-ledger.json` | Records delegation |

---

## Throws Behavior

THROWS to block delegation if any validation fails. Does not warn — blocks entirely.

---

## Error Messages

| Condition | Error |
|-----------|-------|
| No plan | `No plan found. Create plan before delegating.` |
| Invalid phase | `Phase {n} is not reachable from phase {m}.` |
| No scope | `Scope not declared. Call declare_scope first.` |
| Out of scope | `File {path} is outside declared scope.` |

---

## Source Reference

```typescript
export function createDelegationGateHook(config, directory) {
  return {
    toolBefore: async (input) => {
      if (input.tool === 'architect') {
        validatePlanExists();
        validatePhaseSequence();
        validateTaskContext(input.args);
      }
      if (input.tool === 'coder') {
        validateScopeDeclared();
        validateFileAuthority(input.args);
        recordDelegation(input);
      }
    }
  };
}
```

---

## Related Hooks

- `scope-guard` — Enforces scope on file operations
- `guardrails` — General tool validation
- `phase_complete` — Updates phase state after completion
