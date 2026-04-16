# Design Decision: Fork Only for Hermes Sessions

**Date:** 2026-04-14  
**Version:** v3.5  

---

## Decision

Fork functionality is only activated when `.hermes/` directory exists in the working directory.

---

## Rationale

1. **Isolation** — Fork takes over UI control, should only happen in Hermes-managed sessions
2. **Safety** — Prevents accidental fork activation in other agent contexts
3. **Predictability** — User knows fork only available in Hermes sessions

---

## Implementation

```typescript
// In ForkManager
const FORK_GUARD = ".hermes/";

function isHermesSession(directory: string): boolean {
  return existsSync(join(directory, FORK_GUARD));
}
```

---

## Impact

- Fork tools check `isHermesSession()` before executing
- Non-Hermes sessions see fork tools as unavailable
- Other plugins not affected