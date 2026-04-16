# Shark Agent — Consolidated Context Library

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/`  
**Purpose:** Self-contained archive of all Shark Agent non-operating files  
**Active Plugin:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/` (DO NOT MOVE - actively powers harness)
**Note:** Folder named "v4" for historical reasons; contains V4.7 production code.

---

## Folder Structure

```
Shark Agent/
├── 01_ORIGINAL_REPOS/           # Source repositories
├── 02_CONTEXT_LIBRARY/          # Shark-context documentation
├── 03_OPENCODE_PLUGIN/          # OpenCode plugin implementations
├── 04_BUILD_PACKAGES/            # Versioned build artifacts
├── 05_BUILD_REPORTS/             # Build reports from V4.x evolution
├── 06_AUDITS_HOTFIXES/          # Audits and hotfixes
├── 07_LEGACY_VERSIONS/          # Legacy Shark Agent versions
├── 08_KNOWLEDGE_BASE/           # Core architecture docs
├── SHARK_AGENT_BUILD_JOURNEY.md  # Full build history
└── shark_agent_implementation.md # Original implementation plan
```

---

## 01_ORIGINAL_REPOS

**Source repositories that Shark Agent evolved from or integrated with.**

| Folder | Description |
|--------|-------------|
| `shark-frankenstein/` | Unified system combining Guardian Firewall + Shark Agent + Safety Stack |
| `shark-agent-rebirth/` | Evolution with OpenCode integration, dual-brain architecture |
| `firewall-test/` | Guardian Firewall testing with Space Invaders demo |

### shark-frankenstein Key Files
```
shark-frankenstein/
├── src/guardian/           # Zone-based filesystem protection
├── src/firewall/            # FirewallMesh parallel security
├── src/stagnation/          # Loop prevention
├── src/workflow/            # PLAN→BUILD→TEST→VERIFY→SHIP enforcement
├── dist/                    # Compiled CLI
└── docs/                    # Architecture documentation
```

---

## 02_CONTEXT_LIBRARY

**Shark-context documentation libraries (reference materials for agents).**

| Folder | Description |
|--------|-------------|
| `shark-context/` | Core shark-context from V4 boilerplate (INDEX, MENTAL_MODEL, PURPOSE, REFERENCE/) |
| `build-context/` | Build-time context documentation (HOOKS_INTEGRATION, AUDIT, VERIFICATION, etc.) |
| `build-context-handover/` | Mission/INDEX handover docs |
| `shark-agent-context/` | Legacy context library structure |

### shark-context/ Contents
```
shark-context/
├── INDEX.md              # Entry point
├── MENTAL_MODEL.md       # T1: thinking process
├── PURPOSE.md           # T1: identity
└── REFERENCE/
    ├── ARCHITECTURE.md
    ├── BRAIN_MODELS.md
    ├── BUILD_WORKFLOW.md
    ├── ESCALATION.md
    ├── PATTERNS.md
    ├── SHARK_VARIANTS.md
    └── VERIFICATION.md
```

---

## 03_OPENCODE_PLUGIN

**OpenCode plugin implementations (not the active V4 harness).**

| Folder | Description |
|--------|-------------|
| `shark-agent-boilerplate-template/` | V4.0 boilerplate template |
| `shark-agent/` | Older shark-agent (before V4) |
| `shark-agent-plugin/` | Plugin iteration |
| `shark-opencode-integration/` | OpenCode integration work |
| `shark-gemini-proxy/` | Gemini proxy service |

### shark-agent-boilerplate-template/ Contents
```
shark-agent-boilerplate-template/
├── src/
│   ├── factory/
│   │   ├── StateStore.ts
│   │   ├── BrainMessenger.ts
│   │   └── types.ts
│   ├── hooks/
│   │   └── safe-hook.ts
│   └── tools/
├── shark-context/
├── package.json
└── tsconfig.json
```

---

## 04_BUILD_PACKAGES

**Versioned build artifacts and backups.**

| Folder | Description |
|--------|-------------|
| `shark-agent-v4.7/` | V4.7 build (CURRENT - Source File Edit Block upgrade) |
| `manta-shark-v4.6/` | V4.6 (Manta/Shark split + agent identity isolation) |
| `shark-agent-v4.1-backup/` | V4.1 backup |
| `shark-agent-v4.3-backup/` | V4.3 backup |
| `shark-agent-v4.4-backup/` | V4.4 backup |

### shark-agent-v4.7/ Key Files
```
shark-agent-v4.7/
├── src/
│   ├── index.ts                    # Plugin entry point
│   ├── shark/
│   │   ├── micro/
│   │   │   ├── coordinator.ts     # Mechanical Plan↔Build switcher
│   │   │   └── brains.ts          # Plan + Build Brain T1
│   │   ├── macro/
│   │   │   ├── peer-dispatch.ts   # Triple-brain coordinator
│   │   │   └── brains.ts          # Execution + Reasoning + System T1
│   │   └── shared/
│   │       ├── state-store.ts
│   │       ├── messenger.ts
│   │       ├── guardian.ts
│   │       ├── gates.ts
│   │       └── evidence.ts
│   ├── hooks/v4.1/
│   │   ├── index.ts
│   │   ├── guardian-hook.ts
│   │   ├── gate-hook.ts
│   │   ├── session-hook.ts
│   │   ├── compacting-hook.ts
│   │   └── system-transform-hook.ts
│   └── tools/
│       ├── shark-status.ts
│       ├── shark-gate.ts
│       ├── shark-evidence.ts
│       ├── checkpoint.ts
│       └── shark-test-runner.ts
├── shark-context/
├── dist/
└── package.json
```

---

## 05_BUILD_REPORTS

**Build reports documenting the V4.x evolution.**

| File | Version | Date |
|------|---------|------|
| `shark-agent-v4-build-report-2026-04-05.md` | V4.0 | 2026-04-05 |
| `shark-agent-v4.1-build-report-2026-04-06.md` | V4.1 | 2026-04-06 |
| `shark-agent-v4.2-build-report-2026-04-06.md` | V4.2 | 2026-04-06 |
| `shark-agent-v4.3-build-report-2026-04-06.md` | V4.3 | 2026-04-06 |
| `shark-agent-v4.4-build-report-2026-04-06.md` | V4.4 | 2026-04-06 |
| `shark-agent-v4.5-build-report-2026-04-06.md` | V4.5 | 2026-04-06 |

### Subfolders
- `shark-agent-v4.1-v4.2-fix-package/` — Fix package between V4.1 and V4.2
- `shark-agent-v4.2-v4.3-fix-package/` — Fix package between V4.2 and V4.3
- `shark-agent-v4-CRITICAL-AUDIT-V4.4/` — Critical audit for V4.4
- `shark-agent-v4-CRITICAL-HOTFIX/` — Critical hotfix materials
- `shark-agent-v4.5-AUDIT/` — V4.5 audit materials

---

## 06_AUDITS_HOTFIXES

**Detailed audits and hotfixes from the V4.x development.**

| File | Description |
|------|-------------|
| `shark-agent-v4-first-build-audit-2026-04-07.md` | First build audit (V4.5) |
| `shark-agent-v4-audit-002-v4.5.md` | Second audit (V4.5 iteration) |
| `shark-agent-v4-audit-hotfix-001.md` | Hotfix 001 addressing audit gaps |
| `shark-agent-v4-audit-hotfix-002.md` | Hotfix 002 with test results |

---

## 07_LEGACY_VERSIONS

**Legacy Shark Agent implementations from different eras.**

| Folder | Description |
|--------|-------------|
| `Shark Agent Plugin/` | Legacy Shark Agent Plugin (v1, v2, v3, v4.5) |
| `Shark Agent CLI/` | Original Shark Agent CLI |
| `Shark Researcher/` | Research agent for Shark architecture |

### Shark Agent Plugin/ Contents
```
Shark Agent Plugin/
├── shark-agent/
│   └── BUILD_SPEC.md
├── shark-agent-context-library/
│   ├── 01_concepts/           # Claims, dual-brain, guardian, state-machine, verification-gates
│   ├── 02_opencode_plugin/     # Hook system documentation
│   ├── 03_v4_boilerplate/     # Key files, types reference
│   ├── 04_skeleton_patterns/   # Agent config, plugin entry
│   └── 05_reference_implementations/  # Autodebug, coordinator, guardian, etc.
├── v1/                        # Version 1 implementation
├── v2/                        # Version 2 implementation
├── v3_hive_integration/       # Hive integration version
└── v4.5/                      # V4.5 variant
```

### Shark Agent CLI/ Contents
```
Shark Agent CLI/
├── src/
│   ├── index.ts
│   ├── guardian/
│   └── enforcement/
├── shark-agent/               # Embedded shark-agent
├── skills/shark/              # Shark skills (shark-loop, shark-client, shark-brain)
├── BUILD-WORKFLOW.md
├── SHARK-ARCHITECTURE.md
├── MECHANICAL_ENFORCEMENT_INTEGRATION_POINTS.md
└── SHARK_MECHANICAL_ENFORCEMENT_PLAN.md
```

---

## 08_KNOWLEDGE_BASE

**Core architecture documentation extracted from the knowledge base.**

| File | Description |
|------|-------------|
| `00_ORIGINAL_SHARK_AGENT.md` | Original Shark Agent architecture (pre-OpenCode) |
| `01_DUAL_BRAIN_SYSTEM.md` | Dual-brain reasoning system |
| `02_SAFETY_STACK.md` | 4-layer mechanical enforcement |
| `03_GUARDIAN_FIREWALL.md` | Zone-based filesystem protection |
| `04_ALGORITHMIC_SYSTEMS.md` | AutoDebug and other algorithmic systems |

---

## Key Paths Reference

### Active Harness (DO NOT MOVE)
```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/  # ACTIVE WORKING PLUGIN (contains V4.7 code)
```

> **Note:** Folder named "v4" for historical reasons; this is the production V4.7 harness.

### Original Repositories
```
https://github.com/leviathan-devops/guardian-firewall
https://github.com/leviathan-devops/shark-agent
```

### Guardian Firewall Architecture
- Zone Classification: SYSTEM, PROJECT, TEMP, USER, CUSTOM
- Guardian connects to ToolExecutor as Constitutional Anchor
- All tool calls flow through pre-operation safety checks

---

## Version History Summary

| Version | Focus | Key Innovation |
|---------|-------|---------------|
| V4.0 | Shell | Inert plugin, primitives defined |
| V4.1 | Functional | Hooks wired, evidence path fixed |
| V4.2 | Honest | Guardian advisory-only documented |
| V4.3 | Precision | Documentation accuracy |
| V4.4 | Critical | Self-rejection, iteration loop |
| V4.5 | Mechanical Brain | Coordinators, brain switching |
| V4.6 | Agent Isolation | Manta/Shark split, identity filtering |
| V4.7 | Source Protection | Copy → Version → Edit Copy workflow |

---

*Consolidated: 2026-04-08*  
*Active plugin: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/` (V4.7 production code)*