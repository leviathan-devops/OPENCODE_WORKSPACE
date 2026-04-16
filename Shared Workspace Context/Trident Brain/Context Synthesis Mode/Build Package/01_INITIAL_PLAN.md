# INITIAL PLAN: Building Context Synthesis Mode

## Surface Understanding

Context Synthesis Mode needs to dynamically collect, score, compress, and inject context. It should work alongside Kraken (auto compaction) and Hermes (static retrieval) but provide on-demand synthesis with real-time scoring.

## First Principles

1. **Dynamic Over Static** - On-demand synthesis, not scheduled retrieval
2. **Score-Based Priority** - Urgency × Importance determines what matters
3. **Hard Token Limit** - 2k max forces prioritization

## Constraints

- Must handle all 4 context types (T1 session, T2 knowledge, T3 files, T4 tools)
- Must score consistently (urgency × 0.6 + importance × 0.4)
- Must preserve decision points even under compression
- Must inject as T0-ready stream, not file

## Success Criteria

1. Collects from all 4 sources or notes unavailability
2. Scores all items consistently
3. Outputs <2k tokens with decision points preserved
4. Triggers work (manual, gate, error, threshold, stale)

## Open Questions

1. What's the optimal scoring formula weight ratio?
2. Should certain source types be weighted higher?
3. How to detect truly stale context vs recently stale?

## Direction

Following Kraken's token budget + Hermes's tier structure:
1. Collect from T1-T4 dynamically
2. Score with urgency × importance
3. Compress preserving decision points
4. Inject as T0 stream