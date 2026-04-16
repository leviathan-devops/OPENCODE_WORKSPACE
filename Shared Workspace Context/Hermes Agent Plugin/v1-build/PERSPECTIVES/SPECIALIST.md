# SPECIALIST AGENT — 36 Agents, Full/Lite Variants

Source: GitHub, specialistagent.com.br
Full analysis: `~/hermes-workspace/context/engineering/HERMES_AGENT_PLUGIN_SPEC.md`

---

## Full vs Lite Variants

Every agent has two modes:

| Mode | Model | Cost | Use |
|------|-------|------|-----|
| **Full** | capable (qwen3.6-plus) | higher | Complex work |
| **Lite** | cheap (qwen3.6-turbo) | 60-80% lower | Scaffolding, simple fixes |

**This is model tiering at the AGENT level, not just the runtime level.**

---

## 36 Agents by Category

### Core (5)
| Agent | Role |
|-------|------|
| @starter | Project initialization |
| @builder | Implementation |
| @reviewer | Code review |
| @doctor | Debugging, fixes |
| @migrator | Migration assistance |

### Workflow (10)
| Agent | Role |
|-------|------|
| @planner | Adaptive planning |
| @executor | Task execution |
| @tdd | RED-GREEN-REFACTOR |
| @debugger | Systematic debugging |
| @pair | Pair programming |
| @analyst | Requirements → specs |
| @orchestrator | Multi-agent coordination |
| @scout | Exploration, discovery |
| @memory | Cross-session memory |

### Engineering (17)
@api, @perf, @i18n, @docs, @refactor, @deps, @explorer, @finance, @cloud, @security, @designer, @data, @devops, @tester, @legal, @architect, @ripple

### Business (3)
@marketing, @product, @support

### Automation (2)
@sentry-triage, @autopilot

---

## Key Specialist Patterns

### @analyst (NEW — not in Spider)
Converts requirements to technical specs. Critical for brainstorm gate.

### @ripple (NEW — not in Spider)
Analyzes cascading effects — "What breaks if I change the User model?"

### Verification Protocol
Every agent must show actual command output before claiming completion.

### Anti-Rationalization Tables
Built-in tables prevent agents from cutting corners.

### Context Isolation
Each subtask gets fresh context. No accumulated pollution.

---

## 32 Skills

| Skill | Purpose |
|-------|---------|
| /brainstorm | Socratic pre-planning |
| /tdd | RED-GREEN-REFACTOR cycle |
| /debug | 4-phase systematic debugging |
| /grill | Adversarial attack vectors |
| /verify | Proof-based verification |
| /health | Project health score (0-100) |
| /autopilot | Autonomous iterative development |
| /remember | Save to cross-session memory |
| /recall | Query cross-session memory |
| /finish | Finalize: metrics + commit + PR |

---

## Hermes Adoption

**Keep from Specialist**:
- Full/Lite variants → every Hermes agent has both modes
- @analyst → Phase 0 design doc
- @ripple → Post-change cascading analysis
- @grill → Phase 3 adversarial pass
- Verification protocol → built into every agent
- Anti-rationalization → exit criteria checklist

**Adapt to Hermes**:
- Reduce to 14 agents (Hermes doesn't need all 36)
- Integrate with Spider's hook architecture
- Map to Hermes's 6-phase workflow
