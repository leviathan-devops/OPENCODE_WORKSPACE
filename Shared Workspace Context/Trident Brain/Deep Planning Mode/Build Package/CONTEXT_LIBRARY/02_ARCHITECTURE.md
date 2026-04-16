# Architecture - Deep Planning Mode

## High-Level Design

```
DEEP PLANNING MODE
│
├── LAYER 1: INITIAL PLAN
│   └── Gate: Surface understanding + first principles
│
├── LAYER 2: DETAILED WORKFLOW
│   └── Gate: Component decomposition + dependencies
│
└── LAYER 3: CONTEXT LIBRARY
    └── Gate: Injectable reasoning chain
```

## Key Architectural Decisions

1. **Pure Reasoning Architecture**
   - No execution tools (write only)
   - Full read access for synthesis
   - Separates planning from implementation

2. **Mechanical Gate Enforcement**
   - Cannot advance without structural requirements
   - Each layer has explicit "Cannot advance until..."
   - Guards against shallow reasoning

3. **Iteration for Depth**
   - V1.0 → V1.1 → V1.2 deepens SAME layer
   - Only moves to next gate after verification
   - Prevents skipping and shallow output

4. **Injectable Output**
   - Markdown artifacts designed for other agents
   - No ambiguity, no missing pieces
   - Complete context library format

## State Machine

```typescript
enum TridentLayer {
  LAYER_1 = 1,
  LAYER_2 = 2,
  LAYER_3 = 3,
  COMPLETE = 4
}

interface TridentState {
  currentLayer: TridentLayer;
  iteration: string;        // V1.0, V1.1, V1.2...
  layerAttempts: number;    // Failures at current layer
  artifacts: Map<string, string>;
}
```

## Layer Dependencies

- Layer 1 → Layer 2: Requires surface understanding + 3+ first principles
- Layer 2 → Layer 3: Requires 5+ components + dependency map
- Layer 3 → COMPLETE: Requires injectable context library