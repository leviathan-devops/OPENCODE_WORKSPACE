# Architecture - Context Synthesis Mode

## High-Level Design

```
CONTEXT SYNTHESIS MODE
│
├── LAYER 1: CONTEXT COLLECTION
│   └── Gate: All 4 sources checked
│
├── LAYER 2: RELEVANCE SCORING
│   └── Gate: All context scored, ranked
│
├── LAYER 3: COMPRESSION
│   └── Gate: Under 2k tokens
│
└── LAYER 4: INJECTION FORMAT
    └── Gate: T0-ready output
```

## Key Architectural Decisions

1. **Dynamic Synthesis (not static retrieval)**
   - On-demand trigger + automatic triggers
   - Real-time collection and scoring
   - T0 direct injection (stream, not file)

2. **4-Layer Pipeline**
   - Collection → Scoring → Compression → Injection
   - Each layer enforces specific requirements
   - Cannot advance without completing layer

3. **Multiple Triggers**
   - Manual: Agent calls synthesize_context
   - Gate: Moving between PLAN/BUILD/TEST/VERIFY
   - Error: Tool execution fails
   - Threshold: 70% tokens
   - Stale: No progress in 10 messages

4. **Token Budget: <2k**
   - Large enough for useful context
   - Small enough to not overwhelm
   - Decision points preserved

## State Machine

```typescript
enum SynthesisLayer {
  LAYER_1 = 1,  // Collection
  LAYER_2 = 2,  // Scoring
  LAYER_3 = 3,  // Compression
  LAYER_4 = 4,  // Injection
  COMPLETE = 5
}
```

## Scoring Formula

```
Final Score = (Urgency × 0.6) + (Importance × 0.4)
```