# OpenCode-Ultra Rewrite Strategy: Customizable Agent Names

## Overview
This document outlines the strategy for rewriting the `opencode-ultra` plugin to support fully customizable agent names while maintaining 100% backward compatibility. The current plugin hardcodes 9 agent identifiers (`sisyphus`, `oracle`, `hephaestus`, etc.), preventing direct integration with Shark Frankenstein CLI naming conventions.

## Current Architecture Constraints

### 1. Hardcoded Agent Definitions
**Location**: `BUILTIN_AGENTS` object (line 14824 in `dist/index.js`)
```javascript
var BUILTIN_AGENTS = {
  sisyphus: { model: "openai/gpt-5.3-codex", description: "Primary orchestrator...", ... },
  oracle: { model: "zai-coding-plan/glm-5", description: "Design architect...", ... },
  // ... 7 more agents
};
```

### 2. Internal References
- **`spawn_agent("sisyphus")`** calls expect exact string matches
- **Agent filtering logic** (`if (name !== "sisyphus")`) 
- **Prompt generation** builds agent tables using `BUILTIN_AGENTS` keys
- **Configuration merging** (`buildAgents()`) only overrides `model`, `description`, `prompt` for existing keys

### 3. Role-Based Tool Permissions
Each built-in agent has predefined tool allowances:
- `sisyphus`: Can use `Grep`, `Glob`, `Read` but NOT `Write`, `Edit`, `Bash`
- `hephaestus`: Full tool access for implementation
- Other agents: Varying restrictions based on specialization

## Rewrite Strategy

### Phase 1: Abstract Agent Schema
**Goal**: Replace `BUILTIN_AGENTS` with configurable agent schema

**New Agent Schema**:
```typescript
interface AgentDefinition {
  id: string;                    // Internal identifier (e.g., "sisyphus")
  display_name: string;          // User-facing name (e.g., "Kraken Brain")
  model: string;                 // Model reference (e.g., "0-glm-coding/glm-5")
  description: string;           // Role description
  prompt: string;                // System prompt (or "__DYNAMIC__" for templates)
  mode?: "subagent" | "primary"; // Agent mode
  maxTokens?: number;            // Token limits
  reasoningEffort?: "low" | "medium" | "high";
  tools: {                       // Tool permissions
    [toolName: string]: boolean;
  };
  aliases?: string[];            // Alternative names (e.g., ["kraken", "brain"])
}
```

**Migration Path**:
- Existing `BUILTIN_AGENTS` become default configuration in `defaultAgents.json`
- `buildAgents()` loads defaults first, then applies user config overrides
- Support both legacy and new configuration formats during transition

### Phase 2: Dynamic Agent Resolution
**Goal**: Make all agent references resolve through `resolveAgentId()`

**Key Changes**:
1. **`spawn_agent` tool**: Accept any agent ID, alias, or display name
   ```javascript
   function resolveAgentId(input) {
     // 1. Check exact ID match
     // 2. Check alias mapping
     // 3. Check display name (case-insensitive)
     // 4. Fallback to legacy behavior with warning
   }
   ```

2. **Agent Table Generation**: Use `display_name` in user-facing tables
   - Update `buildAgentTable()` to show Shark agent names
   - Maintain internal IDs for system operations

3. **Configuration Merging**: Support adding new agents (not just overriding)
   ```javascript
   // Current: only overrides existing agents
   result[name] = { ...def, ...override };
   
   // New: adds new agents if not in BUILTIN_AGENTS
   if (override && !BUILTIN_AGENTS[name]) {
     result[name] = createAgentFromSchema(override);
   }
   ```

### Phase 3: Enhanced Configuration System
**Goal**: Full flexibility in agent naming and mapping

**New Configuration Structure**:
```json
{
  "agents": {
    "kraken-brain": {
      "display_name": "Kraken Brain",
      "model": "0-glm-coding/glm-5",
      "description": "Primary orchestrator - analyzes requests, reads code directly...",
      "prompt": "__DYNAMIC__",
      "tools": { "Grep": true, "Glob": true, "Read": true, "Write": false, "Edit": false, "Bash": false },
      "aliases": ["sisyphus", "orchestrator", "brain"]
    },
    "shark-agent": {
      "display_name": "Shark Agent",
      "model": "0-glm-coding/glm-4.7",
      "description": "Deep autonomous worker - handles complex implementation...",
      "mode": "subagent",
      "tools": { "*": true },
      "aliases": ["hephaestus", "coder", "engineer"]
    }
  },
  "agent_aliases": {
    "architect": "oracle",
    "review": "momus",
    "planning": "metis",
    "scout": "explore",
    "scribe": "librarian",
    "visual": "multimodal-looker",
    "manager": "atlas"
  }
}
```

### Phase 4: Plugin-Wide Refactoring
**Goal**: Update all internal references to use new resolution system

**Files to Modify**:
1. **Agent Management** (`src/agents/index.ts`):
   - Replace `BUILTIN_AGENTS` with configurable schema
   - Update `buildAgents()` and `buildAgentTable()`

2. **Tool Implementation** (`src/tools/spawn-agent.ts`):
   - Integrate `resolveAgentId()` into `spawn_agent` tool
   - Update safety checks to use resolved IDs

3. **Prompt Generation** (`src/prompts/sisyphus.ts`):
   - Generate templates using display names
   - Maintain Sisyphus's special prompt structure

4. **Hook System** (`src/hooks/`):
   - Update keyword detection to recognize new agent names
   - Ensure fragment injection works with aliases

5. **Configuration** (`src/config/`):
   - Add schema validation for new agent definitions
   - Create migration utility for existing configs

## Backward Compatibility Strategy

### 1. Dual-Configuration Support
- Legacy `agents` config (overrides only) continues to work
- New `agent_definitions` config for full customization
- System merges both with precedence: `agent_definitions` > `agents`

### 2. Automatic Migration
```javascript
function migrateLegacyConfig(config) {
  if (config.agents && !config.agent_definitions) {
    // Convert override-style config to definition-style
    const definitions = {};
    for (const [id, override] of Object.entries(config.agents)) {
      definitions[id] = {
        ...BUILTIN_AGENTS[id], // Start with default
        ...override,           // Apply overrides
        id: id,                // Preserve ID
        display_name: override.description?.split(' - ')[0] || id
      };
    }
    config.agent_definitions = definitions;
  }
  return config;
}
```

### 3. Deprecation Warning
- Log warning when using legacy configuration
- Provide migration command: `/migrate-opencode-ultra-config`

## Testing Requirements

### 1. Functional Tests
- [ ] All 9 original agents work with legacy config
- [ ] New agent definitions can be added
- [ ] Aliases resolve correctly
- [ ] Tool permissions respect new definitions
- [ ] Prompt generation uses display names

### 2. Integration Tests
- [ ] Shark CLI integration with custom agent names
- [ ] `spawn_agent` tool with aliases
- [ ] Evolve system recognizes new agents
- [ ] Health check reports correct agent mappings

### 3. Performance Tests
- [ ] No degradation in spawn times
- [ ] Configuration loading < 100ms
- [ ] Memory footprint unchanged

## Implementation Timeline

### Week 1: Foundation
- Day 1-2: Create abstract agent schema and types
- Day 3-4: Implement `resolveAgentId()` and basic resolution
- Day 5: Update configuration loading with migration

### Week 2: Core Integration
- Day 1-2: Refactor `spawn_agent` tool
- Day 3-4: Update prompt generation system
- Day 5: Implement alias support

### Week 3: Compatibility & Testing
- Day 1-2: Backward compatibility layer
- Day 3-4: Comprehensive test suite
- Day 5: Performance benchmarking

### Week 4: Shark Integration
- Day 1-2: Update Shark CLI configuration
- Day 3-4: Integration testing
- Day 5: Documentation and release

## Success Metrics

1. **Backward Compatibility**: 100% of existing `opencode-ultra.json` configs work unchanged
2. **Customization**: Users can define new agents with custom names, models, and prompts
3. **Performance**: No measurable degradation in agent spawning or task execution
4. **Shark Integration**: Shark agents (`kraken-brain`, `shark-agent`, etc.) work natively
5. **User Experience**: Transition is seamless for existing users

## Risk Mitigation

### High Risk: Breaking Existing Configs
- **Mitigation**: Maintain dual-configuration support for 2 major versions
- **Fallback**: Automatic migration with backup of original config
- **Validation**: Schema validation before applying changes

### Medium Risk: Performance Impact
- **Mitigation**: Benchmark before/after each major change
- **Optimization**: Cache resolved agent mappings
- **Monitoring**: Add performance telemetry

### Low Risk: Complex Configuration
- **Mitigation**: Provide configuration templates and examples
- **Documentation**: Step-by-step migration guide
- **Tooling**: Configuration validation command

## Deliverables

1. **Rewritten `opencode-ultra` plugin** with customizable agent names
2. **Migration utility** for existing configurations
3. **Updated documentation** for Shark CLI integration
4. **Test suite** covering all functionality
5. **Performance benchmarks** demonstrating parity

## Next Steps for Build Team

1. **Fork the repository**: `github.com/ouchanip/opencode-ultra`
2. **Set up development environment**: `npm install`, `npm run build`
3. **Study current architecture**: Review `src/` directory structure
4. **Implement Phase 1**: Abstract agent schema
5. **Test incrementally**: After each phase, verify existing functionality

---

*This document provides the strategic foundation for rewriting opencode-ultra. Each phase includes specific, actionable tasks that can be executed mechanically by the build team.*