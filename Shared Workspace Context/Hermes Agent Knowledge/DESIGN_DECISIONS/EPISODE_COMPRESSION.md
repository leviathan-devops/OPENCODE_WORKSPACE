# Design Decision: Episode Compression

**Date:** 2026-04-14  
**Version:** v3.5  

---

## Decision

After an episode completes, context is compressed to prevent explosion during long orchestration chains.

---

## Rationale

1. **Context Limits** — LLM context windows are finite
2. **Long Chains** — Orchestration can involve many episodes
3. **Memory Efficiency** — Only key decisions retained

---

## Implementation

```
Episode Start:
  - Snapshot current context
  - Track episode ID

Episode End:
  - Compress context (summarize intermediate steps)
  - Retain key decisions and outputs
  - Clear temporary data
```

---

## Impact

- Long workflows don't hit context limits
- Key decisions preserved
- Temporary data discarded