# COMPACTION SURVIVAL — Hermes v3.5 FINAL
**Build ID:** hermes-v3.5-integration
**Checkpoint:** CP-SHIP-2026-04-15
**Last Updated:** 2026-04-15
**Status:** ✅ SHIP PACKAGE CREATED — ANCHOR THIS VERSION

---

## SHIP PACKAGE LOCATION

```
hermes-agent-v3.5/CHECKPOINTS/CP-SHIP-2026-04-15/
```

**To reload this version:**
```bash
cd hermes-agent-v3.5
cp -r CHECKPOINTS/CP-SHIP-2026-04-15/* .
```

---

## FINAL TEST RESULTS

| Test Suite | Result | Notes |
|------------|--------|-------|
| Mechanical Integration | ✅ 45/45 PASS (100%) | Full test suite |
| E2E | ✅ 144/147 | 3 fixture string matches |
| Container TUI | ✅ 42/42 | Full Docker test |
| Skill Registry | ✅ 11/11 | All skills loaded |
| Tool Count | ✅ 40 | All tools registered |

---

## BUILD ARCHITECTURE

**v3.5 = v3.0 foundation + v2.5 Thread/Fork/Orchestration**

| Component | v3.0 | v2.5 | v3.5 Total |
|-----------|------|------|-----------|
| Hooks | 29 | +4 | 33 |
| Agents | 19 | — | 19 |
| Services | 0 | +4 | 4 |
| Tools | 28 | +12 | 40 |
| Skills | 0 | +11 | 11 |

---

## BUGS FIXED DURING VERIFICATION

1. **Missing v3.5 tools in dist** — fork_create, episode_list, orchestration_invoke not registered
2. **Skills not loading** — loadSkills() never called at plugin init
3. **Skill path resolution** — __dirname in bundled code pointed to wrong location

---

## DEPLOY

```bash
# Create plugin directory
mkdir -p ~/.config/opencode/plugins/hermes-agent-v3.5

# Copy plugin
cp dist/index.js ~/.config/opencode/plugins/hermes-agent-v3.5/

# Register in opencode.json plugins array:
"file:///home/YOUR_USER/.config/opencode/plugins/hermes-agent-v3.5/index.js"

# Verify
./verify-install.sh

# Run tests
bun run integration-tests/full-test-suite.ts
```

---

## CHECKPOINTS

| ID | Date | Phase | Status |
|----|------|-------|--------|
| CP-0 | 2026-04-14 | Foundation | ✅ |
| CP-1 | 2026-04-14 | Hooks | ✅ |
| CP-2 | 2026-04-14 | Container Ship | ✅ |
| CP-10 | 2026-04-14 | FINAL v3.0 | ✅ |
| CP-FULL-TEST | 2026-04-15 | Full Container TUI | ✅ |
| CP-SHIP | 2026-04-15 | SHIP PACKAGE | ✅ |

---

## IF COMPACTED

1. Read this file
2. Check dist: `bun build src/index.ts --outdir=dist --target=bun`
3. Run tests: `bun run integration-tests/full-test-suite.ts`
4. Or reload checkpoint: `cp -r CHECKPOINTS/CP-SHIP-2026-04-15/* .`

---

## CRITICAL DESIGN RULES

1. Fork only activates in Hermes sessions — `.hermes/` directory guard
2. Fork is cooperative — blocks non-fork tools when ForkManager active
3. Thread is default mode
4. Episode context compresses after execution
5. All hooks have `isHermesAgent()` guard
6. Brainstorm gate disabled to prevent Spider Agent conflict