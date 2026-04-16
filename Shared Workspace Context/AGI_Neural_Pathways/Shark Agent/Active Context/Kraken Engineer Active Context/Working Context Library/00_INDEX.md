# KRAKEN ENGINEER — WORKING CONTEXT

## Purpose
This directory contains the active working context for the Kraken Engineer executing the shark-agent-v4.8.3 firewall build.

## Context Files

| File | Purpose |
|------|---------|
| `01_ARCHITECTURE_OVERVIEW.md` | Complete system architecture (L0-L8 layers) |
| `02_CURRENT_STATE.md` | What works, what's missing, build status |
| `03_PATTERNS_REFERENCE.md` | All 170+ patterns to implement |
| `04_IMPLEMENTATION_GUIDE.md` | Step-by-step implementation with code examples |
| `05_TESTING_WORKFLOWS.md` | How testing works, container testing, evidence collection |
| `06_V4.7_HOTFIX_INTEGRATION.md` | Critical micro-architecture to preserve |
| `07_BUILD_PLAN_PARALLEL.md` | Parallel execution plan (when tools are fixed) |
| `08_SUCCESS_CRITERIA.md` | Ship gate requirements, verification |
| `09_FULL_LAYER_BUILD_SPEC.md` | Complete L0-L8 specifications with code |
| `10_COMPLETE_BUILD_PLAN.md` | Phase-by-phase build workflow |
| `11_INCIDENT_ANALYSIS.md` | Lessons from v4.8.3 failures + golden data |

## Key Principles

1. **Mechanical Enforcement > Text Matching** — 90% mechanical, 10% text
2. **toolArgs ONLY** — Never check agentMessage or output
3. **Throw to Block** — console.log is advisory, throw is blocking
4. **Preserve v4.7-hotfix-v3** — Memory optimizations, session cleanup
5. **Evidence Requirements** — L5.2/L5.4 require ContainerTestResult.json

## Build Target

**Project:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/`  
**Checkpoint 2 MD5:** `97842984a12db0bb3d992a761f8fef23`  
**Status:** Brain init working, L5-L8 patterns missing

## Critical Rules (From Incident Analysis)

### NEVER Block /tmp Builds
```
ALLOWED: bun build --outdir /tmp/shark-build
BLOCKED: bun build --outdir ./dist
```

### buildTextToCheck ONLY Uses toolArgs
```typescript
// WRONG - causes false positives
return agentMessage + toolArgs + output;

// CORRECT - only what agent is executing
return JSON.stringify(toolArgs);
```

### Cross-Agent Tools Blocked by NAME Not Text
```typescript
// CORRECT - mechanical check
if (CROSS_AGENT_TOOLS.has(tool)) { block(); }
```

### /tmp Is Always Safe
Builds to `/tmp` are isolated testing environments and should NEVER be blocked.

## Parallel Execution (When Fixed)

The following parallel task tools are currently BROKEN:
- `spawn_cluster_task` — Cluster not found
- `run_parallel_tasks` — Shim not implemented
- `run_subagent_task` — CLI argument parsing error

**See:** `DEBUG LOGS/KRAKEN_PARALLEL_EXECUTION_FAILURE_2026-04-11.md`

## Build Plan Summary

### Phase 1: L0-L4 (shark-alpha-1, shark-alpha-2)
- L0: Identity wall (verify existing)
- L1: Theatrical patterns (18)
- L2: Fake test patterns (13)
- L3: Source inspection patterns (12)
- L4: Wrong container patterns (5)

### Phase 2: L5.1-L5.5 (shark-beta-1)
- L5.1: Host fallback (13)
- L5.2: Success claim + evidence (16)
- L5.3: Model restriction (15)
- L5.4: Mock/stub + evidence (12)
- L5.5: Simplification (11)

### Phase 3: L5.6-L5.10 (shark-beta-2)
- L5.6: Confusion pretense (12)
- L5.7: Scope creep + cross-agent (10)
- L5.8: Undermining (12)
- L5.9: Impatience (9)
- L5.10: Self-reference (12)

### Phase 4: L6-L8 + Checkpoint Guardian (shark-gamma-1)
- L6: Blocking local file protection
- L7: Verification gate evidence
- CheckpointGuardian class

### Phase 5: Integration + Testing
- Merge all patterns
- Container test
- Ship gate

## Sequential Fallback

If parallel tools remain broken, execute phases sequentially in same session.

## Last Updated

**2026-04-11** — Complete context library with incident analysis
