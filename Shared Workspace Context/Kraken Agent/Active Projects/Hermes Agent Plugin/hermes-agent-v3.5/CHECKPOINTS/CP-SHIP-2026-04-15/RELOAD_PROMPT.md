# Hermes Agent v3.5 — Reload Anchor Package

**Target:** `hermes-agent-v3.5/CHECKPOINTS/CP-SHIP-2026-04-15/`

---

## MISSION

Create a fully self-contained reload script that a vanilla OpenCode build agent can run with just `"reload this"` to install Hermes Agent v3.5 and get it working to the same level as the previous session.

---

## WHAT HERMES V3.5 IS

Hermes v3.5 is an OpenCode plugin providing:
- **33 hooks** (message transforms, tool before/after, session compacting)
- **19 agents** (hermes, analyst, builder, planner, tdd, reviewer, grill, ripple, drift-verifier, explorer, architect, debugger, supervisor, sme, test-engineer, docs, critic, memory)
- **40 tools** (fork-manager, episode-store, orchestration-engine, skill-registry, plus quality/security/verification)
- **11 orchestration skills** (/implement, /plan, /grill, /tdd, /verify, /debug, /brainstorm, /autopilot, /health, /remember, /recall)
- **2nd-brain memory** (hermes_remember, hermes_recall, hermes_context)

**Architecture:** v3.5 = v3.0 foundation + v2.5 Thread/Fork/Orchestration

---

## CRITICAL RULES

1. Fork only activates in Hermes sessions (`.hermes/` directory guard)
2. Fork is cooperative (blocks non-fork tools when ForkManager active)
3. Thread is default mode
4. Episode context compresses after execution
5. All hooks have `isHermesAgent()` guard
6. Brainstorm gate is DISABLED to prevent Spider Agent conflict

---

## SHIP PACKAGE CONTENTS

```
CHECKPOINTS/CP-SHIP-2026-04-15/
├── src/                    # TypeScript source
├── dist/index.js           # Compiled plugin (588KB) — INSTALL THIS
├── skills/                 # 11 skill definitions in src/skills
├── integration-tests/
│   └── full-test-suite.ts  # 45 mechanical tests (run with bun)
├── MANIFEST.md             # Architecture docs
├── README.md, HANDOVER.md, INSTALL.md, SHIP_GATE.md
├── verify-install.sh       # Installation verification
├── VERIFY_SHIP.sh          # Package integrity verification
└── [NEW] RELOAD_HERMES.sh  # [CREATE THIS] Auto-reload script
└── [NEW] RELOAD_INSTRUCTIONS.md  # [CREATE THIS] Plain English guide
```

---

## EXACT STEPS TO RELOAD

```bash
# 1. Navigate to ship package
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/Hermes Agent Plugin/hermes-agent-v3.5"

# 2. If not already at checkpoint, copy contents
cp -r CHECKPOINTS/CP-SHIP-2026-04-15/* .

# 3. Build plugin (if dist stale)
bun build src/index.ts --outdir=dist --target=bun

# 4. Create plugin directory
mkdir -p ~/.config/opencode/plugins/hermes-agent-v3.5

# 5. Copy plugin
cp dist/index.js ~/.config/opencode/plugins/hermes-agent-v3.5/

# 6. Register in opencode.json (add to plugins array):
# "file:///home/leviathan/.config/opencode/plugins/hermes-agent-v3.5/index.js"

# 7. Create required directories
mkdir -p ~/.hermes/memory
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/.hermes

# 8. Verify
./verify-install.sh

# 9. Run integration tests
bun run integration-tests/full-test-suite.ts

# 10. Run E2E
bun run test-e2e.ts
```

---

## EXPECTED RESULTS

| Test | Expected |
|------|----------|
| Integration tests | 45/45 passed (100%) |
| E2E tests | 144/147 (3 fixture failures expected) |
| Tool count | 40 |
| Skill count | 11 |
| Agents | 19 |

---

## DELIVERABLES

### 1. `RELOAD_HERMES.sh`

Create in `CHECKPOINTS/CP-SHIP-2026-04-15/RELOAD_HERMES.sh`:

- Does ALL steps above automatically
- Handles idempotently (safe to run multiple times)
- Reports clear success/failure at each step
- Provides final summary

### 2. `RELOAD_INSTRUCTIONS.md`

Create in `CHECKPOINTS/CP-SHIP-2026-04-15/RELOAD_INSTRUCTIONS.md`:

- Plain English explanation of what the script does
- How to verify it worked
- What to do if something fails

---

## COMPACTION CONTEXT

If compacted during reload:
- **Checkpoint:** `hermes-agent-v3.5/CHECKPOINTS/CP-SHIP-2026-04-15/`
- **Resumption:** Read `Compaction Survival/00_INDEX.md` for full context

---

## AGENT SUMMARY TO STORE

After creating the reload package, store this in memory:

```
HERMES V3.5 SHIP PACKAGE
Location: hermes-agent-v3.5/CHECKPOINTS/CP-SHIP-2026-04-15/
Reload: bash RELOAD_HERMES.sh
Verify: bun run integration-tests/full-test-suite.ts
Status: ✅ READY TO RELOAD
```