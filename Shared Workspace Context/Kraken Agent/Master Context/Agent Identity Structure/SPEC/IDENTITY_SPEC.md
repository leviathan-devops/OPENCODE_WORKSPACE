# Identity Specification — Kraken Agent

**Version:** 1.0
**Status:** Specification
**Created:** 2026-04-16

---

## Overview

This document specifies the technical implementation of the Agent Identity System for Kraken Agent.

---

## Directory Structure

```
kraken-agent/
├── identity/
│   ├── KRAKEN.json              # Model routing config
│   ├── orchestrator/
│   │   ├── SOUL.md             # Core identity
│   │   ├── IDENTITY.md         # Role definition
│   │   ├── EXECUTION.md        # Execution patterns
│   │   ├── SPIDER.md           # Quality gates
│   │   └── TOOLS.md            # Tool access
│   ├── planning/
│   │   ├── SOUL.md
│   │   ├── IDENTITY.md
│   │   ├── SPIDER.md
│   │   └── TOOLS.md
│   ├── execution/
│   │   ├── SOUL.md
│   │   ├── IDENTITY.md
│   │   ├── SPIDER.md
│   │   └── TOOLS.md
│   └── system/
│       ├── SOUL.md
│       ├── IDENTITY.md
│       ├── SPIDER.md
│       └── TOOLS.md
└── src/
    └── identity/
        ├── loader.ts
        ├── injector.ts
        ├── cache.ts
        ├── parser.ts
        ├── types.ts
        └── index.ts
```

---

## KRAKEN.json Schema

```typescript
interface KrakenIdentityConfig {
  agents: {
    [role: string]: string;  // Model ID
  };
  clusters: {
    [clusterName: string]: string;  // Cluster type
  };
  max_delegation_depth: number;
  identity: {
    directory: string;
    default_role: string;
    reinforcement_interval_hours: number;
  };
}
```

---

## Identity Bundle Schema

```typescript
interface IdentityBundle {
  role: string;
  soul: SoulContent;
  identity: IdentityContent;
  execution?: ExecutionContent;
  spider: SpiderContent;
  tools?: ToolsContent;
  metadata: {
    loadedAt: string;
    version: string;
    sourceDir: string;
  };
}

interface SoulContent {
  raw: string;
  directives: string[];
  philosophy: string;
  mantra: string;
  antiHallucinationProtocol?: string[];
}

interface IdentityContent {
  raw: string;
  title: string;
  role: string;
  expertise: string[];
  workingStyle: string[];
  trackRecord: string[];
  modelAssignment?: string;
}

interface ExecutionContent {
  raw: string;
  delegationPhilosophy: string;
  parallelPatterns: ParallelPattern[];
  delegationTriggers: DelegationTrigger[];
  escalationPath: string;
  neverDoDirectly: string[];
}

interface SpiderContent {
  raw: string;
  qualityGates: string[];
  antiHallucinationValidators: string[];
  debugProtocol: string[];
  stagnationDetection: StagnationRule[];
  guardianZones: GuardianZone[];
  evidenceHierarchy: EvidenceRule[];
}

interface ToolsContent {
  raw: string;
  openCode: ToolDefinition[];
  swarm: ToolDefinition[];
  cluster: ToolDefinition[];
  local?: ToolDefinition[];
}
```

---

## File Format Specifications

### SOUL.md

```markdown
# SOUL.md — {Role} Agent

You are a {role} agent. You are not a chatbot. You are an execution engine.

## Core Directives
1. [Directive 1 - mandatory EXECUTE/VERIFY/FAIL pattern]
2. [Directive 2]
3. [Directive 3]
4. [Directive 4 - optional]
5. [Directive 5 - optional]

## {Role-Specific Philosophy}
- [Philosophy statement 1]
- [Philosophy statement 2]

## Anti-Hallucination Protocol
- [Validator 1]
- [Validator 2]

## The Mantra
[One-line execution philosophy, imperative mood]
```

**Validation:**
- Must contain: `You are a .+ agent\.`
- Must contain: `## Core Directives`
- Must have: 3+ directives
- Must contain: `## The Mantra`

---

### IDENTITY.md

```markdown
# IDENTITY.md — {Role Title}

## Role
[One-paragraph role description]

## Expertise
- [Expertise area 1]
- [Expertise area 2]
- [Expertise area 3]

## Working Style
- [Behavioral expectation 1]
- [Behavioral expectation 2]

## Track Record
- [Accomplishment 1]
- [Accomplishment 2]

## Model Assignment (optional)
- [Model preference]
```

**Validation:**
- Must contain: `## Role`
- Must contain: `## Expertise`
- Must have: 3+ expertise items
- Must contain: `## Working Style`

---

### EXECUTION.md (Orchestrators Only)

```markdown
# EXECUTION.md — {Role} Execution Patterns

## Delegation Philosophy
[When and why to delegate vs. do directly]

## Parallel Patterns
- **Pattern Name:** [Description] → [Example]

## Delegation Triggers
- [Condition that triggers delegation] → [Action]
- [Condition 2] → [Action 2]
- [Condition 3] → [Action 3]

## Escalation Path
[When and how to escalate]

## Never Do Directly
- [Task type that should never be done personally]
- [Task type 2]
```

**Validation:**
- Must contain: `## Delegation Philosophy`
- Must contain: `## Delegation Triggers`
- Must have: 3+ triggers
- Must contain: `## Never Do Directly`

---

### SPIDER.md

```markdown
# SPIDER.md — {Role} Configuration

## Quality Gates
- [Gate 1]
- [Gate 2]

## Anti-Hallucination Validators
- [Validator 1]
- [Validator 2]

## Surgical Debug Protocol
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Step 4]
5. [Step 5]

## Stagnation Detection
- After [N] identical failures: [Action]
- After [M] iterations no progress: [Action]

## Guardian Zone Classification
- WORKSPACE: [Allowed/Conditional/NEVER]
- SYSTEM: [Allowed/Conditional/NEVER]
- PERSONAL: [Allowed/Conditional/NEVER]

## Evidence Hierarchy
- **STRONG:** [Acceptable evidence]
- **WEAK:** [Not acceptable]
```

---

### TOOLS.md

```markdown
# TOOLS.md — {Role} Environment

## OpenCode Tools
- **Tool:** [Description]

## Swarm Tools
- **Tool:** [Description]

## Cluster Tools
- **Tool:** [Description]
```

---

## API Specification

### IdentityLoader

```typescript
class IdentityLoader {
  constructor(baseDir: string = 'identity');

  async loadForRole(role: string): Promise<IdentityBundle>;
  async loadFile(role: string, file: IdentityFileType): Promise<string>;
  async listRoles(): Promise<string[]>;
  roleExists(role: string): Promise<boolean>;
}

type IdentityFileType = 'SOUL.md' | 'IDENTITY.md' | 'EXECUTION.md' | 'SPIDER.md' | 'TOOLS.md';
```

### IdentityInjector

```typescript
class IdentityInjector {
  constructor(loader: IdentityLoader);

  async inject(session: Session, role: string): Promise<void>;
  async reinject(session: Session): Promise<void>;
  shouldReinject(session: Session): boolean;
}
```

### IdentityCache

```typescript
class IdentityCache {
  get(role: string): IdentityBundle | null;
  set(role: string, bundle: IdentityBundle): void;
  invalidate(role: string): void;
  clear(): void;
  getStats(): CacheStats;
}
```

---

## Hook Registration

```typescript
// src/identity/index.ts
export function registerIdentityHooks(plugin: Plugin): void {
  plugin.hooks.add('session.started', async (session) => {
    const role = session.user?.selectedRole || 'orchestrator';
    await injector.inject(session, role);
  });

  plugin.hooks.add('tab.toggle', async (session) => {
    await injector.reinject(session);
  });

  plugin.hooks.add('compaction.before', async (session) => {
    await snapshotIdentity(session);
  });

  plugin.hooks.add('compaction.after', async (session) => {
    await restoreIdentity(session);
  });
}
```

---

## Error Codes

| Code | Type | Description |
|------|------|-------------|
| `IDENTITY_DIR_NOT_FOUND` | FileSystem | identity/ directory missing |
| `IDENTITY_FILE_NOT_FOUND` | FileSystem | Specific identity file missing |
| `SOUL_PARSE_ERROR` | Parse | SOUL.md missing required content |
| `IDENTITY_PARSE_ERROR` | Parse | IDENTITY.md missing required content |
| `EXECUTION_PARSE_ERROR` | Parse | EXECUTION.md missing required content |
| `INJECTION_FAILED` | Runtime | Could not inject into session |
| `CACHE_CORRUPT` | Cache | Cached data invalid |
| `COMPACTION_FAILED` | Compaction | Snapshot/restore failed |