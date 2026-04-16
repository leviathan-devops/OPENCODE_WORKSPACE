# Data Flow - Deep Planning Mode

## Entry Points

1. **User Request** → `/trident plan <task>` or similar trigger
2. **Mode Activation** → Initialize state, set Layer 1

## Processing Pipeline

```
User Input
    ↓
Layer 1: Initial Plan
    ├── Surface Understanding
    ├── First Principles (3+)
    ├── Constraints (3+)
    ├── Success Criteria
    ├── Open Questions
    └── Direction
    ↓ Gate Validation
Layer 2: Detailed Workflow
    ├── Components (5+)
    ├── Sequence
    ├── Dependencies (3+)
    ├── Failure Modes (3+)
    └── Verification Strategy
    ↓ Gate Validation
Layer 3: Context Library
    ├── 00_INDEX.md
    ├── 01_SURFACE_ANALYSIS.md
    ├── 02_ARCHITECTURE.md
    ├── 03_COMPONENTS.md
    ├── 04_DATA_FLOW.md
    ├── 05_INTERFACES.md
    ├── 06_STATE_MANAGEMENT.md
    ├── 07_ERROR_HANDLING.md
    ├── 08_TESTING.md
    ├── 09_DEPLOYMENT.md
    └── 10_MENTAL_MODEL.md
    ↓ Gate Validation
COMPLETE: Injectable Artifact
```

## Iteration Flow

```
V1.0: Layer 1 → fails verification
V1.1: Layer 1 (deeper) → fails verification
V1.2: Layer 2 → succeeds, move to Layer 3
...
```

## Storage

- **Artifacts:** In-memory Map during session
- **State:** Serialized for cross-session continuation
- **Output:** Markdown files written via write tool