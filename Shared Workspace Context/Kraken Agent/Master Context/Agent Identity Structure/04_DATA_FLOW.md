# Data Flow — Agent Identity Structure

## Entry Points

### 1. Session Initialization Flow

```
User selects agent role in GUI
        │
        ▼
Plugin loads (index.ts)
        │
        ▼
session.started hook fires
        │
        ▼
Identity Loader reads identity/{role}/ directory
        │
        ├── SOUL.md ──────────────────────┐
        ├── IDENTITY.md ─────────────────┤
        ├── EXECUTION.md ────────────────┤
        ├── SPIDER.md ───────────────────┤
        └── TOOLS.md ────────────────────┤
                                        │
                                        ▼
                            Identity Cache (memory)
                                        │
                                        ▼
                            Identity Injector formats
                            for system prompt injection
                                        │
                                        ▼
                            Agent Context (System Prompt)
                            "You ARE the Kraken orchestrator..."
```

---

### 2. Sub-Agent Spawning Flow

```
Orchestrator receives task
        │
        ▼
Orchestrator identifies sub-tasks
        │
        ▼
spawn_shark_agent() called with:
{
  task: "Write planning brain",
  context: {
    identity: "planning",
    files: ["planning-brain.ts"],
    ...
  }
}
        │
        ▼
Sub-agent session starts
        │
        ▼
Identity Loader reads identity/planning/
        │
        ▼
Sub-agent context includes planning identity
        │
        ▼
Sub-agent knows it's a PLANNING agent
        (not a general coder)
```

---

### 3. Compaction Recovery Flow

```
Compaction triggered
        │
        ▼
Identity Bundle saved to:
  Compaction Survival/
    └── identity_snapshot.json
        │
        ├── active_role: "orchestrator"
        ├── SOUL: "..."
        ├── IDENTITY: "..."
        ├── EXECUTION: "..."
        └── TIMESTAMP: "..."
        │
        ▼
Session recovers
        │
        ▼
Identity Loader reads snapshot
        │
        ▼
Identity Cache restored
        │
        ▼
Agent continues with same identity
```

---

## Processing Pipeline

### Identity Loading Pipeline

```
┌─────────────┐
│ Read dir    │ identity/{role}/
└──────┬──────┘
       ▼
┌─────────────┐
│ Parse files │ SOUL.md, IDENTITY.md, EXECUTION.md, SPIDER.md, TOOLS.md
└──────┬──────┘
       ▼
┌─────────────┐
│ Validate    │ Required fields present?
└──────┬──────┘
       ▼
┌─────────────┐
│ Merge       │ Combine into IdentityBundle
└──────┬──────┘
       ▼
┌─────────────┐
│ Format      │ Markdown → System prompt format
└──────┬──────┘
       ▼
┌─────────────┐
│ Inject      │ Add to agent context
└──────┬──────┘
       ▼
┌─────────────┐
│ Cache       │ Store in memory for session
└─────────────┘
```

---

## Identity Bundle Schema

```typescript
interface IdentityBundle {
  role: string;
  soul: {
    directives: string[];
    philosophy: string;
    mantra: string;
  };
  identity: {
    role: string;
    expertise: string[];
    workingStyle: string[];
    trackRecord: string[];
  };
  execution?: {
    delegationPhilosophy: string;
    parallelPatterns: string[];
    delegationTriggers: string[];
    escalationPath: string;
  };
  spider: {
    qualityGates: string[];
    antiHallucinationValidators: string[];
    debugProtocol: string[];
    stagnationDetection: { threshold: number; action: string }[];
    guardianZones: { zone: string; permission: string }[];
  };
  tools?: {
    openCode: { name: string; description: string }[];
    swarm: { name: string; description: string }[];
    cluster: { name: string; description: string }[];
  };
  loadedAt: string;
  version: string;
}
```

---

## Injection Formats

### System Prompt Injection Format

```markdown
## IDENTITY

You ARE the Kraken orchestrator. You are not a chatbot. You are an execution engine.

### Core Directives
1. EXECUTE, don't simulate...
2. VERIFY everything...
3. FAIL FAST...
...

### Role
You are the Macro Engineer — the lead orchestrator of the Kraken swarm.
You architect systems, decompose complex problems, and coordinate worker agents.

### Delegation Philosophy
- Any task requiring 3+ files → spawn parallel agents
- Independent tasks → delegate immediately
- Don't act as a solo coder when you have agent pool

### Available Tools
- spawn_shark_agent: Spawn sub-agent for heavy tasks
- run_parallel_tasks: Batch parallel execution
...

### Quality Gates
- All code must pass: diff → syntax_check → lint → build_check → reviewer
- No task completes without evidence
...

### The Mantra
Execute, don't simulate. Verify, don't assume. Delegate, don't hoard.
```

---

## State Management

### Session State with Identity

```typescript
interface SessionState {
  // Identity state
  activeRole: string;
  identityBundle: IdentityBundle | null;
  identityLoadedAt: string | null;
  lastReinforcementAt: string | null;

  // Model state
  activeModel: string;
  modelByRole: Record<string, string>;

  // Delegation state
  activeDelegations: Delegation[];
  completedDelegations: Delegation[];

  // Compaction
  compactionCount: number;
  lastCompactionAt: string | null;
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     SESSION LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INIT ──────▶ IDLE ──────▶ TASK ──────▶ DELEGATE ──────▶ DONE   │
│                  │            │             │                   │
│                  │            │             ▼                   │
│                  │            │        SUBTASK                 │
│                  │            │             │                   │
│                  │            │             ◀───────────────────│
│                  │            │                               │
│                  ▼            ▼                               │
│            COMPACTION    COMPLETION                           │
│                  │            │                               │
│                  ▼            ▼                               │
│            RECOVERY ────▶ FINAL                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

LEGEND:
- INIT: Load identity from files
- IDLE: Awaiting task, identity in context
- TASK: Processing main task
- DELEGATE: Spawning sub-agents (uses identity to decide)
- SUBTASK: Sub-agent has its own identity
- COMPACTION: Identity persisted
- RECOVERY: Identity restored from snapshot
- COMPLETION: All tasks done
- FINAL: Session ends
```

---

## Key Injection Points

| Event | Action | Purpose |
|-------|--------|---------|
| `session.started` | Load + inject identity | Primary identity establishment |
| Tab toggle to agent | Re-inject identity | Reinforce identity after context switch |
| New task assigned | Check if role changed | Update identity if role changed |
| Compaction triggered | Persist identity to snapshot | Enable recovery |
| Post-compaction | Restore identity from snapshot | Maintain identity continuity |
| Sub-agent spawned | Load sub-agent identity | Per-agent identity |