# State Management - Context Synthesis Mode

## What Persists

Context Synthesis Mode is STATELESS - each synthesis run:
1. Collects fresh context from sources
2. Scores and ranks immediately
3. Compresses to output
4. Injects and discards

## Why Stateless?

- Context changes rapidly (session state, tool history)
- Caching would serve stale context
- Each trigger should get current context

## State Machine

```
IDLE
    ↓ trigger
COLLECTING (Layer 1)
    ↓ all sources checked
SCORING (Layer 2)
    ↓ all ranked
COMPRESSING (Layer 3)
    ↓ under 2k
FORMATTING (Layer 4)
    ↓ complete
INJECTED → IDLE
```

## Token Budget

- **Hard limit:** 2,000 tokens
- **Decision point budget:** 500 tokens (preserved)
- **General budget:** 1,500 tokens