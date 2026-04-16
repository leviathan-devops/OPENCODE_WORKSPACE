# State Management - Problem Solving Mode

## What Persists

1. **Current Layer:** 1, 2, 3, 4, 5, or 6
2. **Iteration:** V1.0, V1.1, V1.2, etc.
3. **Layer Attempts:** Count of failures at current layer
4. **Evidence Chain:** All iterations' artifacts
5. **Gap History:** Accumulated gap analyses

## State Machine

```
┌─────────────────────────────────────────┐
│  LAYER_1 (Assumption)                   │
│  iteration: V1.0                         │
│  attempts: 0                            │
└───────────────┬─────────────────────────┘
                │ advance()
                ↓
        ┌───────────────┐
        │ LAYER_2 (Action)                 │
        │ attempts: 0                        │
        └───────────────┬───────────────────┘
                │ gap found
                ↓
        ┌───────────────┐
        │ LAYER_1 (New Assumption)          │
        │ iteration: V1.1                    │
        └───────────────┬───────────────────┘
                │
                │ ... (iterate until root cause)
                ↓
        ┌───────────────┐
        │ LAYER_6 (Verification)            │
        │ attempts: 0                        │
        └───────────────┬───────────────────┘
                │ complete()
                ↓
┌─────────────────────────────────────────┐
│  COMPLETE                               │
│  output: Debugging Chain                │
└─────────────────────────────────────────┘
```

## Iteration Semantics

- **Same Problem iterations:** New assumption, same problem
- **Layer transition:** Only after verification passes
- **Deepening:** Each iteration adds evidence, not skips layers