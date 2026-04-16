# OpenCode-Ultra Quick Reference

## Core Components

### 🎯 Agents (9 Total)
1. **Sisyphus** - Primary orchestrator (GLM-5)
2. **Oracle** - Design architect & debugger (GLM-4.7)
3. **Explore** - Fast codebase explorer (GLM-4.5-flash)
4. **Librarian** - Documentation researcher (GLM-4.5-flash)
5. **Multimodal-Looker** - Visual analyzer (GLM-4.5-flash)
6. **Metis** - Strategic planner (GLM-4.7)
7. **Momus** - Code reviewer (GLM-4.7)
8. **Atlas** - Task orchestrator (GLM-4.5-flash)
9. **Hephaestus** - Deep autonomous worker (GLM-4.7)

### 🛠️ Tools (8 Core)
- `spawn_agent` - Parallel agent execution
- `ralph_loop` - Iterative execution (UI glitch fixed v4)
- `evolve-scan` - Code evolution analysis
- `evolve-filter` - Evolution candidate scoring
- `health-check` - System monitoring
- `batch-read` - Batch file operations
- `continuity-ledger` - Task continuity
- `ast-search` - AST-based search

### ⚙️ Systems
- **ThreadWeaver** - Complex task decomposition
- **Safety Hooks** (8) - Comment checking, token truncation, etc.
- **Concurrency Management** - Pool, semaphore, background tasks
- **MCP Integration** - Model Context Protocol support

## Configuration Files

### `~/.config/opencode/opencode-ultra.json`
```json
{
  "agents": {
    "sisyphus": { "model": "0-glm-coding/glm-5" }
    // ... other agents
  },
  "background_task": {
    "defaultConcurrency": 3,
    "providerConcurrency": { "0-glm-coding": 5 }
  },
  "safety": {
    "maxTotalSpawned": 10,
    "agentTimeoutMs": 300000
  }
}
```

## Usage Examples

### Run Sisyphus
```bash
opencode run --agent sisyphus "Analyze this codebase"
```

### Check Configuration
```bash
opencode debug config | grep -A2 '"plugin"'
opencode debug agent sisyphus
```

## Integration with Shark Frankenstein

### ✅ Direct Alignment
- Kraken Brain ≈ Sisyphus (orchestrator)
- GLM Engineers ≈ OpenCode-Ultra agents (workforce)
- Nemotron Bridge ≈ ThreadWeaver + Session Compaction

### 🔧 Integration Needed
1. **Dual-Brain Model Configuration**
   - Micro: Local vLLM Qwen (execution) + DeepSeek Chat (thinking)
   - Macro: GLM 5 (primary) + OpenCode-Ultra agents

2. **Safety Stack Connection**
   - Connect Guardian, FirewallMesh, StagnationDetector, Workflow Enforcement

3. **Tiered Routing**
   - Simple tasks → Micro engineer
   - Complex tasks → Macro engineer + specialists

## Verification Commands

```bash
# Check plugin loading
opencode debug config | grep '"plugin"'

# Check default agent
opencode debug config | grep '"default_agent"'

# Test sisyphus
opencode run --agent sisyphus "Test"

# List registered agents
timeout 5 opencode run --agent sisyphus "Test" 2>&1 | grep "agents: \["
```

## Current Status
- ✅ Plugin installed: opencode-ultra@0.9.9
- ✅ Config migrated to v1.3.4 structure
- ✅ All 9 agents registered
- ✅ Sisyphus working as default agent
- ⚠️ Needs dual-brain model configuration
- ⚠️ Needs Shark safety stack integration

---
**Document**: `OPENCODE_ULTRA_OVERVIEW.md` for detailed analysis  
**Context**: `SHARK_FRANKENSTEIN_COMPLETE_CONTEXT.md`  
**Last Updated**: 2026-03-29