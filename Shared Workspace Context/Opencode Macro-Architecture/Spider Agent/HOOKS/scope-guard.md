# scope-guard

**Type**: Tool Before Hook
**Hook Key**: `toolBefore` (specific to write/edit tools)
**Plugin**: Spider Agent
**Purpose**: Enforce file scope containment for coder operations

---

## Hook Signature

```typescript
type ScopeGuardHook = (input: ToolInput) => Promise<void>;
```

---

## Trigger Conditions

Only fires when tool name is one of:
- `write`
- `edit`
- `apply_patch`
- `create_file`

For all other tools, passes through immediately.

---

## Validation Steps

### 1. Scope Declaration Check

```typescript
session.declaredCoderScope must exist
```

If no scope declared, throws: `"No scope declared for this coder session."`

### 2. Path Validation Against Scope

```typescript
const allowedPaths = session.declaredCoderScope;
const targetPath = extractTargetPath(input.args);

for (const allowed of allowedPaths) {
  if (targetPath.startsWith(allowed)) {
    return; // Within scope
  }
}
throw new ScopeViolationError(targetPath);
```

### 3. Traversal Detection

```typescript
// Blocks '../' escape attempts
if (path.includes('..')) {
  throw new ScopeViolationError('Path traversal detected');
}
```

---

## Scope Violation Tracking

On violation:
1. Throws to block the operation
2. Sets `session.lastScopeViolation` with details:
   ```typescript
   {
     tool: string,
     attemptedPath: string,
     declaredScope: string[],
     timestamp: string
   }
   ```

---

## State Mutations

| Read | Write | Effect |
|------|-------|--------|
| `agentSession.declaredCoderScope` | None | Validates scope |
| None | `agentSession.lastScopeViolation` | Tracks violation |

Does NOT write to disk — only in-memory state.

---

## Throws Behavior

THROWS `ScopeViolationError` to block the write/edit operation.

---

## Error Example

```
Scope violation: Attempted to write to 'src/admin/users.ts' 
but coder scope is limited to 'src/auth/**' and 'tests/auth/**'
```

---

## Source Reference

```typescript
export function createScopeGuardHook(directory: string) {
  return {
    toolBefore: async (input) => {
      if (!isWriteTool(input.tool)) return;
      
      const scope = session.declaredCoderScope;
      if (!scope) throw new Error('No scope declared');
      
      const targetPath = extractTargetPath(input.args);
      if (!isPathInScope(targetPath, scope)) {
        session.lastScopeViolation = { ... };
        throw new ScopeViolationError(targetPath);
      }
    }
  };
}
```

---

## Related Hooks

- `delegation-gate` — Requires scope before coder delegation
- `guardrails` — General tool validation
- `declare_scope` — Tool that declares scope
