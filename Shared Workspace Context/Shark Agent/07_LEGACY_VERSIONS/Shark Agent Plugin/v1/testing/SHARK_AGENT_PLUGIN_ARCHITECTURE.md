# Shark Agent Plugin - Opencode Integration Architecture

## Executive Summary

The Shark Agent Plugin transforms the Shark Frankenstein dual-brain AI coding assistant into a toggleable Opencode plugin. This enables "Shark Mode" - an autonomous dual-brain agent coordination system that switches between planning and execution brains automatically, visible in the Opencode chat UI.

## Core Architecture

### Dual-Brain System Integration

**Micro Engineer (Free/Local Tier):**
- **Thinker/Planner**: DeepSeek Chat (API reasoning only)
- **Executor**: vLLM Qwen 2.5 Coder 7B AWQ (local zero-cost execution)
- **Fallback**: Gemma 3 4B if vLLM unavailable

**Macro Engineer (Paid/Cloud Tier):**
- **Primary Brain**: GLM 5 (autonomous execution)
- **Advisory Brain**: DeepSeek R1 (strategic consultation)
- **Cost**: ~$0.02-0.08 per task

### 4-Layer Safety Stack (Mechanical Enforcement)

1. **Guardian**: Filesystem protection (blocks `/etc`, `/usr`, `~/.ssh/`)
2. **FirewallMesh**: 4 parallel firewalls (<50ms overhead)
3. **StagnationDetector**: 3 identical failures → escalation
4. **Workflow Enforcement**: PLAN→BUILD→TEST→VERIFY→SHIP (brick-wall)

## Plugin Structure

### File Organization
```
shark-agent-plugin/
├── src/
│   ├── index.ts              # Main plugin entry point
│   ├── wizard/               # Mode selector wizard
│   │   ├── index.ts          # Wizard orchestration
│   │   ├── micro-wizard.ts   # Micro engineer wizard
│   │   └── macro-wizard.ts   # Macro engineer wizard
│   ├── coordinator/          # Dual-brain coordination
│   │   ├── shark-coordinator.ts
│   │   ├── micro-coordinator.ts
│   │   └── macro-coordinator.ts
│   ├── safety/              # Safety stack integration
│   │   ├── guardian-adapter.ts
│   │   ├── firewall-mesh-adapter.ts
│   │   └── workflow-enforcer.ts
│   ├── hooks/               # Opencode hooks
│   │   ├── chat-hooks.ts
│   │   ├── tool-hooks.ts
│   │   └── session-hooks.ts
│   └── utils/
│       └── model-switcher.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Opencode Hooks Implementation

```typescript
// Core hooks the plugin will implement
export interface SharkHooks {
  // Session initialization wizard
  "chat.message"?: (input, output) => Promise<void>;
  
  // Tool execution safety enforcement
  "tool.execute.before"?: (input, output) => Promise<void>;
  "tool.execute.after"?: (input, output) => Promise<void>;
  
  // Model switching for dual-brain
  "chat.params"?: (input, output) => Promise<void>;
  
  // Session state management
  "experimental.session.compacting"?: (input, output) => Promise<void>;
  
  // Custom tool definitions
  tool?: {
    "shark_toggle": ToolDefinition;
    "shark_mode_select": ToolDefinition;
  };
}
```

## Mode Selector Wizard

### Wizard Flow
1. **Session Launch**: Plugin loads, detects new session
2. **Wizard Trigger**: Intercepts first user message with Question tool
3. **Mode Selection**: User chooses Micro/Macro engineer
4. **Configuration**: Wizard collects necessary API keys/config
5. **Activation**: Enables Shark Mode with selected configuration
6. **Toggle UI**: Adds "Shark" toggle to Opencode agent harness UI

### Wizard Implementation
```typescript
class SharkModeWizard {
  async launch(sessionID: string): Promise<SharkMode> {
    // Use Opencode's Question tool (same as plan mode)
    const answers = await Question.ask({
      sessionID,
      questions: [{
        question: "🦈 SHARK AGENT MODE SELECTOR\n\nSelect your Shark Agent mode:",
        header: "Shark Mode",
        custom: false,
        options: [
          { 
            label: "Micro Engineer (Free/Local)", 
            description: "DeepSeek Chat thinks + local vLLM Qwen executes (zero-cost)" 
          },
          { 
            label: "Macro Engineer (Paid/Cloud)", 
            description: "GLM 5 primary + DeepSeek R1 advisory (~$0.02-0.08/task)" 
          }
        ]
      }]
    });
    
    const mode = answers[0]?.[0];
    return this.configureMode(mode, sessionID);
  }
}
```

## Dual-Brain Coordination Engine

### Brain Switching Logic
```typescript
class SharkCoordinator {
  private currentBrain: 'planning' | 'execution' = 'planning';
  private mode: 'micro' | 'macro';
  
  async coordinate(task: string): Promise<CoordinationResult> {
    // Phase 1: Planning Brain (DeepSeek)
    const plan = await this.planningBrain.generatePlan(task);
    
    // Phase 2: Switch to Execution Brain
    await this.switchToExecutionBrain();
    
    // Phase 3: Execute Plan
    const result = await this.executionBrain.executePlan(plan);
    
    // Phase 4: Optional Review
    if (this.mode === 'macro') {
      const review = await this.advisoryBrain.review(result);
      if (review.needsImprovement) {
        return this.coordinate(review.feedback);
      }
    }
    
    return result;
  }
  
  private async switchToExecutionBrain(): Promise<void> {
    // Update Opencode UI to show brain switch
    await this.updateChatModelIndicator();
    this.currentBrain = 'execution';
  }
}
```

## Safety Stack Integration

### Guardian Adapter
```typescript
class GuardianAdapter {
  private guardian: Guardian;
  
  async checkToolCall(tool: string, args: any): Promise<CheckResult> {
    // Map Opencode tools to Guardian permissions
    const permission = this.mapToolToPermission(tool);
    const filePath = this.extractFilePath(args);
    
    return this.guardian.checkPermission(filePath, permission);
  }
  
  private mapToolToPermission(tool: string): 'read' | 'write' | 'execute' {
    const writeTools = ['write', 'edit', 'multiedit', 'patch'];
    const executeTools = ['bash', 'run_command'];
    
    if (writeTools.includes(tool)) return 'write';
    if (executeTools.includes(tool)) return 'execute';
    return 'read';
  }
}
```

## UI Integration

### Chat Model Indicator
When Shark Mode switches brains, the Opencode chat UI should show:
- **Planning Phase**: "DeepSeek Chat (Planning)" model indicator
- **Execution Phase**: "Qwen 2.5 Coder (Execution)" or "GLM 5 (Execution)" indicator

### Toggle Interface
Add to Opencode agent harness UI:
```
[ ] Plan Mode  [ ] Build Mode  [🦈] Shark Mode
```

When Shark Mode is toggled:
1. Disables manual plan/build toggles
2. Enables autonomous brain switching
3. Shows current brain state in status bar

## Configuration Management

### Plugin Configuration
```json
{
  "plugin": ["shark-agent-plugin"],
  "shark": {
    "default_mode": "micro",
    "auto_launch_wizard": true,
    "safety": {
      "guardian_enabled": true,
      "firewall_mesh_enabled": true,
      "workflow_enforcement": "strict"
    },
    "micro": {
      "thinking_model": "0-deepseek/deepseek-chat",
      "execution_model": "0-local-vllm/qwen-2.5-coder"
    },
    "macro": {
      "primary_model": "0-glm-coding/glm-5",
      "advisory_model": "0-deepseek/deepseek-reasoner"
    }
  }
}
```

## Integration Points with Existing Shark Frankenstein

### Components to Extract
1. **Dual-Brain Coordinator** (`src/brain/coordinator_*.ts`)
2. **Safety Stack** (`src/guardian/`, `src/tools/firewall-mesh_*.ts`)
3. **Workflow Enforcement** (`src/workflow/blocker.ts`)
4. **Model Clients** (`src/brain/deepseek.ts`, `src/brain/vllm.ts`)

### Adaptation Required
1. **Opencode Hook Mapping**: Convert Shark internal events to Opencode hooks
2. **Tool Interface**: Map Shark tool calls to Opencode tool system
3. **Session Management**: Integrate with Opencode session lifecycle
4. **Configuration**: Use Opencode config system instead of Shark's

## Testing Strategy

### Unit Tests
- Wizard flow and mode selection
- Brain switching logic
- Safety stack integration
- Hook execution

### Integration Tests
- Full plugin loading in Opencode
- Tool execution with safety enforcement
- Model switching in chat UI
- Session persistence

### Performance Tests
- Safety stack overhead (<50ms target)
- Brain switching latency
- Memory usage with multiple sessions

## Deployment Plan

### Phase 1: Core Plugin (2 weeks)
- Basic plugin structure with wizard
- Micro engineer integration
- Safety stack hooks

### Phase 2: Full Integration (3 weeks)
- Macro engineer support
- Complete safety stack
- UI integration

### Phase 3: Optimization (1 week)
- Performance tuning
- Error handling
- Documentation

## Success Metrics

1. **User Experience**: Wizard completes in <30 seconds
2. **Safety**: 100% prevention of dangerous operations
3. **Performance**: <100ms overhead per tool call
4. **Reliability**: 99.9% successful brain switches
5. **Cost Efficiency**: Micro engineer maintains zero-cost operation

## Risk Mitigation

### Technical Risks
- **Opencode API changes**: Use abstraction layer
- **Model availability**: Fallback systems
- **Performance overhead**: Caching and optimization

### User Experience Risks
- **Complex wizard**: Progressive disclosure
- **Mode confusion**: Clear UI indicators
- **Cost surprises**: Transparent pricing display

## Conclusion

The Shark Agent Plugin brings the proven Shark Frankenstein architecture into Opencode as a first-class citizen. By leveraging Opencode's plugin system and hook architecture, we can deliver a sophisticated dual-brain AI assistant with mechanical safety enforcement, visible brain switching in the UI, and a seamless user experience that maintains the core "Earth Density & River Flow" philosophy: AI autonomy (water) guided by mechanical enforcement (riverbanks).