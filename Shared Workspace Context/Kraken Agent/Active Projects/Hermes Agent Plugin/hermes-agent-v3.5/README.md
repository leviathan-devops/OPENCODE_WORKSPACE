# Hermes Agent v3.5 — Installation Package

**Version:** 3.5  
**Build ID:** hermes-v3.5-integration  
**Built:** 2026-04-14  
**Status:** ✅ SHIP READY — v2.5 Thread/Fork/Orchestration Integrated  
**Plugin Size:** ~560KB (dist/index.js)

---

## What's New in v3.5

v3.5 integrates the **v2.5 Thread/Fork/Orchestration** architecture into the v3.0 foundation.

### New Primitives

| Primitive | Description | Use Case |
|-----------|-------------|----------|
| **Thread** | Async, non-blocking subagent | Background work, parallel tasks |
| **Fork** | Synchronous, blocking subagent | Interactive planning, code review |
| **Orchestration** | Skill chains with conditional branching | Complex workflows |

### New Skills

| Skill | Type | Description |
|-------|------|-------------|
| `/implement` | orchestration | Full pipeline: plan→tdd→verify→grill |
| `/plan` | interactive (fork) | Collaborative planning |
| `/grill` | interactive (fork) | Adversarial security testing |
| `/tdd` | action (thread) | Test-driven development |
| `/verify` | action (thread) | Proof-based verification |
| `/debug` | action (thread) | Systematic debugging |
| `/brainstorm` | interactive (fork) | Socratic requirements |
| `/autopilot` | orchestration | Continuous improvement |
| `/health` | action (thread) | System health check |
| `/remember` | action (thread) | Store to 2nd-brain |
| `/recall` | action (thread) | Retrieve from 2nd-brain |

### New Services

- **ForkManager** — Fork lifecycle (start, complete, timeout)
- **EpisodeStore** — Episode tracking and history
- **OrchestrationEngine** — Chain execution with conditionals
- **SkillRegistry** — Skill loading and registration

### New Tools

- `fork_create`, `fork_complete`, `fork_feedback`, `fork_status`
- `episode_list`, `episode_output`, `episode_summary`
- `orchestration_invoke`, `skill_register`, `skill_list`

---

## Quick Install

### Prerequisites

- OpenCode 1.4.x+
- Bun 1.x

### Steps

```bash
# 1. Create plugin directory
mkdir -p ~/.config/opencode/plugins/hermes-agent-v3.5

# 2. Copy plugin
cp dist/index.js ~/.config/opencode/plugins/hermes-agent-v3.5/

# 3. Register in opencode.json
# Edit ~/.config/opencode/opencode.json:
{
  "plugins": [
    "file:///home/YOUR_USER/.config/opencode/plugins/hermes-agent-v3.5/index.js"
  ]
}

# 4. Verify
./verify-install.sh
```

---

## Architecture

### Fork vs Thread

**Thread (async):**
```
hermes → dispatch → continues immediately → background work
```

**Fork (blocking):**
```
hermes → dispatch → WAITS → user interacts → returns output
```

### Orchestration Example: /implement

```
User: "implement login"

Chain:
1. FORK /plan     — User collaborates on plan (blocking)
2. THREAD /tdd    — TDD cycle runs (async)
3. THREAD /verify — Verification runs (async)
4. FORK /grill    — Adversarial testing (blocking)
```

---

## v3.0 Compatibility

All v3.0 features preserved:

- ✅ 29 hooks with `isHermesAgent()` guards
- ✅ 19 agents with delegation chain
- ✅ 6-phase state machine
- ✅ 2nd-brain memory (hermes_remember, hermes_recall)
- ✅ Brainstorm gate with `.hermes/` directory guard
- ✅ hermes-command.ts guard

---

## Files

```
hermes-agent-v3.5/
├── dist/index.js           # Built plugin
├── src/                    # TypeScript source
│   ├── services/           # fork-manager, episode-store, orchestration-engine, skill-registry
│   ├── hooks/              # fork-blocker, skill-router, output-chainer, episode-tracker
│   ├── tools/             # fork-tools, episode-tools, orchestration-tools
│   └── skills/             # 11 orchestration skills
├── docs/                   # Architecture docs
├── README.md               # This file
├── INSTALL.md              # Installation guide
└── verify-install.sh       # Installation verification
```

---

## Rollback

```bash
# Restore backup
cp ~/.config/opencode/opencode.json.backup ~/.config/opencode/opencode.json
rm -rf ~/.config/opencode/plugins/hermes-agent-v3.5
```
