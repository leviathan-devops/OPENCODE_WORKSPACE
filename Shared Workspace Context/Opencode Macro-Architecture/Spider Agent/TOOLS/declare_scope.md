# declare_scope

**Type**: Coordination tool
**Plugin**: Spider Agent
**Purpose**: Declare the file scope for a coder delegation to enable scope containment enforcement

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `paths`, `note?` |
| Returns | `{ success, scope, paths, declaredAt }` |
| Errors | Empty paths, path traversal attempt |

---

## Purpose

The `declare_scope` tool declares which files the coder is allowed to work on. This is a critical enforcement mechanism — the coder's scope is tracked and enforced by `scope_guard` hook.

Without a declared scope, the coder cannot be delegated to. This prevents unbounded changes and ensures the architect maintains control over what files are modified.

---

## Arguments

### `paths` (string[]) — **Required**

Array of file/directory paths the coder is allowed to modify.

### `note` (string) — Optional

Human-readable note explaining the scope.

---

## Returns

```typescript
{
  success: boolean,
  scope: string[],
  paths: string[],
  declaredAt: string
}
```

---

## Behavior

1. **Validation**
   - Paths must be non-empty array
   - Path traversal (`../`) blocked
   - Paths must exist or be creatable

2. **Scope Registration**
   - Stores scope in agent session state
   - Sets `declaredCoderScope` for scope_guard hook
   - Records timestamp

3. **Scope Enforcement**
   - `scope_guard` hook validates all write/edit tools
   - Any path outside declared scope → throws
   - Scope persists until next `declare_scope` call

---

## Scope Declaration Example

```json
{
  "paths": [
    "src/auth/login.ts",
    "src/auth/logout.ts", 
    "src/auth/types.ts",
    "tests/auth/"
  ],
  "note": "Authentication module refactor"
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Calls before delegating to coder |
| **Scope Guard** | Enforces declared scope on write/edit tools |
| **Delegation Gate** | Requires scope declaration before coder delegation |

---

## Usage Example

```
/declare_scope paths=["src/feature/", "tests/feature/"] note="New feature implementation scope"
```

---

## Related Tools

- `scope_guard` (hook) — Enforces scope containment
- `delegation_gate` (hook) — Requires scope before coder delegation
- `declare_done` — Marks task complete, clears scope
