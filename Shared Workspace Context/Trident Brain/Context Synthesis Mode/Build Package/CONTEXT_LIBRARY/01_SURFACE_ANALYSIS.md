# Surface Analysis - Context Synthesis Mode

## Problem Statement

Context Synthesis Mode solves the problem of context overflow and stale context in agent systems. It consolidates T1/T2/T3/T4 context into a <2k token injection stream.

## What Context Synthesis Mode Is

A dynamically triggerable context synthesis process that:
- Collects T1 (session), T2 (knowledge), T3 (files), T4 (tools) context
- Scores by urgency × importance
- Compresses to <2k tokens
- Injects as T0-ready thought stream

## What Context Synthesis Mode Is NOT

- NOT a memory system (dynamic synthesis, not static retrieval)
- NOT a compaction system (on-demand, not auto at threshold)
- NOT an implementation system (reasoning only)

## Scope

### In Scope
- Layer 1: Context collection from all sources
- Layer 2: Relevance scoring (urgency × importance)
- Layer 3: Compression to <2k tokens
- Layer 4: T0-ready injection format
- Multiple triggers (manual, gate, error, threshold, stale)

### Out of Scope
- Persisting context (stateless synthesis)
- Compaction itself (Kraken handles this)
- Direct memory access (Hermes handles this)

## Success Criteria

1. Synthesizes all 4 context types (T1-T4)
2. Produces <2k token output
3. Prioritizes by relevance score
4. Injects directly into thought stream

## Open Questions

1. Should synthesis be cached between calls?
2. How to handle conflicting context from different sources?
3. What's the optimal urgency/importance weight ratio?