# Data Flow - Problem Solving Mode

## Entry Points

1. **User Request** → `/trident solve <problem>` or similar trigger
2. **Mode Activation** → Initialize state, set Layer 1

## Processing Pipeline

```
User Problem
    ↓
Layer 1: Assumption Statement
    ├── Explicit assumption
    ├── Reasoning chain
    ├── Success criteria
    └── Confirmation/disproof criteria
    ↓ Gate Validation
Layer 2: Action with Prediction
    ├── Exact command
    ├── Expected output
    └── Environment state
    ↓ Gate Validation
Layer 3: Observation & Evidence
    ├── Raw evidence (copied, not described)
    ├── Logs checked
    └── Expected vs Actual comparison
    ↓ Gate Validation
Layer 4: Gap Analysis & Adjustment
    ├── Gap analysis ("Expected X, got Y, therefore Z")
    ├── Updated hypothesis
    └── Next action tied to insight
    ↓ Gate Validation
Layer 5: Meta-Cognitive Reflection
    ├── What I should have done differently
    ├── Pattern extracted
    └── Systemic issue identified
    ↓ Gate Validation
Layer 6: Verification & Confirmation
    ├── Target environment execution
    ├── Behavior matches requirement
    └── No regressions
    ↓ Gate Validation
COMPLETE: Injectable Debugging Chain
```

## Iteration Flow

```
V1.0: Layer 1 → Layer 2 → Layer 3 → Gap found
V1.1: Layer 1 (new assumption) → Layer 2 → Layer 3 → Deeper gap
V1.2: Layer 4 (analyze accumulated gaps) → Layer 5 → Layer 6
...
```

## Storage

- **Evidence:** In-memory during session, serialized for audit
- **Iterations:** Complete chain preserved
- **Output:** Markdown debugging chain via write tool