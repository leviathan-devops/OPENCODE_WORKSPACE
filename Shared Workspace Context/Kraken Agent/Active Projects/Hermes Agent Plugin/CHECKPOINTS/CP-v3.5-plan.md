# CHECKPOINT — v3.5 Plan Created

**Checkpoint ID:** cp-v3.5-plan  
**Timestamp:** 2026-04-14  
**Build ID:** hermes-v3.5-integration  
**Phase:** PLAN COMPLETE

---

## Plan Location

`PLAN_V2.5_INTEGRATION.md` — Full integration plan

---

## Summary

Created 7-phase plan to integrate v2.5 Thread/Fork/Orchestration into v3.0:

| Phase | Gate | Tasks |
|-------|------|-------|
| 1-INVENTORY | Code Review | Map v2.5 files, identify gaps |
| 2-FOUNDATION | Build | ForkManager, EpisodeStore, OrchestrationEngine |
| 3-HOOKS | Test | Fork blocker, skill router, output chainer |
| 4-TOOLS | Test | Fork/episode/orchestration tools |
| 5-SKILLS | Integration | Port orchestration skills |
| 6-REGRESSION | Integration | Verify v3.0 still works |
| 7-SHIP | Container | Container test, finalize package |

---

## Critical Constraints

1. **Fork must NOT block Spider Agent** — `.hermes/` directory guard
2. **Fork is cooperative** — tools check ForkManager.isActive()
3. **Thread is default** — async for most work
4. **Fork for user interaction** — only interactive skills

---

## Files to Create (14 new)

**Services (4):**
- src/services/fork-manager.ts
- src/services/episode-store.ts
- src/services/orchestration-engine.ts
- src/services/skill-registry.ts

**Hooks (4):**
- src/hooks/fork-blocker-hook.ts
- src/hooks/skill-router.ts
- src/hooks/output-chainer.ts
- src/hooks/episode-tracker.ts

**Tools (3):**
- src/tools/fork-tools.ts
- src/tools/episode-tools.ts
- src/tools/orchestration-tools.ts

**Skills (5):**
- src/skills/IMPLEMENT.md
- src/skills/PLAN.md
- src/skills/GRILL.md
- src/skills/TDD.md
- src/skills/VERIFY.md

---

## v2.5 Reference Files

```
v2.5-build/BUILD/ARCHITECTURE.md          ← Thread/Fork/Orchestration spec
v2.5-build/BUILD/IMPLEMENTATION_ROADMAP.md ← Phase-by-phase plan
v2.5-build/BUILD/SKILL_STACKING_SPEC.md    ← Slate's patterns
v2.5-build/src/services/fork-manager.ts    ← Reference implementation
v2.5-build/src/skills/*.md                 ← Reference skills
```

---

## Resume Point

If session crashes, continue from **Phase 1: INVENTORY**

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/Hermes Agent Plugin"

# Resume with Phase 1
# 1.1: List all v2.5 source files
ls -la v2.5-build/src/services/
ls -la v2.5-build/src/hooks/
ls -la v2.5-build/src/tools/
ls -la v2.5-build/src/skills/
```

---

## Ship Package Target

`hermes-agent-v3.5/` ship package with:
- dist/index.js (v3.5 built plugin)
- src/ (v3.5 TypeScript source)
- docs/ (updated architecture docs)
- container/ (Dockerfile + tests)
- README.md, INSTALL.md, TROUBLESHOOT.md
