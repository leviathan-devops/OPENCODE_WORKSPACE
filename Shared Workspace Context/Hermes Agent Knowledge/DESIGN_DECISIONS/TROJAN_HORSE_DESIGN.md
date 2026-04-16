# Hermes Agent Plugin — Trojan Horse Design

**Date:** Wed Apr 15 2026  
**Version:** 3.5 (Consolidated)  
**Purpose:** Transform Hermes from scattered workspace agent into a first-class OpenCode plugin with full DevOps Manager context access

---

## Concept: What We're Building

A **Plugin Hermes Agent** that:
1. Loads into OpenCode like any other plugin (spider-agent, kraken-agent, etc.)
2. Registers as the `hermes` agent in OpenCode's agent system
3. Brings its own context library (DevOps Manager mental model, patterns, audit framework)
4. Uses OpenCode's workspace as its runtime environment
5. Has **T2 context access** to the Hermes workspace knowledge base
6. Has **T1 memory** (active) through the 2nd-brain system
7. Functions as a "Trojan Horse" — Hermes running inside OpenCode

---

## Architecture Layers

### Layer 0: OpenCode Infrastructure (Host)
```
OpenCode Core
├── Agent Registry (plan, build, general, explore + plugins)
├── Plugin System (hooks, tools, agent configs)
├── Workspace Management (context.directory per project)
└── Memory System (sessions, snapshots)
```

### Layer 1: Hermes Agent Plugin
```
hermes-agent Plugin (loaded at ~/.config/opencode/plugins/)
├── Agent Definition (hermes = primary agent)
├── 19 Subagents (planner, builder, tdd, reviewer, etc.)
├── 33 Hooks (lifecycle management)
├── 40 Tools (fork, episode, orchestration, quality, security)
├── 4 Services (fork-manager, episode-store, skill-registry, orchestration-engine)
└── 11 Skills (implement, plan, grill, tdd, verify, etc.)
```

### Layer 2: DevOps Manager Context (Embedded)
```
DevOps Manager Profile (embedded in plugin at context/devops-manager/)
├── MENTAL_MODEL.md        — Core principles, workflow, quality gates
├── INDEX.md               — System overview, quick start
├── AUDIT_FRAMEWORK.md     — Verification criteria
├── PATTERNS.md            — Reusable patterns
├── VERIFICATION.md        — Completion verification
├── ESCALATION.md          — Risk escalation protocol
├── HERMES_AGENT_PLUGIN.md — Hermes agent integration spec
└── README.md              — DevOps Manager overview
```

### Layer 3: Hermes Workspace Context (T2 - Reference)
```
Hermes Workspace Knowledge Base (reference, not embedded)
├── Shared Workspace Context/
│   └── Hermes Agent Knowledge/  ← Main knowledge library
│       ├── VERSIONS/           ← v1, v2.x, v3.0, v3.5 briefs
│       ├── ARCHITECTURE/        ← System design docs
│       ├── SKILLS/             ← 11 skill documentation
│       ├── BUILD/              ← Ship gates, build logs
│       ├── DESIGN_DECISIONS/   ← Key architectural choices
│       ├── MEMORY/             ← Memory system docs
│       ├── DEBUG_LOGS/          ← Historical debug logs
│       └── LESSONS_LEARNED/    ← Issue resolutions
└── knowledge-base/
    └── devops-manager/          ← DevOps Manager library
        └── library/             ← Components, README, INDEX
```

---

## T1 vs T2 Memory Design

### T1 Memory (Active, Fast)
**Purpose:** Session-active context that Hermes uses in real-time

**Storage:** `~/.hermes/memory/` (global to user, NOT workspace)
- Files: `YYYY-MM-DD-{key}.md`
- Tools: `hermes_remember`, `hermes_recall`, `hermes_context`
- Injected into messages via `knowledge-injector` hook

**Characteristics:**
- Immediately accessible
- Session-persistent
- Cross-workspace (shared memory store)

### T2 Memory (Reference, Slow)
**Purpose:** Historical knowledge, patterns, design decisions

**Storage:** 
- `Shared Workspace Context/Hermes Agent Knowledge/` — Knowledge library
- `knowledge-base/devops-manager/` — DevOps Manager library

**Characteristics:**
- Queryable via recall
- Not auto-injected
- Reference material for decision-making

---

## How T2 Context Access Works

### Current Problem
The plugin's `devops-manager.ts` loads context from `context/devops-manager/` relative to the plugin file. But this directory doesn't exist in the consolidated `projects/hermes-agent/` location.

### Solution: Environment-Variable Based Resolution

```typescript
// In devops-manager.ts
function getDevopsContextDir(): string {
  // Option 1: Explicit environment variable
  if (process.env.HERMES_DEVOPS_CONTEXT_DIR) {
    return resolve(process.env.HERMES_DEVOPS_CONTEXT_DIR);
  }
  
  // Option 2: OpenCode workspace path
  if (process.env.OPENCODE_WORKSPACE) {
    return resolve(process.env.OPENCODE_WORKSPACE, 
      "Shared Workspace Context/Hermes Agent Knowledge/BUILD");
  }
  
  // Option 3: Fallback to plugin-relative (for bundled installs)
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return resolve(__dirname, "../../context/devops-manager");
}
```

### T2 Access Chain

```
hermes agent (T1 active)
    ↓ uses
hermes_recall tool (T1 search)
    ↓ queries
~/.hermes/memory/ (T1 store)
    ↓
[If no T1 match, prompt user]
    ↓
hermes_recall can also reference
Shared Workspace Context/Hermes Agent Knowledge/ (T2 library)
    ↓
For deep research, agent can read files directly from T2
```

---

## Integration with OpenCode Agent System

### Agent Registration

The plugin registers `hermes` as a **primary agent**:

```typescript
// In index.ts
const agentConfigs = {
  hermes: {
    name: "hermes",
    description: "Hermes DevOps Manager — quality guardian and build overseer",
    color: "#D35400",
    config: {
      prompt: DEVOPS_MANAGER_PROMPT, // From embedded context
    },
    mode: "primary", // <-- Primary agent, not subagent
    builtIn: false,
    permission: { edit: "allow", bash: {}, webfetch: "allow", doom_loop: "allow", external_directory: "allow" },
  },
  // ... 18 subagents ...
};
```

### OpenCode Configuration

```json
// ~/.config/opencode/opencode.json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/hermes-agent/dist/index.js"
  ],
  "agent": {
    "hermes": {
      "name": "hermes",
      "mode": "primary"
    }
  }
}
```

---

## Implementation Checklist

### Phase 1: Embed DevOps Manager Context in Plugin
- [ ] Create `projects/hermes-agent/context/devops-manager/` directory
- [ ] Copy all 8 DevOps Manager files from `v2.3.5-build/context/devops-manager/`
- [ ] Update `devops-manager.ts` to use plugin-relative path as default
- [ ] Verify `DEVOPS_MANAGER_PROMPT` and other exports load correctly

### Phase 2: Fix T1 Memory (Workspace Containment)
- [ ] Update `hermes-remember.ts` to use `context.directory` instead of `~/.hermes/`
- [ ] Update `hermes-recall.ts` to use `context.directory`
- [ ] Update `knowledge-injector.ts` to use workspace-based memory dir
- [ ] Update `knowledge-curator.ts` to use workspace-based learnings path
- [ ] Ensure `~/.hermes/` fallback only if no workspace context

### Phase 3: Wire T2 Context Access
- [ ] Add `hermes_workspace` tool to read from `Shared Workspace Context/Hermes Agent Knowledge/`
- [ ] Tool should search/read T2 library files
- [ ] Integrate into knowledge-injector as secondary source

### Phase 4: Build and Verify
- [ ] Run `bun run build.sh`
- [ ] Run integration tests (45/45 should pass)
- [ ] Verify OpenCode loads hermes agent
- [ ] Test T1 memory stores to workspace
- [ ] Test T2 context retrieval

---

## File Structure After Implementation

```
projects/hermes-agent/
├── dist/index.js                    # Compiled plugin
├── src/
│   ├── index.ts                    # Plugin entry (393 lines)
│   ├── agents/                     # 19 agent definitions
│   ├── hooks/                      # 33 hooks
│   ├── tools/                      # 40 tools
│   │   ├── hermes-remember.ts      # ← Fixed: workspace-contained
│   │   ├── hermes-recall.ts        # ← Fixed: workspace-contained
│   │   └── hermes-workspace.ts     # ← New: T2 access tool
│   ├── services/                   # 4 services
│   ├── skills/                     # 11 skills
│   └── config/
│       ├── devops-manager.ts       # ← Updated: env var priority
│       └── agent-identity.ts       # isHermesAgent firewall
├── context/
│   └── devops-manager/             # ← NEW: Embedded context
│       ├── MENTAL_MODEL.md
│       ├── INDEX.md
│       ├── AUDIT_FRAMEWORK.md
│       ├── PATTERNS.md
│       ├── VERIFICATION.md
│       ├── ESCALATION.md
│       ├── HERMES_AGENT_PLUGIN.md
│       └── README.md
├── integration-tests/
│   └── full-test-suite.ts
└── scripts/
    ├── build.sh
    └── test.sh
```

---

## Key Files to Modify

### `src/config/devops-manager.ts`
```typescript
// Add environment variable priority
function getDevopsContextDir(): string {
  if (process.env.HERMES_DEVOPS_CONTEXT_DIR) {
    return resolve(process.env.HERMES_DEVOPS_CONTEXT_DIR);
  }
  // NEW: Try OpenCode workspace path
  if (process.env.OPENCODE_WORKSPACE) {
    return resolve(process.env.OPENCODE_WORKSPACE,
      "Shared Workspace Context/Hermes Agent Knowledge/BUILD");
  }
  // Fallback to plugin-relative
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return resolve(__dirname, "../../context/devops-manager");
}
```

### `src/tools/hermes-remember.ts`
```typescript
// Use workspace-contained memory
execute: async (args, context) => {
  const baseDir = context.directory || process.env.HOME;
  const memoryDir = resolve(baseDir, ".hermes", "memory");
  // ... rest unchanged
}
```

### `src/tools/hermes-recall.ts`
```typescript
// Use workspace-contained memory
execute: async (args, context) => {
  const baseDir = context.directory || process.env.HOME;
  const memoryDir = resolve(baseDir, ".hermes", "memory");
  // ... rest unchanged
}
```

### `src/tools/hermes-workspace.ts` (NEW)
```typescript
// T2 access tool for Hermes workspace knowledge
export const hermesWorkspace = tool({
  description: "Query Hermes workspace T2 context library",
  args: {
    query: tool.schema.string(),
    category: tool.schema.enum(["versions", "architecture", "skills", "memory"]).optional(),
  },
  execute: async (args, context) => {
    const baseDir = resolve(process.env.OPENCODE_WORKSPACE || "");
    const knowledgeDir = join(baseDir, "Shared Workspace Context/Hermes Agent Knowledge");
    // Search and return relevant T2 context
  }
});
```

---

## Security/Firewall Model

```
OpenCode Workspace (project being worked on)
├── .opencode/           ← OpenCode internal
├── node_modules/        ← Dependencies
└── src/                 ← Project code

HERMES FIREWALL BOUNDARY
├── .hermes/             ← Hermes T1 memory (workspace-contained)
│   ├── memory/          ← hermes_remember store
│   └── learnings.md     ← Session learnings
└── isHermesAgent()      ← Agent name firewall

T2 HERMES WORKSPACE (reference, read-only)
├── Shared Workspace Context/Hermes Agent Knowledge/
└── knowledge-base/devops-manager/
```

### Firewall Rules

1. **Agent Firewall:** `isHermesAgent()` — Only Hermes agents use Hermes tools
2. **Workspace Firewall:** T1 memory uses `context.directory` — Isolated per workspace
3. **T2 Firewall:** Hermes workspace is READ-ONLY from plugin — Cannot modify T2 from T1

---

## Testing the Trojan Horse

After implementation:

1. **Load Test:** OpenCode starts, loads hermes-agent plugin, `hermes` agent available
2. **Context Test:** `hermes` agent prompt contains DevOps Manager mental model
3. **T1 Memory Test:** `hermes_remember` stores to `{workspace}/.hermes/memory/`
4. **T2 Access Test:** `hermes_recall` can query T2 library if T1 empty
5. **Fork Test:** `/plan` fork works within hermes session
6. **Orchestration Test:** `/implement` chain executes correctly

---

## Open Questions

1. **T2 Write Access:** Should T1 be able to write to T2? (Probably not — T2 is reference)
2. **Memory Merge:** If T1 and T2 have same key, which wins? (T1 should win for active session)
3. **Context Injection:** Should T2 auto-inject into messages like T1 does? (Probably lower priority)