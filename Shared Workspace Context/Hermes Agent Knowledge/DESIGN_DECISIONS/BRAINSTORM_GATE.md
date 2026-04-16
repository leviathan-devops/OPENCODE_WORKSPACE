# Design Decision: Brainstorm Gate

**Date:** 2026-04  
**Version:** v2.x+  

---

## Decision

Brainstorm functionality is guarded by `.hermes/` directory check.

---

## Problem

Early versions had brainstorm gate blocking Spider coder incorrectly.

---

## Solution

```typescript
// In brainstorm-gate.ts
if (!isHermesAgent(agent)) {
  return; // Allow non-Hermes agents to proceed
}

if (isBrainstormMode()) {
  // Validate .hermes/ directory
}
```

---

## Key Fix

Added `isHermesAgent()` check to prevent cross-agent pollution.

See [DEBUG_LOGS/v2.x-BUILD_DEBUG_LOG.md](../../DEBUG_LOGS/v2.x-BUILD_DEBUG_LOG.md) for details.