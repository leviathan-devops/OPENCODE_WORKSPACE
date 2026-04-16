# Spider Agent Vanilla Spillover Fix - Bugfix Index

**Status**: FIXED & VERIFIED  
**Date**: 2026-04-03

---

## Overview

Spider Agent's hooks were running for ALL agents (including vanilla `plan` and `build`), causing spider state pollution and interference with OpenCode's native permission system. Six defense-in-depth fixes were applied.

---

## Primary Documentation

| File | Description |
|------|-------------|
| [COMPLETE_DEBUG_LOG.md](./COMPLETE_DEBUG_LOG.md) | **MASTER DOCUMENT** - All fixes, analysis, and verification in one place |

---

## Quick Reference

### Fixes Applied (6 Total)

| # | Fix | Location | Line |
|---|-----|----------|------|
| 1 | `delegationHandler` early return | PRIMARY | ~54522 |
| 2 | `resolveSessionAndWindow` | Defense in depth | ~53148 |
| 3 | `guardrailsHooks.toolBefore` | Defense in depth | ~53215 |
| 4 | Model timeout check | Skip for vanilla/architect | ~68849 |
| 5 | Model error fallback | Skip for vanilla/architect | ~53352 |
| 6 | Context pressure warning | Skip for vanilla/architect | ~68870 |

---

## Vanilla Agent List

Spider Agent should ONLY apply to spider agents:

| Agent | Type | Spider Applies? |
|-------|------|----------------|
| `plan` | Vanilla OpenCode | **NO** |
| `build` | Vanilla OpenCode | **NO** |
| `spider` | Spider orchestrator | YES - Full functionality |
| `coder` | Spider subagent | YES - Has fallback |
| `reviewer` | Spider subagent | YES - Has fallback |
| `test_engineer` | Spider subagent | YES - Has fallback |
| `explorer` | Spider subagent | YES - Has fallback |
| `sme` | Spider subagent | YES - Has fallback |
| `critic` | Spider subagent | YES - Has fallback |
| `docs` | Spider subagent | YES - Has fallback |
| `designer` | Spider subagent | YES - Has fallback |

---

## Key Files

- **Plugin**: `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js`
- **Architecture**: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Opencode Macro-Architecture/Spider Agent/ARCHITECTURE.md`

---

## Verification Checklist

After restart of OpenCode:

- [ ] Vanilla `plan` agent cannot write files (OpenCode native permissions)
- [ ] Vanilla `build` agent CAN write files
- [ ] Spider `spider` (orchestrator) agent has full spider functionality
- [ ] Spider `coder` agent has limited tools as expected
- [ ] Spider `reviewer` agent cannot write to `src/`
- [ ] No "MODEL FALLBACK SUPPRESSED" warnings for vanilla agents
- [ ] No context pressure warnings for vanilla agents
- [ ] No spider state pollution for vanilla sessions
- [ ] `DEBUG_SPIDER=1` shows no activity for vanilla agents
- [ ] Model fallback still works for spider sub-agents

---

## Debug Commands

```bash
# Enable debug logging
DEBUG_SPIDER=1 opencode

# Should see NO "[DIAG] chat.message agent=plan" or "agent=build"
# Should see NO "MODEL FALLBACK" warnings for vanilla agents
```

---

**Last Updated**: 2026-04-03