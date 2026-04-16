# WORKFLOW OVERVIEW: Building Context Synthesis Mode

## High-Level Decomposition

The build has 4 main components (one per layer):
1. **Context Collector** - Gathers T1-T4 context
2. **Relevance Scorer** - Scores by urgency × importance
3. **Compression Engine** - Synthesizes to <2k
4. **Injection Formatter** - Produces T0-ready output

Plus:
- **Trigger Manager** - Detects synthesis need
- **Token Budget Enforcer** - Hard 2k limit
- **State Manager** - Layer progression tracking

## Critical Path

Trigger → Collection → Scoring → Compression → Injection

## Key Milestones

1. **M1:** All 4 context source collectors implemented
2. **M2:** Scoring algorithm finalized
3. **M3:** Compression respects decision points
4. **M4:** T0 injection format verified
5. **M5:** Integration with Trident Brain host