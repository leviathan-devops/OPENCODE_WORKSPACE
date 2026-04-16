# Shark Agent — Context Library

Context for building Shark Agent on the v4 OpenCode plugin boilerplate.

## What's Here

```
shark-agent-context-library/
├── README.md                        — This file
│
├── 01_concepts/
│   ├── README.md                   — Shark architecture concepts explained
│   ├── dual-brain.md               — Why separate thinking from doing
│   ├── state-machine.md            — Phase enforcement as brick wall
│   ├── guardian.md                 — Zone-based path protection
│   ├── claims.md                   — Anti-hallucination via claims documents
│   └── verification-gates.md       — 3-gate quality enforcement
│
├── 02_opencode_plugin/
│   ├── README.md                   — OpenCode plugin anatomy
│   ├── agent-registration.md       — Tab toggle registration pattern (from HOTFIX_LOG)
│   └── hook-system.md              — OpenCode hook types and signatures
│
├── 03_v4_boilerplate/
│   ├── README.md                   — V4 factory architecture explained
│   └── key_files/
│       ├── factory_index.md        — ArchitectureFactory, AgentFactory, etc.
│       ├── types_reference.md       — Core type definitions
│       └── state_store.md          — Shared state with domain ownership
│
├── 04_skeleton_patterns/
│   ├── README.md                   — Copy-paste scaffold patterns
│   ├── plugin_entry.md             — Minimal src/index.ts that works
│   ├── agent_config.md             — Agent config structure for tab toggle
│   ├── hook_skeleton.md            — Hook implementation skeleton
│   └── tool_skeleton.md            — Tool implementation skeleton
│
├── 05_reference_implementations/
│   ├── README.md                   — Reference code from prior work
│   ├── guardian.md                 — Guardian class (from shark-frankenstein)
│   ├── workflow-machine.md         — WorkflowMachine (from shark-frankenstein)
│   ├── coordinator.md              — DualBrainCoordinator (from shark-frankenstein)
│   └── autodebug.md               — AutoDebugEngine (from shark-frankenstein)
│
└── 06_quality_tools/
    ├── README.md                   — Quality/security tools reference
    ├── quality_tools_fixed.md       — lint, diff, build_check, syntax_check
    ├── security_tools_fixed.md      — test_runner, placeholder_scan, sast_scan (secret_scan FIXED)
    ├── session_tools.md            — checkpoint, sessions, snapshots
    └── memory_tools.md             — hermes_recall, hermes_remember, hermes_context
```

## How to Use This Library

**Start with:**
1. `01_concepts/README.md` — understand the architecture
2. `02_opencode_plugin/README.md` + `agent-registration.md` — understand the plugin surface
3. `04_skeleton_patterns/README.md` — use the copy-paste scaffolds

**When implementing a component:**
1. Find the skeleton in `04_skeleton_patterns/`
2. Reference the implementation in `05_reference_implementations/`
3. For OpenCode hook signatures, read `02_opencode_plugin/hook-system.md`

**For v4 boilerplate questions:**
- Types: `03_v4_boilerplate/key_files/types_reference.md`
- Factory: `03_v4_boilerplate/key_files/factory_index.md`
- State store: `03_v4_boilerplate/key_files/state_store.md`

## Key Insight: What the Boilerplate Does NOT Do

The v4 boilerplate provides:
- Factory pattern for creating agents from config
- State store with domain ownership
- Brain messenger for inter-brain handoffs
- Cluster management
- Validator pipeline
- Hook wiring scaffold

The boilerplate does NOT provide:
- Guardian (zone classification + path protection)
- Workflow state machine (phase enforcement)
- Claims document system
- Verification gate runners
- Auto-debug engine
- Any Shark-specific agents or tools

All of the above must be built from scratch, using `05_reference_implementations/` as reference material.
