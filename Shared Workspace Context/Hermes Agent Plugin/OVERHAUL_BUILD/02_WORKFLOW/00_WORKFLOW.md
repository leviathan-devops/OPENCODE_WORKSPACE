# LAYER 2: DETAILED WORKFLOW — Hermes Agent Plugin v3 Full Overhaul

**Version:** v3.0  
**Agent:** Kraken Orchestrator  
**Date:** 2026-04-14  

---

## High-Level Decomposition

The overhaul is decomposed into 7 sequential phases:

1. **Foundation Phase** — Fix broken tools, rebuild dist, establish verify-first build discipline
2. **Hook Verification Phase** — Mechanical verification of all 29 hooks in real OpenCode session
3. **Delegation Chain Phase** — Verify hermes→analyst→builder→reviewer chain fires correctly
4. **State Machine Phase** — Verify 6-phase transitions with phase_complete + disk persistence
5. **Memory System Phase** — Verify 2nd-brain recall/remember/context injection across sessions
6. **Integration Stress Phase** — Full TDD cycle + multi-turn session + no regressions
7. **Container Ship Phase** — Docker TUI replica test, SHIP gate verification

**Critical path:** Phase 1 (Foundation) must complete before all subsequent phases. Within Phase 1, the build command discipline (`bun build.ts`) is the critical path bottleneck — previous builds failed because dist was never rebuilt after source fixes.

---

## Critical Path

```
bun build.ts (CRITICAL BOTTLENECK)
├── Previous failure: wrong command (`bun build dist/index.ts`) caused 3 months of broken builds
├── New discipline: verify dist mtime > all source mtimes after every build
└── CI gate: build fails if dist/index.js mtime <= any src/**/*.ts mtime
```

---

## Key Milestones

| Milestone | Gate | Criteria |
|-----------|------|----------|
| M1: Broken tools fixed | Build gate | sast_scan, imports, symbols, grill return valid output |
| M2: Dist rebuilt with guard fix | Build gate | dist mtime > src mtime AND brainstorm gate check in dist |
| M3: Hook verification complete | Test gate | 29/29 hooks have firing evidence in Trident log |
| M4: Delegation chain verified | Test gate | analyst→builder→reviewer chain fires with output |
| M5: Phase state machine verified | Test gate | All 7 transitions work, persistence survives hot-reload |
| M6: Memory system verified | Test gate | hermes_recall returns prior session context |
| M7: No regressions | Integration gate | Spider coder can write files while Hermes loaded |
| M8: Container ship | SHIP gate | docker exec test passes, TUI replica works |

---

## Phase 1: Foundation

### Purpose
Fix broken tools, rebuild dist with brainstorm-gate guard, establish verify-first build discipline, create integration test harness.

### Components

#### C1: Tool Fixes
| Tool | Fix | Verification |
|------|-----|--------------|
| `sast_scan` | Bundle `eslint-plugin-security` locally, use npx-like spawn with explicit path | Run against hermes-agent source, must return findings |
| `imports` | Prefix path with `context.directory ?? context.worktree ?? process.cwd()` | Run against src/index.ts, must return import list |
| `symbols` | Same path fix + verify Python regex works | Run against Python file, must return def/class |
| `grill` | Verify actual fix state; rebuild if needed | Run against hermes-agent src, must return vulnerability list |

#### C2: Brainstorm Gate Guard
**Fix:** Add `.hermes/` directory existence check to `src/hooks/brainstorm-gate.ts`
```typescript
// BEFORE (broken — fires for ALL agents):
if (_currentPhase === PHASES.IDLE || _currentPhase === PHASES.ANALYZE) {
  if (hasCodeBlock(message)) { appendHARDGATE(message); }
}

// AFTER (fixed — fires only for Hermes sessions):
if (!existsSync(resolve(context.directory, ".hermes"))) return; // Guard
if (_currentPhase === PHASES.IDLE || _currentPhase === PHASES.ANALYZE) {
  if (hasCodeBlock(message)) { appendHARDGATE(message); }
}
```

#### C3: Build Verification Discipline
- After every `bun build.ts`, run: `stat -c '%Y' dist/index.js src/**/*.ts | sort -n | tail -1` — dist must be newest
- Create `BUILD_VERIFY.sh` script that asserts dist freshness as CI gate
- No source change may be committed without dist rebuild verification

#### C4: Integration Test Harness
New test file `test-real-session.ts` that:
1. Loads hermes-agent dist into actual OpenCode runtime (NOT mock context)
2. Spawns a real agent session
3. Fires each hook via actual tool calls
4. Captures hook firing evidence (log lines, state changes)
5. Compares against expected behavior

### Sequence
```
1.1 Fix sast_scan → local ESLint plugin bundling
1.2 Fix imports/symbols path resolution
1.3 Verify grill actual state (source vs dist)
1.4 Apply brainstorm-gate .hermes/ guard fix to source
1.5 Run bun build.ts
1.6 Verify dist mtime > all source mtimes
1.7 Run BUILD_VERIFY.sh CI gate
1.8 Create test-real-session.ts harness
1.9 Run E2E suite → must maintain 144/147 (98%)
```

### Failure Modes
| Mode | Probability | Mitigation |
|------|-------------|------------|
| sast_scan fix still fails | MEDIUM | Fall back to `npx eslint --plugin security` with timeout + fallback |
| grill fix introduces new bug | MEDIUM | Run full E2E suite after grill changes |
| dist mtime check false positive (NFS cache) | LOW | Add content hash verification |
| Integration harness fails to load hermes-agent | MEDIUM | Debug with shark-alpha-1 agent |

---

## Phase 2: Hook Verification

### Purpose
Mechanical verification of all 29 hooks firing in a real OpenCode session. Every hook that exists on paper but has never fired in a real session is a risk.

### Hook Verification Matrix
| Hook | Event | Verification Method | Expected Evidence |
|------|-------|---------------------|-------------------|
| brainstorm-gate | messages.transform | Say "build a login" → must ask questions, NOT code | No toolCalls in first 3 turns |
| plan-validator | messages.transform | Send plan with TBD placeholder → must reject | Error message returned |
| tdd-enforcer | tool.execute.before | Run build without test file → must block | Blocked tool error |
| delegation-gate | tool.execute.before | Coder attempts write without reviewer → must block | Blocked error |
| phase-monitor | tool.execute.after | Run phase_complete → must advance state | State change logged |
| strict-write-discipline | messages.transform | Send "cached context says X" → must verify before acting | Verification log |
| adversarial-check | messages.transform | Send slop/bypass message → must detect | Flagged message |
| anti-rationalization | messages.transform | Agent claims "looks good to me" → must challenge | Challenge message |
| self-review | tool.execute.after | Any agent self-approves → must detect | Self-review flag |
| debugging-spiral | tool.execute.after | 5 identical failed calls → must detect spiral | Spiral detected log |
| knowledge-injector | tool.execute.after | Any tool call → must inject 2nd-brain context | Context in next turn |
| system-enhancer | chat.system.transform | Any session start → must inject HERMES.md | HERMES.md content |
| knowledge-curator | tool.execute.after | Phase completes → must extract learnings | Learnings extracted |
| snapshot-writer | tool.execute.after | Any tool call → must write session snapshot | Snapshot file created |
| compaction | session.compacting | 70% token budget → must trigger compaction | Compaction log |
| guardrails | tool.execute.before | Exceed per-agent resource limit → must block | Resource limit error |
| scope-guard | tool.execute.before | Access file outside workspace → must block | Permission denied |
| activity | tool.execute.before | Any tool call → must log activity | Activity logged |
| delegation-ledger | tool.execute.after | Delegation occurs → must record | Delegation record |
| drift-verifier-hook | tool.execute.after | Phase claim made → must verify vs evidence | Verification result |
| adversarial-detector | messages.transform | Bypass pattern detected → must flag | Pattern flagged |
| ripple-check | tool.execute.after | Change made → must check cascading impacts | Impact report |
| supervisor-ingest | tool.execute.after | Any tool call → must feed supervisor | Supervisor data |
| complexity-routing | chat.params | Complex task → must route to Full model | Model flag set |
| framework-pack | chat.system.transform | Next.js project → must inject framework pack | Framework context |
| intent-marker | messages.transform | Inter-agent message → must use 4-marker format | Markers present |
| context-budget | chat.params | Near token limit → must warn | Budget warning |
| hermes-command | command.execute.before | /Hermes command → must route correctly | Command output |
| supervisor-loop-hook | tool.execute.after | Supervisor loop → must feed auditor | Loop data |

### Sequence
```
2.1 Create hook-verification-session.ts (spawns real session, fires each hook)
2.2 Run brainstorm-gate verification → log evidence
2.3 Run plan-validator verification → log evidence
2.4 Run tdd-enforcer verification → log evidence
2.5 Run delegation-gate verification → log evidence
2.6 Run phase-monitor verification → log evidence
2.7 Run remaining 24 hooks → log evidence
2.8 Consolidate all evidence into HOOK_VERIFICATION_LOG.md
2.9 For any hook with no evidence: debug with shark-gamma-1 agent
```

### Failure Modes
| Mode | Probability | Mitigation |
|------|-------------|------------|
| Hook fires but evidence not captured | HIGH | Add explicit evidence logging to each hook |
| Hook silently no-ops (guard condition not met) | MEDIUM | Add guard trace logging |
| Hook fires in wrong order (conflicts with Spider) | LOW | Check hook execution order in opencode.json |
| 3+ hooks unverified after Phase 2 | MEDIUM | Escalate to architect review, may need to disable |

---

## Phase 3: Delegation Chain

### Purpose
Verify the hermes→analyst→builder→reviewer delegation chain fires correctly. This is the primary value proposition — not individual agents, but the chain.

### Sequence
```
3.1 Create delegation-test-session.ts
3.2 User says "implement user authentication"
3.3 Hermes analyzes → delegates to analyst
3.4 Analyst returns specs → hermes delegates to builder
3.5 Builder runs TDD cycle → hermes delegates to reviewer
3.6 Reviewer approves → phase advances to complete
3.7 Verify full output chain: intent → specs → test-first-code → review
```

### Failure Modes
| Mode | Probability | Mitigation |
|------|-------------|------------|
| Analyst never receives delegation | HIGH | Check delegate_task tool output |
| Builder blocks on TDD but no test file created | HIGH | Pre-create test fixture |
| Reviewer self-approves (self-review hook fails) | LOW | Self-review hook must fire first |
| Hermes never receives output back from subagent | MEDIUM | Check session state after each delegation |
| Chain breaks at phase 2 (plan) | MEDIUM | Ensure plan-validator passes before build |

---

## Phase 4: State Machine

### Purpose
Verify all 7 phase transitions work and phase state persists across hot-reload.

### State Machine Transitions
```
idle → analyze (user approves brainstorm)
analyze → plan (plan tool called)
plan → build (build tool called)
build → review (reviewer approves OR debug called)
review → debug (build fails OR review rejects)
review → complete (reviewer fully approves)
debug → build (fix implemented)
debug → review (fixed code ready)
```

### Sequence
```
4.1 Verify idle → analyze: Create session, call phase_complete("analyze"), verify state
4.2 Verify analyze → plan: Call save_plan + phase_complete("plan"), verify state
4.3 Verify plan → build: Call phase_complete("build"), verify state
4.4 Verify build → review: Call phase_complete("review"), verify state
4.5 Verify review → debug: Call phase_complete("debug"), verify state
4.6 Verify debug → build: Call phase_complete("build"), verify state
4.7 Verify review → complete: Call phase_complete("complete"), verify state
4.8 Hot-reload test: Kill OpenCode, restart, verify .hermes/phase.json persists
4.9 Concurrent session test: Two sessions, different phases, no state bleed
```

---

## Phase 5: Memory System

### Purpose
Verify 2nd-brain memory (hermes_recall/remember/context) persists across sessions.

### Sequence
```
5.1 Session A: hermes_remember("test-key", "test-value")
5.2 End Session A
5.3 Session B: hermes_recall("test-key") → must return "test-value"
5.4 Session B: hermes_context("topic") → must inject relevant memory
5.5 Session B: Work on task → knowledge-curator extracts learning
5.6 Session C: hermes_recall with same topic → must return extracted learning
5.7 Compaction test: Fill context to 70% → compaction hook fires → context compressed
```

---

## Phase 6: Integration Stress

### Purpose
Full TDD cycle + multi-turn session + regression testing.

### Sequence
```
6.1 Full TDD cycle test: RED → GREEN → REFACTOR (all via delegation, not direct)
6.2 Multi-turn session: 20+ turns, verify 2nd-brain injection each turn
6.3 Parallel delegation: Analyst + Explorer run simultaneously
6.4 Graceful degradation: Intentional tool failure → debugging spiral fires
6.5 No Spider regression: Spider coder writes files while Hermes loaded
6.6 No Manta regression: Manta agent tools work while Hermes loaded
6.7 No Shark regression: Shark agent status/checkpoint works while Hermes loaded
6.8 Full E2E suite: 147/147 tests passing (100%)
```

---

## Phase 7: Container Ship

### Purpose
Docker TUI replica test per AGENTS.md Shark protocol. Container testing uses Docker sandbox — local device files NOT affected.

### Container Test Sequence
```bash
# 1. Build container with Hermes loaded
docker build -t hermes-test -f Dockerfile.hermes .

# 2. Run TUI test replica
docker run --rm -it hermes-test opencode --attach

# 3. Automated TUI test (scripted interaction)
docker exec hermes-test sh -c "
  echo 'implement hello world' | opencode --attach --agent hermes;
  cat /tmp/hermes-test-output.txt;
"

# 4. Verify TUI replica passes SHIP gate
# - Hermes appears in agent toggle
# - brainstorm gate fires for Hermes session
# - code block ONLY appears after user approves design
# - /Hermes commands route correctly
# - session persists after detach/re-attach
```

### SHIP Gate Criteria
| Criteria | Pass Condition |
|----------|----------------|
| Agent toggle | `hermes` appears in OpenCode agent dropdown |
| Brainstorm gate | "build login" → asks questions, no code block |
| Plan gate | Plan with TBD → rejected with specific error |
| TDD gate | Build without test → blocked with specific error |
| /Hermes routing | `/Hermes status` → returns valid JSON |
| Phase persistence | Session resume → same phase as before detach |
| Memory persistence | Recall → prior session data returned |
| No codegen bypass | hermes cannot generate code without going through TDD |

---

## Dependency Map

```
Phase 1 (Foundation)
├── C1 Tool Fixes
│   ├── sast_scan fix ──────────────────────────────────────────────────┐
│   ├── imports/symbols fix ───────────────────────────────────────────┐ │
│   └── grill verification ───────────────────────────────────────────┘ │
├── C2 Brainstorm Gate Guard ─────────────────────────────────────────────┐│
├── C3 Build Verification ───────────────────────────────────────────────┘│
└── C4 Integration Harness ────────────────────────────────────────────────┘
                               │
                               ▼
Phase 2 (Hook Verification) ───────────────────────────────────────────────┐
                               │                                             │
                               ▼                                             │
Phase 3 (Delegation Chain) ────────────────────────────────────────────────┘
                               │
                               ▼
Phase 4 (State Machine) ───────────────────────────────────────────────────┐
                               │                                              │
                               ▼                                              │
Phase 5 (Memory System) ───────────────────────────────────────────────────┘
                               │
                               ▼
Phase 6 (Integration Stress) ─────────────────────────────────────────────┐
                               │                                              │
                               ▼                                              │
Phase 7 (Container Ship) ──────────────────────────────────────────────────┘
```

---

## Verification Approach

### Mechanical Verification (Trident Principle)
Every phase has explicit pass/fail criteria BEFORE starting. No "looks good" verification — every claim backed by evidence.

### Evidence Types Required
| Evidence | Example |
|----------|---------|
| Log output | `console.log("brainstorm-gate fired: ", message)` |
| State change | `.hermes/phase.json` content before/after |
| File output | `test fixture created`, `snapshot written` |
| Error message | Blocked tool returns specific error string |
| Network trace | `hermes_recall` returns prior session data |

### Verification Sequence
1. **Pre-flight:** Verify build is clean (`bun build.ts` exits 0)
2. **Per-component:** Each component verified BEFORE moving to next
3. **Per-phase:** Phase gate requires all component evidence
4. **Final pass:** Full integration run with all phases
5. **Container verify:** SHIP gate in Docker sandbox
