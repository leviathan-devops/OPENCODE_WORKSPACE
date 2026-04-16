# LAYER 1: INITIAL PLAN — Hermes Agent Plugin v3 Full Overhaul

**Version:** v3.0 (Complete Overhaul)  
**Date:** 2026-04-14  
**Agent:** Kraken Orchestrator  
**Source:** Hermes v2.3.5 + Trident Brain Deep Planning Mode + Kraken v1.1  

---

## Surface Understanding

The Hermes Agent Plugin is a hub-and-spoke multi-agent orchestrator for OpenCode with 19 agents, 28 hooks, and 28 tools. It enforces a 6-phase workflow (Brainstorm → Plan → Build → Review → Debug → Complete). The v2.3.5 build is 94% complete by code count but operationally broken: it was **removed from opencode.json** after a brainstorm gate bug blocked Spider Agent's coder subagent, 3 tools are broken, 27 of 29 hooks have never been verified in a real session, and the v2.5 Thread/Fork/Orchestration features were never built.

**Core problem being solved:** Produce a **verified working** Hermes Agent Plugin where every system fires correctly in a real OpenCode multi-turn session, not just in E2E test isolation. All hooks must be verified, all tools must pass real integration tests, the brainstorm gate must only fire for Hermes sessions, and the delegation chain must work end-to-end.

**Success looks like:** An OpenCode user can select Hermes as their primary agent, run a complete feature through all 6 phases, observe hooks firing at each transition, and see the 2nd-brain memory persisting across sessions — with zero regressions to Spider Agent or other plugins.

---

## First Principles

1. **Hook order is sacred** — hooks fire in composition order; guardrails must come before knowledge injectors; agent-specific hooks MUST have agent identity guards or they affect all agents
2. **E2E tests are necessary but not sufficient** — tests running tools in mock context prove code parses, not that hooks fire in actual OpenCode sessions; real integration testing is non-negotiable
3. **The delegation chain is the product** — the value is not individual agents, it's the hermes→analyst→builder→reviewer chain working; broken delegation = broken product
4. **Phase persistence survives hot-reload** — module-level variables reset on plugin hot-reload; state must be written to disk (`.hermes/phase.json`)
5. **Brainstorm gate must be scoped** — no `.hermes/` directory = no brainstorm gate firing; otherwise it blocks ALL agents in the system

---

## Constraints

- **Plugin SDK:** `@opencode-ai/plugin` v1.1.53 — must match interface exactly; SDK pattern for agent registration is `agent: {}` object, NOT `[]` array
- **OpenCode compatibility:** Hermes must not break Spider Agent, Manta, or Shark agents — hook guards must be agent-specific
- **Workspace path:** All files written to `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v3-build/`
- **Build command:** `bun build.ts` (NOT `bun build dist/index.ts`) — the latter was the source of months of broken dist builds
- **No local file edits rule:** All work is self-contained within `v3-build/`; nothing affects local device until after full SHIP gate

---

## Success Criteria

| # | Criteria | Verification Method |
|---|----------|---------------------|
| 1 | `sast_scan`, `imports`, `symbols`, `grill` all return valid output on real files | Run each tool against `OPENCODE_WORKSPACE` source files |
| 2 | Brainstorm gate fires ONLY when `.hermes/` directory exists | Spawn Spider coder subagent — must NOT be blocked |
| 3 | All 29 hooks verified firing in real OpenCode session | Trident Problem Solving log with hook firing evidence |
| 4 | 6-phase state machine advances correctly (idle→analyze→plan→build→review→debug→complete) | Run phase_complete tool through all transitions |
| 5 | 2nd-brain memory persists across sessions | hermes_recall returns context from prior session |
| 6 | Delegation chain: hermes→analyst→builder→reviewer fires correctly | Full TDD cycle run via delegation, not direct tool calls |
| 7 | Container TUI test replica passes | `docker exec` session with Hermes selected, test task completes |
| 8 | dist/index.js rebuilt after every source change | Verify dist mtime > all source mtimes |
| 9 | No regressions to Spider Agent coder delegation | Spider coder can write files while Hermes is loaded |
| 10 | 98%+ E2E pass rate (144+/147 tests) maintained | Full E2E suite passes post-overhaul |

---

## Open Questions

1. **Does the 3-agent supervisor loop actually fire in a real session?** — Graeme's monitor→supervisor→auditor loop was built but never tested; unclear if intent markers (`[STATUS_REQUEST]`, `[ACK]`) actually flow between agents
2. **How does the compaction system trigger?** — Compaction hook exists but was never verified to fire at 70% context budget; real token counting may differ from mock
3. **Is the Full/Lite model tiering wired to actual model providers?** — Agents have `model: "lite"` flags but no evidence these route to cheaper models vs. being ignored
4. **Does the `~/.hermes/settings.json` permission cascade actually enforce?** — scope-guard hook is unverified; may not actually block file access outside workspace
5. **Is v2.5 Thread/Fork architecture feasible within current SDK?** — Fork blocking (takes over UI) may not be possible without first-class SDK support; may need to be deferred

---

## Direction

**Path chosen:** Option A from PROGRESS_REPORT (Fix and Verify) combined with Trident Brain systematic problem-solving — rebuild v2.3.5 source incorporating all known fixes, verify every hook mechanically, then run full integration test.

**Key decisions already made:**
- Start from v2.3.5 source (best code base, 98% E2E pass)
- Incorporate brainstorm-gate `.hermes/` guard fix (applied 2026-04-08, not yet in dist)
- Fix `sast_scan` by bundling local ESLint security plugin instead of `npm exec`
- Fix `imports`/`symbols` path resolution with proper `context.directory` prefix
- Verify `grill` actual state, rebuild if needed
- Add real integration test harness BEFORE finishing build (not after)
- Use Kraken's 3-cluster model for parallel verification tasks (Alpha=test, Beta=build, Gamma=debug)
- Container testing via `docker exec` in OpenCode sandbox per AGENTS.md Shark protocol

**Technology stack unchanged:**
- TypeScript 5.3+
- Bun runtime (for building)
- `@opencode-ai/plugin` v1.1.53
- Zod for tool schema validation
- fs-based phase persistence (`.hermes/phase.json`)

---

## Anti-Shallow Checklist

- [x] Surface understanding is NOT just restating "94% complete" — actual operational brokenness identified
- [x] First principles come from failure analysis (v2.3.5 removed from opencode.json, E2E ≠ integration)
- [x] Constraints are REAL (SDK interface, no regressions to other plugins, workspace path)
- [x] Success criteria are MEASURABLE (10 concrete criteria with verification methods)
- [x] Open questions identify ACTUAL gaps (supervisor loop, compaction, model tiering, Fork feasibility)
- [x] Direction is SPECIFIC (Option A + Trident + Kraken 3-cluster parallel verification)
