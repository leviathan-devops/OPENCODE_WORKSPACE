# SHARK AGENT V4 — BUILD CONTEXT LIBRARY (V1.1)

> **What This Is:** Context library for building Shark Agent V4 V1.1 from V1.0
> **Context Type:** build-instructions
> **Audience:** OpenCode agent executing the V1.1 rebuild

---

## What This Library Contains

This library tells a build agent **exactly what to do** to transform Shark Agent V4 from V1.0 (inert TypeScript with zero hook integration) to V1.1 (functional mechanical enforcement via OpenCode hooks).

## File Structure

```
build-context/
├── INDEX.md                        ← This file (entry point)
├── PURPOSE.md                      ← Build mission and constraints
├── MENTAL_MODEL.md                  ← T1: thinking process for the build
└── REFERENCE/
    ├── AUDIT.md                    ← V1.0 audit findings (source-level)
    ├── HOOKS_INTEGRATION.md       ← How to wire OpenCode hooks
    ├── FIX_SEQUENCE.md            ← Step-by-step build instructions
    ├── VERIFICATION.md            ← Pre-build and post-build checks
    ├── ITERATION_PROTOCOL.md     ← How to handle iteration (never overwrite)
    └── REFERENCE_FILES.md          ← Boilerplate file references
```

---

## V1.0 Audit Summary

V1.0 built **inert TypeScript**. The plugin returns `{ tool, config }` with no OpenCode hooks. All enforcement primitives (Guardian, GateManager, EvidenceCollector) exist as objects in memory but are **never called at runtime**.

**Critical failures:**
1. No `tool.execute.before` hook — Guardian never blocks dangerous commands
2. No `tool.execute.after` hook — EvidenceCollector never collects evidence
3. No `session.created` hook — No per-session initialization
4. No `session.compacting` hook — State dies on context compression
5. Evidence path uses `directory` (plugin install dir) instead of workspace
6. shark-macro concatenates 4 T1 prompts into one confused agent
7. `src/tools/shark-evidence.ts` uses `z` from zod but zod is not imported

---

## How to Use This Library

**Rule 1: NEVER OVERWRITE ORIGINAL FILES.**
Every edit must be to a NEW FILE with an iteration suffix (e.g., `index.v1.1.0.ts`).

**Rule 2: BUILD-ONLY AFTER VERIFICATION.**
Run verification checks before any build. Do not proceed if checks fail.

**Rule 3: USE THESE REFERENCE FILES IN ORDER.**
1. Start with `PURPOSE.md` to understand the mission
2. Read `REFERENCE/AUDIT.md` for exact V1.0 problems
3. Follow `REFERENCE/FIX_SEQUENCE.md` step by step
4. Run checks from `REFERENCE/VERIFICATION.md` before building
5. Follow `REFERENCE/ITERATION_PROTOCOL.md` for file management

---

## Quick Reference

| What | Where |
|------|-------|
| V1.0 source | `src/` |
| V1.0 backup (create this) | `../shark-agent-v1.0-backup/` |
| V4 boilerplate reference | `/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Agent-Factory-Edition/src/` |
| Boilerplate hooks | `src/hooks/tool-before-after.ts`, `src/hooks/chat-system-transform.ts` |
| Boilerplate state | `src/state.ts` |
| Context library | `shark-context/` (in plugin directory, deploy to workspace) |

---

*Context Library: Shark Agent V4 — V1.1 Build Instructions*
*Version: 1.0 — 2026-04-06*
