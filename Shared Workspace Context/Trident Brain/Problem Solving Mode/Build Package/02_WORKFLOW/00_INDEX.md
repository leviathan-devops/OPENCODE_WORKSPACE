# WORKFLOW OVERVIEW: Building Problem Solving Mode

## High-Level Decomposition

The build has 6 main components (one per layer):
1. **Assumption Gate** - Validates Layer 1 output
2. **Action Gate** - Validates Layer 2 output
3. **Evidence Gate** - Validates Layer 3 output
4. **Gap Gate** - Validates Layer 4 output
5. **Pattern Gate** - Validates Layer 5 output
6. **Verification Gate** - Validates Layer 6 output

Plus:
- **State Machine** - Tracks iteration and layer progress
- **Anti-Derailment Engine** - Detects 14 failure categories
- **Debugging Chain Generator** - Produces injectable output

## Critical Path

Assumption Gate → Evidence Gate → Gap Gate → Verification Gate

## Key Milestones

1. **M1:** All 6 layer templates created
2. **M2:** Anti-derailment engine covers 14 categories
3. **M3:** State machine handles iteration correctly
4. **M4:** Debugging chain generator produces injectable output
5. **M5:** Integration with Trident Brain host