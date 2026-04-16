# Shark Frankenstein + OpenCode-Ultra Integration Mapping

## Agent Name Mapping

| Shark Name | OpenCode-Ultra Name | Model | Purpose |
|------------|---------------------|-------|---------|
| **Kraken Brain** | `sisyphus` | `0-glm-coding/glm-5` | Primary orchestrator |
| **Architect** | `oracle` | `0-deepseek/deepseek-reasoner` | Design architect & debugger |
| **Shark Agent** | `hephaestus` | `0-glm-coding/glm-4.7` | Deep autonomous worker |
| **Code Review** | `momus` | `0-deepseek/deepseek-chat` | Code reviewer |
| **Planning Brain** | `metis` | `0-deepseek/deepseek-reasoner` | Strategic planner |
| **Scout** | `explore` | `0-glm-coding/glm-4.5-flash` | Fast codebase explorer |
| **Scribe** | `librarian` | `0-deepseek/deepseek-chat` | Documentation researcher |
| **Visual Cortex** | `multimodal-looker` | `0-mimo/mimo-v2-omni` | Visual analyzer |
| **Middle Manager** | `atlas` | `0-nemotron/nemotron-3-super` | Task orchestrator |
| **Plugin Scout** | `scout` | `0-glm-coding/glm-4.5-flash` | Plugin ecosystem researcher |

## Model Provider Configuration

### Configured Providers:
1. **`0-glm-coding`** - GLM models (GLM-5, GLM-4.7, GLM-4.5-flash)
2. **`0-deepseek`** - DeepSeek models (Chat, Reasoner)
3. **`0-local-vllm`** - Local Qwen 2.5 Coder 7B AWQ
4. **`0-mimo`** - MiMo V2 Omni (multimodal)
5. **`0-nemotron`** - Nemotron 3 Super (1M context)

### Category Mappings:
- `quick`: `0-glm-coding/glm-4.5-flash`
- `deep`: `0-glm-coding/glm-5`
- `coding`: `0-glm-coding/glm-4.7`
- `micro`: `0-local-vllm/qwen-2.5-coder` (Micro engineer execution)
- `macro`: `0-glm-coding/glm-5` (Macro engineer primary)
- `thinking`: `0-deepseek/deepseek-chat` (Micro engineer thinking)

## Configuration Files

### `~/.config/opencode/opencode-ultra.json`
- **Agents**: Mapped with Shark descriptions
- **Concurrency**: Configured per provider/model
- **Safety**: Max 10 spawned agents, 5min timeouts
- **Evolve EXE**: `hephaestus` implements, `momus` reviews

### `~/.config/opencode/opencode.json`
- **Providers**: All 5 model providers configured
- **Plugin**: `opencode-ultra` loaded
- **Permissions**: All allowed (adjust for safety)

## Usage Examples

### Run Kraken Brain (Primary Orchestrator)
```bash
opencode run --agent sisyphus "Analyze and plan implementation for feature X"
```

### Spawn Specialist Agents (via Kraken Brain)
Kraken Brain will use `spawn_agent` tool to deploy:
- `oracle` for architecture design
- `hephaestus` for implementation
- `momus` for code review
- `explore` for codebase research

### Check Configuration
```bash
# Verify plugin loading
opencode debug config | grep '"plugin"'

# Check agent models
opencode debug agent sisyphus | grep -i "model\|description"

# Test agent availability
timeout 5 opencode run --agent sisyphus "Test" 2>&1 | grep "> sisyphus"
```

## Integration Status

### ✅ Working
- All 9 agents registered with Shark model assignments
- Sisyphus (Kraken Brain) uses GLM-5
- Oracle (Architect) uses DeepSeek Reasoner
- Hephaestus (Shark Agent) uses GLM-4.7
- All model providers configured
- Concurrency limits set

### ⚠️ Limitations
1. **Agent Names**: Must use opencode-ultra internal names (sisyphus, oracle, etc.)
2. **Subagent Restriction**: Most agents are subagents, only spawnable via `spawn_agent`
3. **Plugin Customization**: Cannot rename agents without modifying plugin source

### 🔧 Next Steps
1. **Create Shark CLI Wrapper**: Map Shark commands to opencode-ultra agents
2. **Implement Dual-Brain Routing**: Simple tasks → Micro, Complex tasks → Macro + specialists
3. **Integrate Safety Stack**: Connect Guardian, FirewallMesh, StagnationDetector
4. **Add Shark Fragments**: Custom instructions for each agent role

## Verification Tests

```bash
# Test 1: Plugin loading
opencode debug config | grep -A2 '"plugin"'

# Test 2: Agent registration
timeout 5 opencode run --agent sisyphus "Test" 2>&1 | grep "Agents registered"

# Test 3: Model assignment
timeout 5 opencode run --agent sisyphus "Test" 2>&1 | grep "> sisyphus"

# Test 4: Provider configuration
grep -c "provider" ~/.config/opencode/opencode.json
```

## Quick Reference Commands

```bash
# Start Shark-integrated OpenCode
opencode

# Run with Kraken Brain
opencode run --agent sisyphus "Your task"

# Debug configuration
opencode debug config

# Check specific agent
opencode debug agent sisyphus

# List available agents
timeout 5 opencode run --agent sisyphus "Test" 2>&1 | grep "agents: \["
```

---
**Integration Date**: 2026-03-29  
**OpenCode-Ultra**: v0.9.9  
**OpenCode**: v1.3.4  
**Status**: ✅ Integrated with model mappings  
**Next Phase**: Shark CLI wrapper implementation