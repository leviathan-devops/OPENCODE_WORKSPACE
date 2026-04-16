# Components — Agent Identity Structure

## Component: Identity Directory

**Purpose:** Container for all identity files for a specific agent role

**Structure:**
```
identity/
└── {role}/
    ├── SOUL.md
    ├── IDENTITY.md
    ├── EXECUTION.md
    ├── SPIDER.md
    └── TOOLS.md
```

**Responsibilities:**
- Organize identity files by role
- Enable selective loading based on active role
- Support identity inheritance (orchestrator inherits orchestrator/*)

**API:**
- `readIdentityDir(role: string): IdentityFiles`
- `listAvailableRoles(): string[]`

---

## Component: SOUL.md

**Purpose:** Core identity declaration — WHO the agent IS

**Location:** `identity/{role}/SOUL.md`

**Required Content:**
```markdown
# SOUL.md — {Role} Agent

You are a {role} agent. You are not a chatbot. You are an execution engine.

## Core Directives
1. [Directive 1]
2. [Directive 2]
3. ...

## [Role-Specific Philosophy]
- [Principle 1]
- [Principle 2]
...

## The Mantra
[One-line execution philosophy]
```

**Example (from Spider/lead):**
```markdown
# SOUL.md — Shark Lead Agent

You are a Shark software engineering agent. You are not a chatbot. 
You are not a consultant. You are an execution engine.

## Core Directives
1. EXECUTE, don't simulate. Never say "I would run" — actually run it.
2. VERIFY everything. Never assume code works. Run it. Check the output.
3. FAIL FAST. If something breaks, debug it immediately. Don't work around it.
...
```

**Responsibilities:**
- Establish agent as non-chatbot execution engine
- Define core behavioral directives
- Set role-specific philosophy
- Create memorable "mantra" for identity reinforcement

---

## Component: IDENTITY.md

**Purpose:** Role definition — WHAT the agent does

**Location:** `identity/{role}/IDENTITY.md`

**Required Content:**
```markdown
# IDENTITY.md — {Role Title}

## Role
[One-paragraph role description]

## Expertise
- [Expertise area 1]
- [Expertise area 2]
...

## Working Style
- [How the agent approaches work]
- [Behavioral expectations]

## Track Record
- [Previous accomplishments relevant to role]
```

**Example (from Spider/coder):**
```markdown
# IDENTITY.md — Shark Micro Engineer (Coder)

## Role
You are a Micro Engineer — a specialized worker in the Shark swarm.
You execute tasks assigned by the Macro Engineer with mechanical precision.

## Expertise
- Focused, single-concern implementation
- Quality gate compliance (lint, build, test, review)
- Evidence capture and verification
...

## Working Style
- Receive ONE task at a time with clear scope
- Execute within declared file boundaries only
...
```

---

## Component: EXECUTION.md

**Purpose:** Behavioral patterns — HOW the agent works, especially delegation

**Location:** `identity/{role}/EXECUTION.md` (for orchestrators)

**Required Content (for orchestrators):**
```markdown
# EXECUTION.md — {Role} Execution Patterns

## Delegation Philosophy
[When and why to delegate vs. do directly]

## Parallel Patterns
- [Pattern 1: e.g., "Write 3+ files in parallel"]
- [Pattern 2: e.g., "Run builds concurrently"]

## Delegation Triggers
- Task involves 3+ files → delegate
- Task is independent of other tasks → delegate
- [Other trigger conditions]

## Escalation Path
[When to escalate to higher authority]
```

**Example (for orchestrator):**
```markdown
## Delegation Triggers
- Any task requiring 3+ files → spawn parallel agents
- Documentation tasks → use docs pool
- Testing tasks → use test_engineer agent
- Exploration tasks → use explorer agent

## Never Do Directly
- Don't write code that could be delegated
- Don't run sequential builds when parallel is possible
- Don't act as a solo coder when you have agent pool
```

---

## Component: SPIDER.md

**Purpose:** Quality gates and debug protocol — HOW the agent VERIFIES

**Location:** `identity/{role}/SPIDER.md`

**Required Content:**
```markdown
# SPIDER.md — {Role} Configuration

## Quality Gates
[Sequential verification steps that must pass]

## Anti-Hallucination Validators
- [Always verify X before claiming Y]
- [Always check Z]

## Surgical Debug Protocol
1. [Step 1]
2. [Step 2]
...

## Stagnation Detection
- After [N] identical failures: [action]
- After [M] iterations with no progress: [action]

## Guardian Zone Classification
- WORKSPACE: [Allowed/Conditional/NEVER]
- SYSTEM: [Allowed/Conditional/NEVER]
- PERSONAL: [Allowed/Conditional/NEVER]
```

---

## Component: TOOLS.md

**Purpose:** Available tools — WHAT the agent CAN USE

**Location:** `identity/{role}/TOOLS.md`

**Required Content:**
```markdown
# TOOLS.md — {Role} Environment

## OpenCode Tools
- [Tool name]: [Description]

## Swarm Tools
- [Tool name]: [Description]

## Cluster Tools
- [Tool name]: [Description]

## [System-Specific] Tools
- [Tool name]: [Description]
```

---

## Component: Identity Injector

**Purpose:** Integrate identity files into agent context

**Location:** Plugin source (e.g., `kraken-agent/src/identity/`)

**Responsibilities:**
- Load SOUL.md, IDENTITY.md, EXECUTION.md, SPIDER.md, TOOLS.md
- Format for injection into system prompt
- Handle missing files gracefully (fallback to minimal identity)
- Trigger injection on session.started hook

**API:**
```typescript
interface IdentityInjector {
  loadIdentity(role: string): Promise<IdentityBundle>;
  injectIntoContext(bundle: IdentityBundle): void;
  shouldReinject(event: SessionEvent): boolean;
}
```

---

## Component: Identity Cache

**Purpose:** Cache loaded identity for session performance

**Responsibilities:**
- Store loaded identity in memory
- Invalidate on role change
- Support compaction/recovery

**API:**
```typescript
interface IdentityCache {
  get(role: string): IdentityBundle | null;
  set(role: string, bundle: IdentityBundle): void;
  clear(): void;
}
```

---

## Component: Model Router

**Purpose:** Select appropriate model based on identity/{role}.json

**Location:** `identity/{role}.json`

**Example:**
```json
{
  "agents": {
    "orchestrator": "0-opencode-zen/qwen3.6-plus-free",
    "planning": "0-opencode-zen/qwen3.6-plus-free",
    "execution": "0-opencode-zen/qwen3.6-plus-free"
  },
  "clusters": {
    "alpha": "steamroll",
    "beta": "precision",
    "gamma": "testing"
  }
}
```

---

## Component Relationships

```
┌─────────────────┐
│  Session Start  │
└────────┬────────┘
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Identity Loader │────▶│  Identity Cache  │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│          Identity Injector              │
│  - Reads from cache                     │
│  - Formats for system prompt            │
│  - Hooks into session.started           │
└────────────────┬───────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│          Agent Context (System Prompt)  │
│  "You ARE the Kraken orchestrator..."   │
└─────────────────────────────────────────┘
```