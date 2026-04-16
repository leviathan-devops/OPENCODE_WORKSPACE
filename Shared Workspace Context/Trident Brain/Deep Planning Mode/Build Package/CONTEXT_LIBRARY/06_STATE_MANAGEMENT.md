# State Management - Deep Planning Mode

## What Persists

1. **Current Layer:** 1, 2, or 3
2. **Iteration:** V1.0, V1.1, V1.2, etc.
3. **Layer Attempts:** Count of failures at current layer
4. **Artifacts:** Map of generated markdown content

## State Machine

```
┌─────────────────────────────────────────┐
│  LAYER_1                                │
│  iteration: V1.0                         │
│  attempts: 0                            │
└───────────────┬─────────────────────────┘
                │ advance()
                ↓
        ┌───────────────┐
        │ attempts++     │ ← layer fails
        └───────────────┘
                │
                │ verify()
                ↓
┌─────────────────────────────────────────┐
│  LAYER_2                                │
│  iteration: V1.2 (after 2 failures)    │
│  attempts: 0                            │
└───────────────┬─────────────────────────┘
                │
                │ advance()
                ↓
┌─────────────────────────────────────────┐
│  LAYER_3                                │
│  iteration: V1.4                        │
│  attempts: 0                            │
└───────────────┬─────────────────────────┘
                │
                │ complete()
                ↓
┌─────────────────────────────────────────┐
│  COMPLETE                               │
│  output: ContextLibrary                 │
└─────────────────────────────────────────┘
```

## Iteration Semantics

- **Same Layer iterations:** Add depth, don't skip
- **Layer transition:** Only after verification passes
- **Iteration format:** V{major}.{layer-attempts}

## State Persistence

State should be serializable for:
- Cross-session continuation
- Debugging/tracing
- Audit trails