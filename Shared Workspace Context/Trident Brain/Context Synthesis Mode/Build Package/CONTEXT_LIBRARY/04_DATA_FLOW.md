# Data Flow - Context Synthesis Mode

## Entry Points

1. **Manual Trigger** → Agent calls `synthesize_context`
2. **Gate Transition** → Moving between gates
3. **Error Detected** → Tool fails
4. **Token Threshold** → 70% tokens
5. **Stale Context** → No progress in 10 messages

## Processing Pipeline

```
Trigger Signal
    ↓
Layer 1: Context Collection
    ├── T1: Session State
    ├── T2: Knowledge (Hermes/Hive/Kraken)
    ├── T3: Active Files
    └── T4: Tool History
    ↓ Gate Validation (all sources checked)
Layer 2: Relevance Scoring
    ├── Urgency Score (0-10)
    ├── Importance Score (0-10)
    └── Final Score = (Urgency × 0.6) + (Importance × 0.4)
    ↓ Gate Validation (all ranked)
Layer 3: Compression
    ├── Decision points: preserved
    ├── Files: summarized
    ├── Logs: pruned to errors
    └── Patterns: deduplicated
    ↓ Gate Validation (under 2k)
Layer 4: Injection Format
    ├── CRITICAL STATE section
    ├── DECISION POINTS section
    ├── INJECTED KNOWLEDGE section
    └── SYNTHESIZED INSIGHT section
    ↓
COMPLETE: T0-Ready Thought Stream
```

## Storage

- **Collection:** In-memory during synthesis
- **Scores:** In-memory, not persisted
- **Output:** T0 injection, not stored