# Spider Agent V4 Plugin — Renamed spider-swarm

**Classification:** Plugin rename operation  
**Purpose:** Copy spider-swarm as Spider Agent V4 without changing underlying architecture

---

## Rename Operations

### 1. Package Rename
```bash
# Copy the plugin
cp -r /home/leviathan/.npm-global/lib/node_modules/spider-swarm \
      /home/leviathan/.npm-global/lib/node_modules/spider-agent-v1

# Update package.json
{
  "name": "spider-agent-v1",
  "version": "4.0.0",
  "description": "Spider Agent V4 - Production-grade multi-agent orchestration for OpenCode. Multi-brain architecture with mechanical quality enforcement.",
  "bin": {
    "spider-agent-v1": "./dist/cli/index.js"
  },
  "keywords": [
    "opencode",
    "opencode-plugin",
    "spider-agent",
    "ai",
    "agents",
    "orchestration",
    "multi-agent",
    "llm",
    "quality-gates"
  ]
}
```

### 2. Internal Reference Updates
Replace in all source files:
- `.swarm/` → `.spider/` (artifact directory)
- `swarm_id` → `spider_id` (config field)
- `swarm config` → `spider config` (documentation)
- `spider-swarm` → `spider-agent-v1` (package references)

DO NOT replace:
- Agent role names (architect, coder, reviewer, etc.) — these are agent roles
- `agent-swarm` references in MCP tool names — those are from the external API
- `agent_swarm_*` MCP tool prefixes — those are the external API

### 3. OpenCode Config Update
```json
{
  "plugin": [
    "spider-agent-v1",
    "hive-mind-plugin"
  ]
}
```

### 4. Directory Structure (Unchanged from spider-swarm)
```
spider-agent-v1/
├── dist/
│   ├── index.js              # Main plugin entry
│   ├── agents/               # Agent definitions (architect, coder, etc.)
│   ├── background/           # Background processes
│   ├── build/                # Build system
│   ├── cli/                  # CLI tools
│   ├── commands/             # OpenCode commands
│   ├── config/               # Configuration
│   ├── context/              # Context management
│   ├── diff/                 # Diff analysis
│   ├── evidence/             # Evidence system
│   ├── gate-evidence/        # Gate evidence system
│   ├── git/                  # Git operations
│   ├── hooks/                # Lifecycle hooks
│   ├── knowledge/            # Knowledge base
│   ├── lang/                 # Language support (tree-sitter)
│   ├── model-fallback/       # Model fallback system
│   ├── output/               # Output formatting
│   ├── parallel/             # Parallel execution
│   ├── plan/                 # Planning system
│   ├── quality/              # Quality gates (pre_check_batch, etc.)
│   ├── sast/                 # SAST scanning
│   ├── sbom/                 # SBOM generation
│   ├── services/             # Service management
│   ├── session/              # Session management
│   ├── skills/               # Skill system
│   ├── summaries/            # Session summaries
│   ├── telemetry/            # Telemetry logging
│   ├── tools/                # Tool definitions
│   ├── types/                # TypeScript types
│   └── utils/                # Utilities
├── node_modules/
├── package.json
└── README.md
```

### 5. Key Systems Already Present (No Changes Needed)
- **EXECUTE pipeline** — diff → syntax_check → placeholder_scan → imports → lint → build_check → pre_check_batch → reviewer → security-reviewer → test_engineer → evidence_check → drift_verifier
- **Multi-agent architecture** — 9 specialized agents with per-agent model assignment
- **Scope containment** — declare_scope restricts file access
- **Evidence system** — .spider/evidence/{task}.json per task
- **Knowledge base** — knowledgeAdd, knowledgeRecall, knowledge_query
- **Telemetry** — .spider/telemetry.jsonl
- **Checkpoint system** — Git snapshots
- **Phase retrospectives** — .spider/evidence/retro-{N}/evidence.json

### 6. What V4 Does NOT Have (V5 Will Add)
- Anti-hallucination validators (explicit "never claim without verifying")
- Surgical debug protocol (6-step structured debugging)
- Enhanced stagnation detection (strategy tracking + escalation)
- Guardian zone classification (filesystem zone protection)
- Reasoning chain documentation (Thought → Action → Result → Assessment)
- Style guide enforcement (single-word naming)
- Repo root test prevention
- Documentation validation (theatrical docs detection)

---

## Migration Checklist
- [ ] Copy spider-swarm to spider-agent-v1
- [ ] Update package.json (name, version, description, bin, keywords)
- [ ] Replace .swarm/ → .spider/ in all source files
- [ ] Replace swarm_id → spider_id in all source files
- [ ] Replace "swarm config" → "spider config" in documentation
- [ ] Replace "spider-swarm" → "spider-agent-v1" in package references
- [ ] Update OpenCode config to use "spider-agent-v1" plugin
- [ ] Test plugin loads without errors
- [ ] Test full pipeline executes successfully
- [ ] Verify all existing functionality works
