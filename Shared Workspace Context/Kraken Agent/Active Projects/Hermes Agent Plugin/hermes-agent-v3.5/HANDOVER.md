# Hermes Agent v3.5 — Handover Document

**Version:** 3.5  
**Build ID:** hermes-v3.5-integration  
**Built:** 2026-04-14  
**Status:** ✅ SHIP READY  
**Parent:** hermes-v3-overhaul (v3.0)

---

## What Was Built

v3.5 integrates the v2.5 Thread/Fork/Orchestration architecture into the v3.0 foundation.

### New Primitives

| Primitive | Description |
|-----------|-------------|
| **Thread** | Async, non-blocking subagent dispatch |
| **Fork** | Synchronous, blocking subagent (takes over UI) |
| **Orchestration** | Skill chains with conditional branching |

### New Components

| Category | Count | Status |
|----------|-------|--------|
| Services | 4 | ✅ fork-manager, episode-store, skill-registry, orchestration-engine |
| Hooks | 4 | ✅ fork-blocker, skill-router, output-chainer, episode-tracker |
| Tools | 3 | ✅ fork-tools, episode-tools, orchestration-tools |
| Skills | 11 | ✅ implement, plan, grill, tdd, verify, debug, brainstorm, autopilot, health, recall, remember |

---

## Critical Design Rules

1. **Fork only for Hermes sessions** — `.hermes/` directory guard
2. **Fork is cooperative** — tools check `ForkManager.isActive()`
3. **Thread is default** — most work is async
4. **Episode compresses context** — cleared after execution

---

## Installation

```bash
mkdir -p ~/.config/opencode/plugins/hermes-agent-v3.5
cp dist/index.js ~/.config/opencode/plugins/hermes-agent-v3.5/
# Edit opencode.json
./verify-install.sh
```

---

## Test Results

| Test | Result |
|------|--------|
| E2E | 144/147 ✅ |
| Services | 4/4 ✅ |
| Hooks | 33 ✅ |
| Tools | 3/3 ✅ |
| Skills | 11 ✅ |

---

## Rollback

```bash
cp ~/.config/opencode/opencode.json.backup ~/.config/opencode/opencode.json
rm -rf ~/.config/opencode/plugins/hermes-agent-v3.5
```
