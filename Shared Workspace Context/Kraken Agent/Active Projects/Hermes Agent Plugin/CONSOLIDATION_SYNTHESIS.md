# Hermes Agent v3.5 — Consolidation Synthesis

**Date:** Wed Apr 15 2026  
**Status:** SCATTERED → ORGANIZED  

---

## CURRENT STATE: FILES EVERYWHERE

Hermes agent files are scattered across **15+ locations** in the workspace:

### Workspace Root
| Location | Contents |
|----------|----------|
| `hermes-hud/` | Python HUD project (unrelated, different agent) |
| `hermes-test-project/` | Test harness |

### Shared Workspace Context (Knowledge + Old Builds)
| Location | Contents |
|----------|----------|
| `Hermes Agent Plugin/` | Main working directory with v1 through v2.5 builds |
| `Hermes Agent Plugin/src/` | v3.0 source (19 agents, hooks, tools) |
| `Hermes Agent Plugin/hermes-agent-v3.5/` | v3.5 complete build (THE CANONICAL VERSION) |
| `Hermes Memory Overhaul/` | Memory system redesign docs/architecture |
| `Hermes Handover Bridge/` | Cloud SSH handover packages |
| `Kraken Agent/Active Projects/Hermes Agent Plugin/` | Active development copy |

### Projects Folder
| Location | Contents |
|----------|----------|
| `projects/cloud-hermes/` | External cloud-hermes repo (Python, different agent) |

### DEBUG LOGS
| Location | Contents |
|----------|----------|
| `DEBUG LOGS/02-hermes-agent/` | v2.1, v2.2, v2.3 debug logs |
| `DEBUG LOGS/` | Guardian firewall logs, etc. |

### Backup Library
| Location | Contents |
|----------|----------|
| `backup-library/plugins/hermes-agent-2026-04-08.js` | Old plugin backup |

---

## WHAT HERMES AGENT ACTUALLY IS

### Core Plugin (Runtime)
The **Hermes Agent Plugin v3.5** is an OpenCode plugin that provides:

1. **40 Tools** - fork, episode, orchestration, quality, security, analysis, session, supervisor
2. **19 Agents** - hermes, planner, builder, tdd, reviewer, grill, ripple, etc.
3. **33 Hooks** - lifecycle guards, brainstorming gate, fork blocker, skill router
4. **11 Skills** - implement, plan, grill, tdd, verify, debug, brainstorm, autopilot, health, remember, recall
5. **4 Services** - fork-manager, episode-store, skill-registry, orchestration-engine
6. **Memory System** - hermes_remember, hermes_recall, hermes_context

### Key Files in v3.5
```
hermes-agent-v3.5/
├── src/
│   ├── index.ts           # Plugin entry point (393 lines)
│   ├── agents/            # 19 agent prompt configs
│   ├── hooks/             # 33 lifecycle hooks
│   ├── tools/             # 40 tools
│   ├── services/          # 4 core services
│   ├── skills/            # 11 orchestration skills (.md files)
│   ├── config/           # Schema, permissions, constants
│   └── utils/
├── dist/
│   └── index.js           # Compiled plugin (~587KB)
├── integration-tests/
│   └── full-test-suite.ts  # 45 mechanical tests
├── docs/
├── scripts/
└── README.md, SHIP_GATE.md, HANDOVER.md
```

---

## PROPOSED CONSOLIDATION: 2 LOCATIONS

### LOCATION 1: `projects/hermes-agent/`
**Purpose:** Runtime working mechanics — self-contained, runnable plugin

```
projects/hermes-agent/
├── README.md                    # Quick start + architecture
├── dist/
│   └── index.js                # Compiled plugin (ready to load in opencode.json)
├── src/
│   ├── index.ts                # Plugin entry
│   ├── agents/                 # 19 agent definitions
│   ├── hooks/                   # 33 hooks
│   ├── tools/                   # 40 tools
│   ├── services/               # fork-manager, episode-store, orchestration-engine, skill-registry
│   ├── skills/                  # 11 skill .md files
│   ├── config/                 # Constants, schema, permissions
│   └── utils/
├── integration-tests/
│   ├── full-test-suite.ts
│   └── logs/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SKILLS.md
│   └── HOOKS.md
├── scripts/
│   ├── build.sh
│   ├── verify-install.sh
│   └── test.sh
├── package.json
├── tsconfig.json
└── .gitignore
```

### LOCATION 2: `Shared Workspace Context/Hermes Agent Knowledge/`
**Purpose:** Knowledge library — context, history, design decisions, learnings

```
Shared Workspace Context/Hermes Agent Knowledge/
├── INTRO.md                     # What is Hermes, what it does
├── VERSIONS/
│   ├── v1-BRIEF.md
│   ├── v2.x-BRIEF.md
│   ├── v3.0-BRIEF.md
│   └── v3.5-BRIEF.md            # Current version
├── ARCHITECTURE/
│   ├── SYSTEM_MAP.md           # Full system components
│   ├── FORK_vs_THREAD.md        # Primitives explained
│   ├── ORCHESTRATION.md         # Skill chains
│   ├── HOOK_CHAIN.md            # Hook lifecycle
│   └── AGENT_DELEGATION.md      # 19 agent roles
├── SKILLS/
│   ├── OVERVIEW.md
│   ├── IMPLEMENT.md
│   ├── PLAN.md
│   ├── GRILL.md
│   ├── TDD.md
│   ├── VERIFY.md
│   ├── DEBUG.md
│   ├── BRAINSTORM.md
│   ├── AUTOPILOT.md
│   ├── HEALTH.md
│   ├── REMEMBER.md
│   └── RECALL.md
├── BUILD/
│   ├── SHIP_GATE.md            # Ship criteria
│   ├── BUILD_LOG.md
│   ├── TEST_RESULTS.md
│   └── REGRESSION_LOG.md
├── DESIGN_DECISIONS/
│   ├── FORK_ONLY_HERMES.md
│   ├── EPISODE_COMPRESSION.md
│   ├── BRAINSTORM_GATE.md
│   └── HOOK_GUARDS.md
├── MEMORY/
│   ├── ARCHITECTURE.md         # 2nd-brain system
│   ├── L0_L1_L2_SPEC.md
│   └── OVERHAUL_PROPOSAL.md    # Hermes Memory Overhaul contents
├── LESSONS_LEARNED/
│   ├── FIREWALL_BUGS.md
│   ├── GUARDIAN_DEBUG.md
│   └── INTEGRATION_ISSUES.md
├── DEBUG_LOGS/
│   ├── v2.1-BUILD_DEBUG_LOG.md
│   ├── v2.2-BUILD_DEBUG_LOG.md
│   ├── v2.3-BUILD_DEBUG_LOG.md
│   └── v3.5-INTEGRATION_LOG.md
└── SCRAPBOOK/
    ├── PARALLEL_PEER_BRAINS.md
    ├── SKILL_VS_PLUGIN_CASE_STUDY.md
    └── QUARANTINE/             # Old ideas that didn't work
```

---

## WHAT GETS DELETED AFTER CONSOLIDATION

After consolidation, these scattered locations become obsolete:

| Location | Reason |
|----------|--------|
| `hermes-hud/` | Different agent (Python), not Hermes |
| `Hermes Agent Plugin/v1-build/` | Old v1 build |
| `Hermes Agent Plugin/v2.x-build/` | Old v2 builds (v3.5 supersedes) |
| `Hermes Agent Plugin/hermes-agent-v3.0/` | Superseded by v3.5 |
| `Hermes Agent Plugin/REFERENCE/` | Moves to knowledge library |
| `Hermes Agent Plugin/PLANS/` | Moves to knowledge library |
| `Hermes Agent Plugin/SOURCE_DECODED/` | Moves to knowledge library |
| `Hermes Memory Overhaul/` | Moves to knowledge library/MEMORY |
| `Hermes Handover Bridge/` | Reference material only |
| `DEBUG LOGS/02-hermes-agent/` | Moves to knowledge library/DEBUG_LOGS |
| `projects/cloud-hermes/` | Different agent (Python cloud-hermes) |
| `backup-library/plugins/hermes-agent-*.js` | Old backups, superseded |

---

## EXECUTION CHECKLIST

- [ ] Create `projects/hermes-agent/` structure
- [ ] Copy v3.5 source to `projects/hermes-agent/src/`
- [ ] Copy v3.5 dist to `projects/hermes-agent/dist/`
- [ ] Copy integration tests
- [ ] Create `Shared Workspace Context/Hermes Agent Knowledge/` structure
- [ ] Move all version docs
- [ ] Move architecture docs
- [ ] Move build logs
- [ ] Move design decisions
- [ ] Move memory overhaul docs
- [ ] Move debug logs
- [ ] Create VERSIONS/ summary docs
- [ ] Update opencode.json to point to `projects/hermes-agent/dist/index.js`
- [ ] Delete scattered locations
- [ ] Verify tests still pass

---

## OPENCODE.JSON CONFIGURATION

After consolidation, opencode.json should have:

```json
{
  "plugins": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/hermes-agent/dist/index.js"
  ]
}
```

NOT scattered across multiple locations.