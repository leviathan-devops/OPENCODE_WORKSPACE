# OpenCode-Ultra Architecture Map

## Plugin Overview
`opencode-ultra` is a lightweight OpenCode 1.2.x+ plugin providing multi-agent orchestration, rules injection, and ultrawork mode. The plugin extends OpenCode with 9 specialized agents and 8 core tools.

## Entry Point & Initialization

### Plugin Registration
**File**: `src/index.ts` → `dist/index.js` (lines 30719-31033)
**Function**: `OpenCodeUltra(ctx: PluginContext)`

**Initialization Flow**:
1. **Context Loading**: Receives OpenCode plugin context (`ctx`)
2. **Configuration**: `loadConfig(ctx.directory)` → loads `opencode-ultra.json`
3. **Agent Building**: `buildAgents(pluginConfig)` → merges `BUILTIN_AGENTS` with user overrides
4. **Tool Registration**: Creates 8 core tools based on enabled/disabled config
5. **Hook Registration**: Sets up 5 major hooks for message processing
6. **Return**: `{ tool, config, hooks, event }` object for OpenCode

### Configuration Loading (`loadConfig`)
**Sources** (in order of precedence):
1. **User Config**: `~/.config/opencode/opencode-ultra.json`
2. **Project Config**: `.opencode/opencode-ultra.json` in project root
3. **Profile Resolution**: Applies profile-specific overrides

**Key Configuration Sections**:
```json
{
  "agents": {},           // Agent overrides (model, description, prompt)
  "categories": {},       // Model routing by task category
  "fragments": {},        // Conditional context fragments
  "disabled_agents": [],  // Agents to disable
  "disabled_hooks": [],   // Hooks to disable
  "disabled_tools": [],   // Tools to disable
  "disabled_mcps": [],    // MCP servers to disable
  "demote_builtin": true, // Demote built-in OpenCode agents to subagents
  "background_task": {},  // Concurrency control settings
  "safety": {},           // Spawn limits and timeouts
  "evolve_exe": {},       // Evolve execution settings
  "token_truncation": {}, // Output truncation limits
  "comment_checker": {},  // AI slop comment detection
  "todo_enforcer": {}     // TODO completion enforcement
}
```

## Core Components

### 1. Agent System (`src/agents/index.ts`)

#### Built-in Agents (9)
| Internal ID | Default Model | Role | Tool Permissions |
|-------------|---------------|------|------------------|
| `sisyphus` | `openai/gpt-5.3-codex` | Primary orchestrator | Read-only (Grep, Glob, Read) |
| `oracle` | `zai-coding-plan/glm-5` | Design architect & debugger | Full access |
| `explore` | `openai/gpt-5.3-codex-spark` | Fast codebase explorer | Search tools |
| `librarian` | `openai/gpt-5.3-codex-spark` | Documentation researcher | Research tools |
| `multimodal-looker` | `kimi-for-coding/k2p5` | Visual analyzer | Image analysis |
| `metis` | `kimi-for-coding/k2p5` | Strategic planner | Planning tools |
| `momus` | `openai/gpt-5.3-codex` | Code reviewer | Review tools |
| `atlas` | `minimax-coding-plan/MiniMax-M2.5` | Task orchestrator | Coordination tools |
| `hephaestus` | `zai-coding-plan/glm-5` | Deep autonomous worker | Full implementation |

#### Agent Building (`buildAgents`)
**Process**:
1. Load `BUILTIN_AGENTS` as base
2. Apply user overrides from `config.agents`
3. Remove disabled agents
4. Generate Sisyphus prompt dynamically with agent table
5. Return final agent definitions

#### Dynamic Prompt Generation
- **Sisyphus Prompt**: Template-based with injected agent table and plan example
- **Agent Table**: Generated via `buildAgentTable()` showing all subagents
- **Plan Example**: Sample execution plan showing agent delegation

### 2. Tool System (8 Core Tools)

#### Tool Registry (`toolRegistry`)
Created in lines 30791-30840, conditionally enabled based on `disabled_tools`:

| Tool | Purpose | Dependencies |
|------|---------|--------------|
| `spawn_agent` | Spawn sub-agents for parallel execution | Agent resolution, concurrency pool |
| `ralph_loop` | Recursive self-improvement loop | Session tracking, timeout control |
| `cancel_ralph` | Cancel running Ralph loops | Session management |
| `batch_read` | Read multiple files in parallel | File system access |
| `ledger_save` | Save data to persistent ledger | File I/O, JSON serialization |
| `ledger_load` | Load data from ledger | File I/O, JSON parsing |
| `ast_search` | AST-based code search (if `ast-grep` available) | `ast-grep` binary |
| `evolve_scan` | Scan plugin ecosystem for improvements | NPM/GitHub APIs |
| `evolve_score` | Score improvement proposals | Scoring algorithm |
| `evolve_exe` | Execute evolve proposals | Agent spawning, safety checks |
| `evolve_publish` | Publish evolve results | Git operations |
| `health_check` | System diagnostics | All components |

#### Tool Implementation Patterns
1. **Session Awareness**: Most tools check `internalSessions` to avoid recursion
2. **Safety Wrappers**: Timeout limits, spawn limits, resource constraints
3. **Error Handling**: Structured errors with recovery paths
4. **Concurrency Control**: Pool-based limiting per provider/model

### 3. Hook System (5 Major Hooks)

#### Hook Registration (lines 30876-31027)
```javascript
return {
  tool: toolRegistry,
  config: async (config) => { /* agent registration */ },
  "chat.message": async (input, output) => { /* keyword detection */ },
  "experimental.chat.system.transform": async (input, output) => { /* system prompt injection */ },
  "experimental.session.compacting": async (input, output) => { /* session compaction */ },
  "tool.execute.after": async (input, output) => { /* post-tool processing */ },
  event: async ({ event }) => { /* session lifecycle */ }
};
```

#### Hook Details

##### 1. `chat.message` (Keyword Detection)
**Trigger**: Before message is sent to LLM
**Functions**:
- **Keyword Detection**: Scans for `ultrawork`, `search`, `analyze`, `think`, `evolve` patterns
- **Prompt Modification**: Injects mode-specific instructions
- **Toast Notifications**: Shows "ULTRAWORK MODE" toast in TUI
- **Anchor Injection**: Adds mandatory tool usage instructions

##### 2. `experimental.chat.system.transform` (System Prompt Injection)
**Trigger**: During system prompt assembly
**Injections**:
- **Autonomous Mode**: `AUTONOMOUS_MODE_SYSTEM` for non-interactive sessions
- **Detected Keywords**: Messages from keyword detection
- **Project Rules**: From `architecture.md`, `codestyle.md`, `rules.md`
- **Fragments**: Conditional context from `fragments` config
- **Prompt Rendering**: Template-based prompt formatting

##### 3. `experimental.session.compacting` (Session Management)
**Trigger**: When session context is full
**Function**: Builds session summary and injects compaction prompt

##### 4. `tool.execute.after` (Post-Tool Processing)
**Trigger**: After tool execution completes
**Functions**:
- **Comment Checking**: Detects AI slop comments in code output
- **Token Truncation**: Automatically truncates large tool outputs

##### 5. `event` (Session Lifecycle)
**Trigger**: Session events (create, delete, update)
**Functions**:
- **Cleanup**: Removes session from internal tracking
- **TODO Enforcement**: Tracks TODO completion across sessions

### 4. Concurrency & Safety System

#### Concurrency Pool (`ConcurrencyPool`)
**Location**: Created if `background_task` config present
**Purpose**: Limit concurrent agent executions per provider/model

**Configuration**:
```json
"background_task": {
  "defaultConcurrency": 3,
  "providerConcurrency": { "0-glm-coding": 5 },
  "modelConcurrency": { "0-glm-coding/glm-5": 2 }
}
```

#### Safety Configuration (`safety`)
```json
"safety": {
  "maxTotalSpawned": 10,      // Maximum total spawned agents
  "agentTimeoutMs": 300000    // 5-minute timeout per agent
}
```

### 5. Evolve System (Self-Improvement)

#### 5-Phase Workflow
1. **RESEARCH**: Scan `node_modules` for OpenCode plugins
2. **COMPARE**: Build feature matrix vs. opencode-ultra
3. **PROPOSE**: Write proposals to `.opencode/evolve-proposals.jsonl`
4. **SCORE**: Call `evolve_score()` for each proposal
5. **SAVE**: Call `ledger_save()` to persist results

#### Evolve Tools
- `evolve_scan`: Discovers plugins and analyzes features
- `evolve_score`: Scores improvement proposals
- `evolve_exe`: Executes selected proposals
- `evolve_publish`: Publishes results

### 6. Fragment System (`fragment-injector`)

#### Configuration
```json
"fragments": {
  "hephaestus": [".opencode/fragments/strict.md"],
  "sisyphus": [".opencode/fragments/orchestration.md"]
}
```

#### Injection Logic
- Conditionally injects markdown files based on agent or context
- Supports glob patterns and multiple fragments
- Injected into system prompt via `fragmentInjector` hook

### 7. Prompt Rendering System (`prompt-renderer`)

#### Configuration
```json
"prompt_renderer": {
  "default": "markdown",
  "model_overrides": {
    "0-glm-coding/glm-5": "markdown",
    "0-deepseek/deepseek-reasoner": "markdown"
  }
}
```

#### Renderers
- **markdown**: Standard Markdown formatting
- **plaintext**: Minimal formatting
- **structured**: JSON-like structured prompts

## Data Flow Diagrams

### 1. Agent Spawning Flow
```
User Request → chat.message hook → Keyword Detection → spawn_agent tool
    ↓
Resolve Agent ID → Check Concurrency Pool → Create Sub-session
    ↓
Execute with Agent Model → Return Results → Merge with Main Session
```

### 2. Configuration Loading Flow
```
Start → Load User Config → Load Project Config → Merge Profiles
    ↓
Build Agents → Register Tools → Setup Hooks → Initialize MCPs
    ↓
Register with OpenCode → Ready for Requests
```

### 3. Evolve Execution Flow
```
evolve_exe tool → Parse Proposal → Spawn Implement Agent
    ↓
Execute Implementation → Spawn Review Agent → Apply Changes
    ↓
Run Tests → Commit Changes → Return Results
```

## File Structure (Reconstructed from Dist)

```
src/
├── index.ts                    # Plugin entry point
├── config/
│   ├── index.ts               # Configuration loading
│   └── schema.ts              # Configuration validation
├── agents/
│   ├── index.ts               # BUILTIN_AGENTS and agent building
│   └── prompts/               # Dynamic prompt templates
├── tools/
│   ├── spawn-agent.ts         # spawn_agent tool
│   ├── ralph-loop.ts          # ralph_loop and cancel_ralph
│   ├── batch-read.ts          # batch_read tool
│   ├── ledger.ts              # ledger_save and ledger_load
│   ├── ast-search.ts          # ast_search tool
│   ├── evolve/                # Evolve system tools
│   │   ├── scan.ts
│   │   ├── score.ts
│   │   ├── exe.ts
│   │   └── publish.ts
│   └── health-check.ts        # health_check tool
├── hooks/
│   ├── keyword-detector.ts    # chat.message hook
│   ├── fragment-injector.ts   # Fragment injection
│   ├── prompt-renderer.ts     # Prompt formatting
│   ├── todo-enforcer.ts       # TODO completion enforcement
│   ├── comment-checker.ts     # AI slop detection
│   ├── token-truncation.ts    # Output truncation
│   └── session-compaction.ts  # Session compaction
├── utils/
│   ├── concurrency.ts         # Concurrency pool
│   ├── safety.ts             # Safety checks and limits
│   └── logging.ts            # Structured logging
└── mcp/                       # MCP server integrations
```

## Dependencies & Integration Points

### OpenCode APIs Used
1. **Plugin Context** (`ctx`): Access to OpenCode client, directory, config
2. **Tool Registration**: `tool` object returned from plugin
3. **Hook System**: `chat.message`, `experimental.*` hooks
4. **Session Management**: `ctx.client.session` APIs
5. **TUI Integration**: `ctx.client.tui.showToast()`

### External Dependencies
1. **`@opencode-ai/plugin`**: OpenCode plugin SDK
2. **`@opencode-ai/sdk`**: OpenCode core SDK
3. **`jsonc-parser`**: JSON with comments parsing
4. **`zod`**: Schema validation

### Optional Dependencies
1. **`ast-grep`**: For AST-based code search (optional)
2. **MCP Servers**: Various Model Context Protocol servers

## Performance Characteristics

### Memory Usage
- **Base Plugin**: ~10-20MB
- **Per Agent Session**: ~5-10MB
- **Concurrency Pool**: Configurable limits

### Execution Times
- **Agent Spawning**: 100-500ms (model-dependent)
- **Tool Execution**: 10-1000ms (tool-dependent)
- **Configuration Loading**: 50-200ms

### Scaling Limits
- **Max Concurrent Agents**: Configurable (default 10)
- **Session Memory**: Limited by OpenCode context window
- **File Operations**: Limited by system I/O

## Debugging & Monitoring

### Logging
```javascript
log("Message", { key: "value", sessionID: input.sessionID });
```
- Structured JSON logging
- Session correlation IDs
- Performance timing

### Health Checks
```bash
# Via health_check tool
health_check() → returns system status
```

### Common Issues
1. **Agent Spawning Failures**: Check concurrency limits, model availability
2. **Configuration Errors**: Validate JSON schema, check path permissions
3. **Performance Issues**: Monitor concurrency pool, check network latency
4. **Hook Conflicts**: Disable conflicting hooks, check execution order

## Testing Strategy

### Unit Tests
- Agent resolution and configuration
- Tool execution and error handling
- Hook injection and prompt modification

### Integration Tests
- Full plugin lifecycle
- Agent spawning and delegation
- Evolve workflow execution

### Performance Tests
- Concurrency under load
- Memory usage profiling
- Startup time measurement

---

*This architecture map provides the complete structural understanding needed for rewriting opencode-ultra. Each component is documented with its purpose, dependencies, and integration points.*