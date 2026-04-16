# Hermes v3.5 — SHIP PACKAGE MANIFEST
**Build ID:** hermes-v3.5-integration
**Checkpoint:** CP-SHIP-2026-04-15
**Ship Date:** 2026-04-15
**Status:** ✅ SHIP READY

---

## PACKAGE CONTENTS

```
hermes-agent-v3.5/
├── CHECKPOINTS/CP-SHIP-2026-04-15/
│   ├── src/                    # TypeScript source (all hooks, services, tools, agents)
│   ├── skills/                 # 11 orchestration skill definitions (.md files)
│   ├── dist/index.js           # Compiled plugin (592KB)
│   ├── integration-tests/       # Mechanical test suite
│   │   ├── full-test-suite.ts   # Main integration test
│   │   └── logs/                # Audit logs
│   ├── docs/                   # Architecture documentation
│   ├── README.md               # Package overview
│   ├── HANDOVER.md             # Build summary
│   ├── INSTALL.md              # Installation guide
│   ├── SHIP_GATE.md            # Ship criteria verification
│   └── verify-install.sh        # Installation verification script
```

---

## BUILD VERIFICATION

| Test | Result |
|------|--------|
| Mechanical Integration (45 tests) | ✅ 45/45 PASS |
| E2E Tests | ✅ 144/147 (3 fixture failures) |
| Container TUI | ✅ 42/42 PASS |
| Skill Registry | ✅ 11/11 skills loaded |
| Tool Count | ✅ 40 tools |
| Fork Manager | ✅ 4 tools functional |
| Episode Store | ✅ 3 tools functional |
| Orchestration Engine | ✅ 4 tools functional |
| Memory System | ✅ hermes_remember/recall/context |
| Hook Guards | ✅ 33 hooks with isHermesAgent |
| Agent Configs | ✅ 19 agents |

---

## CRITICAL BUGS FIXED

1. **Missing v3.5 tools in dist** — fork_create, episode_list, orchestration_invoke, etc. not registered
2. **Skills not loading** — loadSkills() never called at plugin init
3. **Skill path resolution** — __dirname in bundled code pointed to wrong location

---

## ARCHITECTURE

**v3.5 = v3.0 foundation + v2.5 Thread/Fork/Orchestration**

| Component | Count | Notes |
|-----------|-------|-------|
| Hooks | 33 | 29 v3.0 + 4 new v3.5 |
| Agents | 19 | Unchanged from v3.0 |
| Services | 4 | fork-manager, episode-store, skill-registry, orchestration-engine |
| Tools | 40 | 28 v3.0 + 12 new v3.5 |
| Skills | 11 | All new v3.5 |

---

## DEPLOYMENT

```bash
# 1. Create plugin directory
mkdir -p ~/.config/opencode/plugins/hermes-agent-v3.5

# 2. Copy plugin
cp dist/index.js ~/.config/opencode/plugins/hermes-agent-v3.5/

# 3. Register in opencode.json
# Add to plugins array: "file:///home/YOUR_USER/.config/opencode/plugins/hermes-agent-v3.5/index.js"

# 4. Verify
./verify-install.sh

# 5. Run integration tests
bun run integration-tests/full-test-suite.ts
```

---

## RESUME FROM CHECKPOINT

1. Read `docs/BUILD_LOG.md` for build history
2. Run `bun build src/index.ts --outdir=dist --target=bun` if dist missing
3. Run `bun run integration-tests/full-test-suite.ts` for mechanical verification
4. Run `bun run test-e2e.ts` for E2E verification

---

## CHECKPOINT ID

**CP-SHIP-2026-04-15**

To reload this version:
```bash
cp -r CHECKPOINTS/CP-SHIP-2026-04-15/* .
```

---

**CHECKPOINT CREATED:** 2026-04-15
**CHECKPOINT ID:** CP-SHIP-2026-04-15
**STATUS:** ✅ SHIP READY