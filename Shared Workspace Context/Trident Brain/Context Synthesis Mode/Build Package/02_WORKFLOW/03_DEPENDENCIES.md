# DEPENDENCY MAP - Building Context Synthesis Mode

## Layer Dependencies

- Trigger → Layer 1: Must trigger before collecting
- Layer 1 → Layer 2: Must collect before scoring
- Layer 2 → Layer 3: Must score before compressing
- Layer 3 → Layer 4: Must compress before formatting

## Context Source Priority

T1 (Session) → T2 (Knowledge) → T3 (Files) → T4 (Tools)

Higher priority sources should be weighted more in final synthesis.

## Key Dependencies

| From | To | Nature |
|------|----|--------|
| Trigger | Collection | Signal to start |
| Collection | Scoring | Raw context input |
| Scoring | Compression | Ranked priorities |
| Compression | Injection | Synthesized content |