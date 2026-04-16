# Surface Analysis - Problem Solving Mode

## Problem Statement

Problem Solving Mode solves the problem of shallow, evidence-free debugging in agent systems. It forces evidence-based iteration through mechanical gate enforcement.

## What Problem Solving Mode Is

A pure reasoning/analysis agent that produces deeply structured debugging and root cause analysis through 6 mechanical gates. It does NOT implement fixes - it only analyzes and produces evidence.

## What Problem Solving Mode Is NOT

- NOT a fix implementation system (no edit, no write for code)
- NOT a guessing system (requires evidence, not intuition)
- NOT a passive analyzer (forces active evidence collection)

## Scope

### In Scope
- Layer 1-6: Evidence-based debugging process
- Mechanical gate enforcement between layers
- Iteration loops for deepening root cause analysis
- Injectable debugging chain output

### Out of Scope
- Code implementation (delegated to execution agents)
- Build/test execution (handled by CI/CD)
- Runtime fixes (stateless analysis only)

## Success Criteria

1. Forces explicit assumption before action
2. Requires raw evidence, not descriptions
3. Cannot claim success without proof
4. Produces injectable debugging chain

## Open Questions

1. How to handle problems that need multiple simultaneous hypotheses?
2. Should layer templates support custom evidence types?
3. How to verify the evidence is actually external (not self-referencing)?