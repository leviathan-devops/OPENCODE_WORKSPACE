# KRAKEN ENGINEER — ACTIVE MEMORY INDEX
**Last Updated:** 2026-04-12  
**Phase:** POST-SHARK-V4.8.3-BUILD → FIREWALL ARCHITECTURE OVERHAUL

## Quick Reference

| File | Purpose |
|------|---------|
| `01_PROJECT_STATE.md` | Current build status, what's done, what's next |
| `02_SOURCE_MAP.md` | Where to find key code files |
| `03_ARCHITECTURE_LESSON.md` | THE CORE LESSON: Tool Layer vs Message Layer gap |
| `04_GOLDEN_BEHAVIOR.md` | What aligned agent behavior looks like |
| `05_COMPACTION_SURVIVAL.md` | How to survive session compaction |
| `06_NEXT_PHASE_PLAN.md` | Firewall architecture overhaul plan |
| `07_CHECKPOINT_RELOAD.md` | How to restore from checkpoint if broken |

## Critical Working Context

**Project Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/`
**Checkpoint Location:** `/home/leviathan/OPENCODE_WORKSPACE/CHECKPOINTS/checkpoint-1-shark-v4.8.3/`

## THE ONE THING TO REMEMBER

> **The firewall only fires at tool.execute.before hook. But `opencode run` sends messages that agents interpret naturally. The guardian never sees the user's intent because it's hidden in agent interpretation.**

This is why 155 patterns pass unit tests but fail in container testing.

## Build Completion Status

| Component | Status |
|-----------|--------|
| guardian-hook.ts (155 patterns) | ✅ COMPLETE |
| dist/index.js (1MB bundle) | ✅ COMPLETE |
| Unit tests (17/17 pass) | ✅ COMPLETE |
| Container runtime blocking | ❌ NOT WORKING |
| Natural language firewall | ❌ NOT STARTED |

## Next Action

See `06_NEXT_PHASE_PLAN.md` for the firewall architecture overhaul.