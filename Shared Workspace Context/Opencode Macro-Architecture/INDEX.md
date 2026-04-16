# OpenCode Macro-Architecture Documentation Library

**Status**: Production Grade
**Last Updated**: 2026-04-03
**Total Files**: ~150 files across documentation library

---

## Purpose

This library is a **production-grade knowledge resource for AI coding agents** building OpenCode plugins. It contains:

- Reverse-engineered documentation of Spider Agent (11-agent swarm)
- OpenCode Vanilla plugin system specs
- Engineering methodology and patterns
- Source code extracts
- Reference templates

**For plugin engineers**: Load the `opencode-plugin-engineering` skill to learn how to use this library.

---

## Quick Access

| Need | Go To |
|------|-------|
| Start here | `PLUGIN_CHEATSHEET.md` |
| Engineering methodology | `Plugin Engineering/PLUGIN_ENGINEERING_T1.md` |
| Hook reference | `Plugin Engineering/OPENCODE_HOOK_MAP.md` |
| Tool examples | `Spider Agent/TOOLS/` |
| Hook examples | `Spider Agent/HOOKS/` |
| Agent roles | `Spider Agent/AGENTS/` |
| SDK types | `Opencode Vanilla/SOURCE_DECODED/` |

---

## Complete Directory Structure

```
OPENCODE WORKSPACE/Shared Workspace Context/
├── Opencode Macro-Architecture/           # Main documentation library (~150 files)
│   ├── INDEX.md                           # This file
│   ├── PLUGIN_CHEATSHEET.md              # Single-page quick reference ⭐
│   │
│   ├── Spider Agent/                      # 11-agent swarm documentation
│   │   ├── ARCHITECTURE.md               # System design overview
│   │   ├── AGENTS/                      # Agent role documentation
│   │   │   ├── README.md                 # Architecture overview
│   │   │   ├── architect.md             # Orchestrator agent
│   │   │   ├── coder.md                 # Implementation agent
│   │   │   ├── reviewer.md              # QA specialist
│   │   │   ├── test_engineer.md         # Test specialist
│   │   │   ├── explorer.md              # Investigation specialist
│   │   │   ├── critic.md                # Plan reviewer
│   │   │   └── sme.md                   # Domain expert
│   │   │
│   │   ├── HOOKS/                       # 12 hook system docs
│   │   │   ├── README.md                 # Hook index
│   │   │   ├── system-enhancer.md       # System prompt enhancement
│   │   │   ├── guardrails.md            # Safety validation
│   │   │   ├── delegation-gate.md       # QA gate enforcement
│   │   │   ├── scope-guard.md           # File scope containment
│   │   │   ├── slop-detector.md        # Quality detection
│   │   │   ├── dark-matter-detector.md  # Unresolved gap reminders
│   │   │   ├── consolidateSystemMessages.md  # Message consolidation
│   │   │   ├── context-budget.md        # Context usage warnings
│   │   │   ├── knowledge-injector.md    # Knowledge injection
│   │   │   ├── knowledge-curator.md     # Knowledge extraction
│   │   │   └── brainstorm-gate.md       # Phase 0 enforcement
│   │   │
│   │   ├── TOOLS/                       # 38 custom tool docs
│   │   │   ├── README.md                 # Tool index
│   │   │   ├── save_plan.md            # Plan persistence
│   │   │   ├── checkpoint.md            # Git-based checkpoints
│   │   │   ├── evidence_check.md        # QA evidence verification
│   │   │   ├── phase_complete.md         # Phase completion
│   │   │   ├── update_task_status.md    # Task status updates
│   │   │   ├── declare_scope.md        # Scope declaration
│   │   │   ├── lint.md                 # Linting
│   │   │   ├── test_runner.md          # Test execution
│   │   │   ├── build_check.md          # Build verification
│   │   │   ├── secretscan.md           # Secret detection
│   │   │   ├── sast_scan.md            # Security scanning
│   │   │   ├── complexity_hotspots.md   # Complexity analysis
│   │   │   ├── detect_domains.md       # Domain detection
│   │   │   ├── co_change_analyzer.md   # Coupling analysis
│   │   │   ├── knowledgeAdd.md         # Knowledge storage
│   │   │   ├── knowledgeRecall.md      # Knowledge retrieval
│   │   │   ├── swarm_status.md         # Swarm state
│   │   │   └── ... (20+ more tools)
│   │   │
│   │   ├── SOURCE_DECODED/              # Key source extracts
│   │   │   ├── plugin-entry-point.md   # Main entry point
│   │   │   └── hook-factories.md      # Hook implementations
│   │   │
│   │   ├── PLANS/                       # Implementation guides
│   │   ├── REFERENCE/                   # Quick references
│   │   ├── SKILLS/                     # How-to guides
│   │   └── PERSPECTIVES/               # Design philosophy
│   │
│   └── Opencode Vanilla/                # Base plugin system
│       ├── AGENTS/                     # Agent customization
│       ├── HOOKS/                      # Hook system
│       ├── TOOLS/                      # Built-in tools (18 files)
│       ├── PLANS/                      # Plugin development guide
│       ├── REFERENCE/                  # Config schemas
│       ├── SKILLS/                     # How-to guides
│       ├── PERSPECTIVES/               # Design philosophy
│       └── SOURCE_DECODED/             # SDK type extracts
│           ├── plugin-interface.md     # Plugin/SDK types
│           └── hooks-type.md           # Hook type definitions
│
├── Plugin Engineering/                   # Engineering methodology (~2,500 lines)
│   ├── PLUGIN_ENGINEERING_T1.md        # T1 neural pathway
│   ├── OPENCODE_HOOK_MAP.md             # Complete hook reference
│   ├── OPENCODE_PLUGIN_HOOK_ARCHITECTURE.md  # Hook execution order
│   └── SPIDER_AGENT_FORENSIC_REPORT.md # Spider internals
│
└── Hermes Agent Plugin/                 # Example plugin
    └── v2-build/                       # Production plugin implementation
        ├── REFERENCE/
        │   ├── PLUGIN_SPEC.md          # Complete engineering spec
        │   └── PLUGIN_ENGINEERING_T1.md
        └── SDK/
            └── plugin_types.d.ts        # SDK type definitions
```

---

## File Count Summary

| Directory | Files | Description |
|-----------|-------|-------------|
| Spider Agent/AGENTS/ | 8 | Per-agent docs |
| Spider Agent/HOOKS/ | 12 | Per-hook docs |
| Spider Agent/TOOLS/ | 46 | Per-tool docs |
| Spider Agent/SOURCE_DECODED/ | 2 | Source extracts |
| OpenCode Vanilla/SOURCE_DECODED/ | 2 | SDK type docs |
| OpenCode Vanilla/TOOLS/ | 18 | Per-tool docs |
| Plugin Engineering/ | 4 | Engineering docs |
| **Total** | **~150** | Full documentation library |

---

## Documentation Layers

### Layer 1: Quick Access (Start Here)

| File | Purpose | When |
|------|---------|-------|
| `PLUGIN_CHEATSHEET.md` | Single-page quick reference | Any time |
| `INDEX.md` | This file | Finding content |

### Layer 2: Engineering Methodology

| File | Purpose |
|------|---------|
| `PLUGIN_ENGINEERING_T1.md` | Complete neural pathway for building plugins |
| `OPENCODE_HOOK_MAP.md` | All hook types with signatures |
| `OPENCODE_PLUGIN_HOOK_ARCHITECTURE.md` | Hook order, session state, debugging |

### Layer 3: Spider Agent Reference

| Directory | Purpose |
|-----------|---------|
| `Spider Agent/ARCHITECTURE.md` | System design |
| `Spider Agent/AGENTS/*.md` | Agent roles (8 files) |
| `Spider Agent/HOOKS/*.md` | Hook systems (12 files) |
| `Spider Agent/TOOLS/*.md` | Tools (46 files) |

### Layer 4: OpenCode Vanilla Reference

| Directory | Purpose |
|-----------|---------|
| `OpenCode Vanilla/SOURCE_DECODED/` | SDK types |
| `OpenCode Vanilla/PLANS/` | Development guide |
| `OpenCode Vanilla/REFERENCE/` | Config schemas |

### Layer 5: Source Code

| Directory | Purpose |
|-----------|---------|
| `Spider Agent/SOURCE_DECODED/` | Key source extracts |
| `spider-source/src/` | TypeScript source (when available) |

---

## Skill: opencode-plugin-engineering

The `opencode-plugin-engineering` skill teaches agents how to use this library.

**Location**: `~/.hermes/profiles/2nd-brain/skills/software-development/opencode-plugin-engineering/`

**Reference Files**:
- `references/tool-template.md` — Tool creation template
- `references/hook-template.md` — Hook implementation template

**Usage**:
```
Load this skill when starting a plugin engineering task.
It provides paths to all relevant documentation and teaches
the workflow for building production-grade plugins.
```

---

## Build History

| Date | Change |
|------|--------|
| 2026-04-03 | Created per-tool and per-hook granularity (46 + 12 files) |
| 2026-04-03 | Added SOURCE_DECODED directories with source extracts |
| 2026-04-03 | Added per-agent granularity (8 agent files) |
| 2026-04-03 | Created PLUGIN_CHEATSHEET.md |
| 2026-04-03 | Created opencode-plugin-engineering skill |
| 2026-04-03 | Library promoted to "Production Grade" |

---

## For Plugin Engineers

1. **Start**: Read `PLUGIN_CHEATSHEET.md`
2. **Learn**: Load `opencode-plugin-engineering` skill
3. **Design**: Study `Plugin Engineering/T1.md`
4. **Implement**: Reference `Spider Agent/TOOLS/` and `Spider Agent/HOOKS/`
5. **Debug**: Use `Plugin Engineering/HOOK_ARCHITECTURE.md`

---

## Navigation

- [PLUGIN_CHEATSHEET.md](./PLUGIN_CHEATSHEET.md) — Quick reference
- [Spider Agent/ARCHITECTURE.md](./Spider%20Agent/ARCHITECTURE.md) — System design
- [Plugin Engineering/PLUGIN_ENGINEERING_T1.md](./Plugin%20Engineering/PLUGIN_ENGINEERING_T1.md) — Neural pathway
- [Spider Agent/TOOLS/README.md](./Spider%20Agent/TOOLS/README.md) — Tool index
- [Spider Agent/HOOKS/README.md](./Spider%20Agent/HOOKS/README.md) — Hook index
