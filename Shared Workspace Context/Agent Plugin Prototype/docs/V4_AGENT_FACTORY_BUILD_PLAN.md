# IMPLEMENTATION PLAN: plugin-agent-prototype-v4
## Agent Factory Edition — Config-Driven Agent System

**Purpose**: Restructure agent system from code-defined personas to config-driven factory pattern.
**Prerequisite**: Built on top of V3 (Agent Coordination Edition).

**Goal**: Agents are defined in config files, loaded at runtime. The `agents/` directory becomes a template library, not a fixed roster.

---

## 1. Why V4

### Current Problem (V3)

V3 hardcodes agent personas:
```
agents/
├── architect.ts    # Fixed, always exists
├── coder.ts        # Fixed, always exists
├── reviewer.ts     # Fixed, always exists
...
```

You can't easily:
- Add a new agent without creating a new file
- Remove an agent without deleting a file
- Customize agent prompts/tools without modifying source
- Define project-specific agents in config

### V4 Solution

```
agents/
├── factory.ts            # Runtime agent factory
├── templates/           # Template library (copy from, don't modify)
│   ├── architect.ts
│   ├── coder.ts
│   ├── reviewer.ts
│   ├── test-engineer.ts
│   ├── sme.ts
│   ├── explorer.ts
│   ├── critic.ts
│   └── ...
├── defaults.ts          # Default template config
└── index.ts            # Exports factory + helpers
```

Agents are defined in config:
```typescript
// shark-config.ts
const sharkConfig = {
  agents: {
    'architect': { ... },  // Defined in config
    'coder': { ... },
    'code-surgeon': { name: 'code-surgeon', ... },  // Custom
  }
};
```

---

## 2. Architecture Changes

### 2.1 Directory Structure (V4 Target)

```
plugin-agent-prototype-v4/
├── src/
│   ├── coordination/              # FROM V3
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── delegation.ts
│   │   ├── state-machine.ts
│   │   ├── defaults/
│   │   │   └── states.ts
│   │   ├── hooks/
│   │   │   ├── gate-hook.ts
│   │   │   ├── guardrail-hook.ts
│   │   │   ├── slop-detector-hook.ts
│   │   │   └── brainstorm-gate.ts
│   │   ├── persistence/
│   │   │   ├── swarm-state.ts
│   │   │   ├── plan-store.ts
│   │   │   ├── evidence-store.ts
│   │   │   └── checkpoint-store.ts
│   │   ├── tools/
│   │   │   ├── delegate.ts
│   │   │   ├── checkpoint.ts
│   │   │   ├── phase-complete.ts
│   │   │   ├── swarm-status.ts
│   │   │   └── evidence.ts
│   │   └── commands/
│   │       └── registry.ts
│   │
│   ├── agents/                    # RESTRUCTURED: Factory + Templates
│   │   ├── factory.ts            # NEW: Runtime agent factory
│   │   ├── templates/            # NEW: Template library
│   │   │   ├── architect.ts      # Architect prompt template
│   │   │   ├── coder.ts         # Coder prompt template
│   │   │   ├── reviewer.ts      # Reviewer prompt template
│   │   │   ├── test-engineer.ts # Test engineer prompt template
│   │   │   ├── sme.ts           # Subject matter expert template
│   │   │   ├── explorer.ts      # Explorer prompt template
│   │   │   ├── critic.ts         # Critic prompt template
│   │   │   ├── designer.ts      # Designer prompt template
│   │   │   └── index.ts         # Template registry
│   │   ├── defaults.ts           # NEW: Default agent configs
│   │   └── index.ts              # UPDATED: Exports factory functions
│   │
│   ├── clusters/                 # FROM V3 (optional)
│   │   ├── index.ts
│   │   ├── execution.ts
│   │   ├── qa.ts
│   │   └── research.ts
│   │
│   ├── brains/                   # FROM V3 (optional)
│   │   ├── index.ts
│   │   └── orchestrator.ts
│   │
│   ├── config/                   # FROM V3 (updated)
│   │   ├── schema.ts            # Agent config in coordination schema
│   │   ├── loader.ts
│   │   ├── constants.ts
│   │   └── templates/           # Architecture config templates
│   │       ├── shark.ts         # Shark 3-brain config
│   │       ├── spider.ts        # Spider 11-agent config
│   │       ├── hermes.ts        # Hermes config
│   │       ├── hydra.ts         # Hydra 5-brain config
│   │       └── index.ts
│   │
│   ├── hooks/                   # FROM V3
│   ├── tools/                   # FROM V3
│   ├── services/                # FROM V3
│   ├── utils/                   # FROM V3
│   └── index.ts                # UPDATED: Uses agent factory
│
├── docs/
│   ├── V3_IMPLEMENTATION_EDITS.md
│   ├── V4_AGENT_FACTORY_BUILD_PLAN.md  # This file
│   └── ARCHITECTURE_CONFIGS.md         # Example configs (shark, spider, etc.)
│
└── tests/
    ├── unit/
    │   ├── coordination/        # FROM V3
    │   ├── agents/             # NEW
    │   │   ├── factory.test.ts
    │   │   └── templates.test.ts
    │   └── hooks/
    └── integration/
```

---

## 3. Implementation Phases

### Phase V4-1: Agent Factory Core
**Files to create**: 3 files

#### 1. `src/agents/factory.ts`
```typescript
import type { AgentDefinition, AgentMode } from '../coordination/types.js';
import { z } from 'zod';

// Agent config from user config file
export const AgentConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  mode: z.enum(['primary', 'subagent', 'all']),
  cluster: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().optional(),
  tools: z.array(z.string()).optional(),
  prompt: z.string(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export interface AgentFactory {
  createAgent(config: AgentConfig): AgentDefinition;
  createAgents(configs: Record<string, AgentConfig>): Record<string, AgentDefinition>;
  extendAgent(name: string, base: AgentConfig, overrides: Partial<AgentConfig>): AgentConfig;
}

export function createAgentFactory(): AgentFactory {
  return {
    createAgent(config: AgentConfig): AgentDefinition {
      return {
        name: config.name,
        description: config.description ?? `${config.name} agent`,
        mode: config.mode,
        cluster: config.cluster,
        model: config.model,
        temperature: config.temperature ?? 0.7,
        tools: config.tools?.reduce((acc, t) => ({ ...acc, [t]: true }), {}),
        prompt: config.prompt,
      };
    },

    createAgents(configs: Record<string, AgentConfig>): Record<string, AgentDefinition> {
      const agents: Record<string, AgentDefinition> = {};
      for (const [name, config] of Object.entries(configs)) {
        agents[name] = this.createAgent({ ...config, name });  // Ensure name matches
      }
      return agents;
    },

    extendAgent(name: string, base: AgentConfig, overrides: Partial<AgentConfig>): AgentConfig {
      return {
        ...base,
        name,
        ...overrides,
        // Merge tools if both exist
        tools: overrides.tools 
          ? [...(base.tools ?? []), ...overrides.tools]
          : base.tools,
      };
    },
  };
}
```

#### 2. `src/agents/defaults.ts`
```typescript
import type { AgentConfig } from './factory.js';

export interface AgentTemplate {
  config: AgentConfig;
  description: string;
  tools: string[];
}

export const DEFAULT_AGENTS: Record<string, AgentTemplate> = {
  architect: {
    description: 'Primary orchestrator - owns the plan, delegates all work',
    tools: ['checkpoint', 'save_plan', 'evidence_check', 'delegate_task', 'swarm_status', 'phase_complete'],
    config: {
      name: 'architect',
      mode: 'primary',
      prompt: `You are the Architect - the control brain of the agent system.

## Your Role
- Own the project plan and make all delegation decisions
- Synthesize inputs from other agents
- Handle failures and escalations
- Maintain project context

## Core Principles
1. **Quality over speed** - Never skip QA gates
2. **One task at a time** - Serial execution prevents chaos
3. **Every task gets verified** - Before the next starts

## Delegation Rules
- Delegate to @coder for implementation
- Delegate to @reviewer for verification
- Delegate to @test_engineer for test generation
- Delegate to @explorer for context gathering
- Delegate to @sme for domain expertise
- NEVER let an agent approve its own output

Start by understanding the user's request. If unclear, ask clarifying questions.`,
    },
  },

  coder: {
    description: 'Implements tasks one at a time, no batching',
    tools: ['write', 'edit', 'patch', 'create_file', 'insert', 'replace', 'apply_patch'],
    config: {
      name: 'coder',
      mode: 'subagent',
      prompt: `You are the Coder - you implement tasks exactly as specified.

## Your Role
- Receive specific, bounded tasks from the architect
- Implement one task at a time
- Never batch multiple tasks
- Never skip QA gates

## Constraints
- Do NOT review your own code - that is the reviewer's job
- Do NOT write tests - that is the test engineer's job
- If you encounter issues, escalate to the architect

## Output
After completing a task, report what was done and wait for the next delegation.`,
    },
  },

  reviewer: {
    description: 'Correctness and security review',
    tools: ['evidence_check', 'retrieve_summary', 'knowledge_query', 'lint', 'diff'],
    config: {
      name: 'reviewer',
      mode: 'subagent',
      prompt: `You are the Reviewer - you verify correctness and security.

## Your Role
- Review code for correctness
- Check for security vulnerabilities
- Verify evidence completeness
- NEVER approve your own review

## Review Criteria
1. Does the code do what the task asked?
2. Are there security concerns?
3. Is the code readable and maintainable?
4. Are there missing error handlers?

## Constraints
- Be thorough but constructive
- If you find issues, report them clearly
- If code is good, say so explicitly`,
    },
  },

  test_engineer: {
    description: 'Test generation and verification',
    tools: ['test_runner', 'retrieve_summary', 'evidence_check'],
    config: {
      name: 'test_engineer',
      mode: 'subagent',
      prompt: `You are the Test Engineer - you ensure adequate test coverage.

## Your Role
- Write failing tests BEFORE implementation (TDD)
- Verify existing tests pass
- Report test coverage gaps

## Workflow
1. Receive task from architect
2. Write failing test that defines expected behavior
3. Implement the code
4. Verify test passes
5. Report results

## Constraints
- Tests must be deterministic
- Each test should test ONE thing
- Include edge cases`,
    },
  },

  sme: {
    description: 'Subject matter expert for domain expertise',
    tools: ['knowledge_query', 'retrieve_summary'],
    config: {
      name: 'sme',
      mode: 'subagent',
      prompt: `You are the Subject Matter Expert - you provide domain expertise.

## Your Role
- Answer questions about specific domains
- Provide context the architect needs for planning
- Research and report on unfamiliar topics

## Constraints
- Be precise and cite sources when possible
- If you don't know, say so
- Provide options when multiple approaches exist`,
    },
  },

  explorer: {
    description: 'Codebase scanning and context gathering',
    tools: ['complexity_hotspots', 'detect_domains', 'extract_code_blocks', 'gitingest', 'imports', 'symbols'],
    config: {
      name: 'explorer',
      mode: 'subagent',
      prompt: `You are the Explorer - you gather codebase context.

## Your Role
- Scan codebase structure
- Identify complexity hotspots
- Detect file dependencies
- Extract relevant code blocks

## Output
Provide structured findings the architect can use for planning.`,
    },
  },

  critic: {
    description: 'Plan critique before execution',
    tools: ['evidence_check', 'retrieve_summary'],
    config: {
      name: 'critic',
      mode: 'subagent',
      prompt: `You are the Critic - you critique plans before execution.

## Your Role
- Review the architect's plan for flaws
- Identify potential failure modes
- Suggest improvements

## Constraints
- Be direct but constructive
- Focus on practical issues
- Don't nitpick - focus on blockers`,
    },
  },
};
```

#### 3. `src/agents/templates/index.ts`
```typescript
// Re-exports all templates for easy access
export { DEFAULT_AGENTS, type AgentTemplate } from '../defaults.js';
export { createAgentFactory, AgentConfigSchema, type AgentConfig, type AgentFactory } from './factory.js';
```

---

### Phase V4-2: Agent Templates
**Files to create**: 7 files (architect, coder, reviewer, test-engineer, sme, explorer, critic)

These are individual files that export the template data. They're organized this way so you can copy/modify individual templates without touching others.

#### 4. `src/agents/templates/architect.ts`
```typescript
import type { AgentTemplate } from './index.js';

export const architectTemplate: AgentTemplate = {
  description: 'Primary orchestrator - owns the plan, delegates all work',
  tools: ['checkpoint', 'save_plan', 'evidence_check', 'delegate_task', 'swarm_status', 'phase_complete'],
  config: {
    name: 'architect',
    mode: 'primary',
    prompt: `You are the Architect - the control brain of the agent system.

... (full prompt from defaults.ts) ...`,
  },
};
```

(Similar structure for: coder.ts, reviewer.ts, test-engineer.ts, sme.ts, explorer.ts, critic.ts)

---

### Phase V4-3: Agent Config Templates
**Files to create**: 5 files

#### 11. `src/config/templates/shark.ts`
```typescript
import { createAgentFactory, DEFAULT_AGENTS } from '../../agents/index.js';

const factory = createAgentFactory();

export const sharkAgents = factory.createAgents({
  // Primary brains
  'shark-brain': factory.extendAgent('shark-brain', DEFAULT_AGENTS.architect.config, {
    description: 'Shark top-level orchestrator',
    cluster: 'orchestration',
    tools: [...DEFAULT_AGENTS.architect.tools, 'hermes_recall', 'hermes_remember'],
    prompt: `You are the Shark Brain - the top-level orchestrator of the Shark agent system.

## Your Role
- Coordinate the macro and micro brains
- Make final delegation decisions
- Ensure quality gates are enforced

## The Three Brains
1. **Shark Brain** (you) - Top level coordination
2. **Macro Brain** - Strategic planning and architecture
3. **Micro Brain** - Tactical execution oversight

... (full shark-specific prompt) ...`,
  }),

  'macro-brain': {
    name: 'macro-brain',
    mode: 'primary',
    cluster: 'orchestration',
    description: 'Strategic planning and architecture',
    tools: ['save_plan', 'checkpoint', 'delegate_task', 'phase_complete'],
    prompt: `You are the Macro Brain - you handle strategic planning.

## Your Focus
- Long-term architecture decisions
- Phase planning
- Risk assessment
- Resource coordination

You delegate tactical tasks to the Micro Brain.`,
  },

  'micro-brain': {
    name: 'micro-brain',
    mode: 'primary',
    cluster: 'orchestration',
    description: 'Tactical execution oversight',
    tools: ['delegate_task', 'swarm_status', 'evidence_check'],
    prompt: `You are the Micro Brain - you handle tactical execution.

## Your Focus
- Immediate task prioritization
- QA gate enforcement
- Progress tracking
- Blocker resolution

You escalate strategic issues to the Macro Brain.`,
  },

  // Execution cluster
  'coder': factory.extendAgent('coder', DEFAULT_AGENTS.coder.config, {
    prompt: `... (shark-specific coder prompt) ...`,
  }),

  'tester': factory.extendAgent('test_engineer', DEFAULT_AGENTS.test_engineer.config, {
    name: 'tester',
    prompt: `... (shark-specific tester prompt) ...`,
  }),

  // QA cluster
  'reviewer': factory.extendAgent('reviewer', DEFAULT_AGENTS.reviewer.config, {
    prompt: `... (shark-specific reviewer prompt) ...`,
  }),

  // Research cluster
  'explorer': factory.extendAgent('explorer', DEFAULT_AGENTS.explorer.config, {
    prompt: `... (shark-specific explorer prompt) ...`,
  }),

  'sme': factory.extendAgent('sme', DEFAULT_AGENTS.sme.config, {
    prompt: `... (shark-specific sme prompt) ...`,
  }),
});

export const sharkConfig = {
  swarmId: 'shark',
  swarmName: 'Shark Agent',
  version: '1.0.0',
  agents: sharkAgents,
  clusters: {
    orchestration: {
      id: 'orchestration',
      name: 'Orchestration',
      agents: ['shark-brain', 'macro-brain', 'micro-brain'],
      intraClusterDelegation: true,
      interClusterDelegation: true,
      sharedContext: true,
    },
    execution: {
      id: 'execution',
      name: 'Execution',
      agents: ['coder', 'tester'],
      intraClusterDelegation: true,
      interClusterDelegation: false,
    },
    qa: {
      id: 'qa',
      name: 'Quality Assurance',
      agents: ['reviewer'],
      intraClusterDelegation: false,
      interClusterDelegation: true,
    },
    research: {
      id: 'research',
      name: 'Research',
      agents: ['explorer', 'sme'],
      intraClusterDelegation: true,
      interClusterDelegation: true,
    },
  },
  // ... rest of coordination config
};
```

#### 12-15. Similar for spider.ts, hermes.ts, hydra.ts, index.ts

---

### Phase V4-4: Updated Agent Index
**Files to modify**: 1 file

#### 16. `src/agents/index.ts`
```typescript
// UPDATED from v3
export { createAgentFactory, AgentConfigSchema, type AgentConfig, type AgentFactory } from './factory.js';
export { DEFAULT_AGENTS, type AgentTemplate } from './defaults.js';
export * from './templates/index.js';

// Helper to load agents from any config
export function loadAgentsFromConfig(config: {
  agents: Record<string, AgentConfig>;
}): Record<string, AgentDefinition> {
  const factory = createAgentFactory();
  return factory.createAgents(config.agents);
}
```

---

### Phase V4-5: Update Coordination Layer
**Files to modify**: 1 file

#### 17. `src/coordination/registry.ts`
```typescript
// UPDATED to work with factory-created agents
export function createAgentRegistry(options: {
  agents: Record<string, AgentDefinition>;  // From factory
  clusters?: Record<string, ClusterDefinition>;
  toolFilter?: boolean;
}): AgentRegistry {
  // ... same implementation as v3
}
```

---

### Phase V4-6: Update Plugin Entry Point
**Files to modify**: 1 file

#### 18. `src/index.ts`
```typescript
// UPDATED integration
import { loadAgentsFromConfig } from './agents/index.js';

export default async function PluginV4(): Promise<Hooks> {
  const config = loadConfig();

  // Load agents from config (NOT hardcoded)
  const agentConfigs = config.coordination?.agents ?? {};
  const agents = loadAgentsFromConfig({ agents: agentConfigs });

  // ... rest of v3 integration
}
```

---

### Phase V4-7: Tests
**Files to create**: 2 files

#### 19. `tests/unit/agents/factory.test.ts`
```typescript
import { createAgentFactory, AgentConfigSchema } from '../../../src/agents/factory.js';

describe('AgentFactory', () => {
  describe('createAgent', () => {
    it('creates a valid agent from config');
    it('applies default values');
    it('converts tools array to record');
  });

  describe('createAgents', () => {
    it('creates multiple agents from config map');
    it('ensures name matches key');
  });

  describe('extendAgent', () => {
    it('merges base config with overrides');
    it('concatenates tools arrays');
    it('overrides nested properties');
  });
});
```

#### 20. `tests/unit/agents/templates.test.ts`
```typescript
import { DEFAULT_AGENTS } from '../../../src/agents/defaults.js';

describe('Agent Templates', () => {
  describe('architect', () => {
    it('has required tools');
    it('has primary mode');
    it('has delegation rules in prompt');
  });

  describe('coder', () => {
    it('has subagent mode');
    it('has coding tools only');
    it('has no self-review in prompt');
  });
  // ... similar for other templates
});
```

---

## 4. File Count Summary

| Category | Count | Notes |
|----------|-------|-------|
| **Agent Factory** | 3 files | factory.ts, defaults.ts, index.ts |
| **Agent Templates** | 7 files | architect, coder, reviewer, test-engineer, sme, explorer, critic |
| **Config Templates** | 5 files | shark, spider, hermes, hydra, index |
| **Updated Files** | 3 files | agents/index.ts, coordination/registry.ts, index.ts |
| **Tests** | 2 files | factory.test.ts, templates.test.ts |
| **TOTAL NEW** | **20 files** | |
| **FROM V3** | ~45 files | Preserved |

---

## 5. Migration Path

### V3 → V4

1. Build V3 first
2. Refactor `agents/` directory:
   - Rename existing files to templates
   - Create factory.ts
   - Create defaults.ts
3. Update coordination/registry.ts to accept factory-created agents
4. Update src/index.ts to use loadAgentsFromConfig()
5. Create config/templates/ for each architecture

### Using V4 for New Architecture

```bash
# 1. Copy v4 template
cp -r plugin-agent-prototype-v4 my-agent

# 2. Install dependencies
cd my-agent && npm install

# 3. Create architecture config
# Edit src/config/templates/my-architecture.ts

# 4. Or just use config file
# Create my-architecture.json in project root

# 5. Customize agent prompts in config
```

---

## 6. Example: Creating a Custom Agent

### Step 1: Define in Config

```typescript
// src/config/templates/my-arch.ts

export const myArchAgents = factory.createAgents({
  // Use template with custom prompt
  'senior-coder': factory.extendAgent('coder', DEFAULT_AGENTS.coder.config, {
    name: 'senior-coder',
    description: 'Senior developer - enforces best practices',
    tools: [...DEFAULT_AGENTS.coder.tools, 'secretscan', 'sast_scan'],
    prompt: `You are a Senior Coder - you enforce best practices.

## Additional Focus
- Performance optimization
- Security-first approach
- Legacy code migration

${DEFAULT_AGENTS.coder.config.prompt}`,
  }),

  // Completely custom agent
  'database-expert': {
    name: 'database-expert',
    mode: 'subagent',
    cluster: 'research',
    description: 'Database architecture and optimization',
    tools: ['symbols', 'imports', 'complexity_hotspots'],
    prompt: `You are the Database Expert - you specialize in data layer.

## Your Focus
- Schema design and optimization
- Query performance
- Index strategy
- Data migration

When asked about data, provide detailed analysis.`,
  },
});
```

### Step 2: Register in Cluster

```typescript
const myArchConfig = {
  // ...
  clusters: {
    execution: {
      id: 'execution',
      agents: ['senior-coder', 'tester'],
      // ...
    },
    research: {
      id: 'research',
      agents: ['explorer', 'sme', 'database-expert'],
      // ...
    },
  },
};
```

---

## 7. Acceptance Criteria

### V4 Must Have

- [ ] Agent factory creates agents from config
- [ ] All 7 default templates available (architect, coder, reviewer, test_engineer, sme, explorer, critic)
- [ ] `extendAgent()` merges configs correctly
- [ ] Shark config example works (3 brains + 5 agents)
- [ ] Spider config example works (11 agents)
- [ ] Hydra config example works (5 brains + 13 agents)
- [ ] Agents loaded from config at runtime (not hardcoded)
- [ ] TypeScript compilation with 0 errors
- [ ] Tests pass for factory and templates
- [ ] V3 coordination layer still works

### V4 Should Have

- [ ] Agent templates as separate files (not just defaults.ts)
- [ ] Config templates for all major architectures
- [ ] Documentation with usage examples

---

## 8. Timeline Estimate

| Phase | Files | Time Estimate |
|-------|-------|---------------|
| V4-1: Factory Core | 3 | 1 hour |
| V4-2: Templates | 7 | 1 hour |
| V4-3: Config Templates | 5 | 1.5 hours |
| V4-4: Updated Index | 1 | 30 min |
| V4-5: Coordination Update | 1 | 30 min |
| V4-6: Entry Point | 1 | 30 min |
| V4-7: Tests | 2 | 1 hour |
| **TOTAL** | **20** | **5.5 - 6 hours** |

**Note**: This is on top of V3 (5-9 hours). V3 must be complete first.

---

## 9. Files to Create/Modify Checklist

### Create (20 files)

```
src/agents/factory.ts
src/agents/defaults.ts
src/agents/templates/architect.ts
src/agents/templates/coder.ts
src/agents/templates/reviewer.ts
src/agents/templates/test-engineer.ts
src/agents/templates/sme.ts
src/agents/templates/explorer.ts
src/agents/templates/critic.ts
src/agents/templates/index.ts
src/config/templates/shark.ts
src/config/templates/spider.ts
src/config/templates/hermes.ts
src/config/templates/hydra.ts
src/config/templates/index.ts
tests/unit/agents/factory.test.ts
tests/unit/agents/templates.test.ts
docs/V4_AGENT_FACTORY_BUILD_PLAN.md
docs/ARCHITECTURE_CONFIGS.md
```

### Modify (3 files)

```
src/agents/index.ts
src/coordination/registry.ts
src/index.ts
```

---

## 10. Key Design Decisions

### A. Templates vs Config

Templates (in `agents/templates/`) are TypeScript files with full prompts.
Config (in `config/templates/`) imports templates and customizes.

This allows:
- Copy a template file → customize prompt
- Use a template in config → just override specific fields

### B. Why `extendAgent()` Exists

```typescript
// Without extendAgent - full duplication
'custom-coder': {
  name: 'custom-coder',
  mode: 'subagent',
  prompt: `You are the Coder...` + custom additions,
  tools: ['write', 'edit', 'patch', 'create_file', 'insert', 'replace', 'apply_patch', 'custom_tool'],
}

// With extendAgent - minimal override
'custom-coder': factory.extendAgent('custom-coder', DEFAULT_AGENTS.coder.config, {
  tools: [...DEFAULT_AGENTS.coder.tools, 'custom_tool'],
  prompt: DEFAULT_AGENTS.coder.config.prompt + '\n\n## Additional Focus\nCustom stuff...',
});
```

### C. Config Drives Everything

The coordination layer doesn't import agents directly:

```typescript
// V3 (bad) - imports hardcoded
import { architectAgent } from './agents/architect.ts';

// V4 (good) - loads from config
const agents = loadAgentsFromConfig(config);
```

This means:
- Same coordination code works for all architectures
- Shark, Spider, Hydra all use identical infrastructure
- Adding/removing agents is a config change, not a code change

---

**Plan Generated**: 2026-04-02
**Based on**: V3 Implementation + Agent Factory Pattern
**Target Version**: plugin-agent-prototype-v4
