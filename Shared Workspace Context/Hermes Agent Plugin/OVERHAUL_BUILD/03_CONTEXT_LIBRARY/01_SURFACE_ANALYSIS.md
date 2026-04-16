# Surface Analysis — What Was Broken and Why

## Problem Statement

The Hermes Agent Plugin v2.3.5 was built to 94% completion by code count but was **operationally broken** — it had never been tested in a real multi-turn OpenCode session, only in E2E test isolation. It was removed from opencode.json after a bug caused it to block Spider Agent's coder subagent.

**Three categories of brokenness:**

### Category 1: Bugs That Produce Wrong Output (3 tools)

| Tool | Bug | Symptom |
|------|-----|---------|
| `sast_scan` | `npm error could not determine executable to run` | No output, always fails |
| `imports` | Path resolution fails with real `context.worktree` | Empty output |
| `symbols` | Same path resolution failure + Python regex untested | Incomplete output |

These tools compile correctly and return something — but the output is wrong. E2E tests pass because they use mock paths that don't trigger the bug.

### Category 2: Cross-Agent Interference (1 critical bug)

**Brainstorm gate blocked ALL agents** (not just Hermes) when `.hermes/` directory doesn't exist. This broke Spider Agent's coder subagent's ability to write files. Root cause: no agent identity guard on the hook.

**Evidence:** DEBUG-HERMES-BRAINSTORM-GATE-BLOCKS-SPIDER-CODER-2026-04-08.md (full forensic)

**Fix applied (not yet in dist):**
```typescript
// Added to src/hooks/brainstorm-gate.ts
if (!existsSync(resolve(context.directory, ".hermes"))) return; // Guard
```

But v2.3.5 dist was built 2026-04-07, before the fix was applied 2026-04-08.

### Category 3: Verification Theater (27 of 29 hooks)

E2E tests prove code parses correctly, not that hooks fire in actual OpenCode sessions. All 27 verified hooks were verified by **existence**, not by **firing evidence**. Key unverified hooks:

| Hook | Why It Matters | Risk If Broken |
|------|---------------|----------------|
| `delegation-gate` | Blocks coder without reviewer approval | Coder bypasses review |
| `tdd-enforcer` | Blocks build without test | TDD iron law violated |
| `brainstorm-gate` | Blocks code until design approved | Agents jump straight to code |
| `self-review` | Blocks self-approval | Agent rationalizes own work |
| `phase-monitor` | Tracks phase transitions | Phase state corrupted |
| `knowledge-injector` | Injects 2nd-brain every turn | No memory across turns |
| `supervisor-loop-hook` | Graeme's 3-agent loop | No self-improvement |

---

## What It Should Do (Spec vs. Reality)

| Spec Promise | v2.3.5 Reality | Gap |
|--------------|----------------|-----|
| 19 agents registered | ✅ All 19 in dist | Verified by code existence |
| 29 hooks wired | ✅ All 29 in dist | **0 verified firing in real session** |
| 28 tools functional | ⚠️ 3 broken, 12 unverified | 3 produce wrong output |
| 6-phase state machine | ✅ State transitions work | Persistence unverified after hot-reload |
| Phase persistence to `.hermes/phase.json` | ✅ Built | Never tested with real hot-reload |
| 2nd-brain memory | ✅ recall/remember built | Never verified returns prior session data |
| Graeme's supervisor loop | ✅ Built | Never tested end-to-end |
| Thread/Fork/Orchestration (v2.5) | ❌ Never built | Entirely planned, no code |

---

## Root Cause Analysis

**Why did this happen?**

1. **Build command confusion** — `bun build dist/index.ts` instead of `bun build.ts` meant dist was never rebuilt with fixes for 3 months. E2E tests ran against stale code.

2. **E2E test isolation** — Tests run tools with mock context, not real OpenCode. Tools that work in mock context may fail in real sessions because real `context.worktree` values differ.

3. **Hook verification neglected** — Verifying hooks firing in real sessions requires spawning actual agent sessions, firing tools, capturing logs. Much harder than running `bun test-e2e.ts`. No one did it.

4. **No integration test harness** — There was no `test-real-session.ts` that could load the plugin into actual OpenCode and fire hooks. The gap was structural.

5. **Documentation conflicts** — BUILD_REPORT.md and BUILD_LOG.md contradicted each other on grill fix status. When fixing, always verify against actual source/dist.

---

## Scope

### In Scope (This Overhaul)
- Fix sast_scan, imports, symbols, grill
- Incorporate brainstorm-gate guard fix
- Rebuild dist with all fixes
- Create integration test harness
- Verify all 29 hooks in real sessions
- Verify delegation chain
- Verify phase state machine + persistence
- Verify 2nd-brain memory across sessions
- Container TUI replica test
- Full E2E suite (147/147)
- No regressions to Spider/Manta/Shark

### Out of Scope
- v2.5 Thread/Fork/Orchestration (deferred to future build)
- Full/Lite model tiering verification (deferred — requires actual model provider)
- Permission cascade verification (deferred — scope-guard hook unverified, requires real file access testing)
- Compaction trigger verification (deferred — requires real token counting)
