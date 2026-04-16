# Shark Agent Plugin - Technical Architecture

## 🏗️ System Architecture Overview

### **100% Standalone OpenCode Plugin**
- **Zero dependencies** on other plugins (opencode-ultra, etc.)
- **Vanilla OpenCode 1.2.0+** compatibility only
- **Core dependencies**: `@opencode-ai/plugin`, `@opencode-ai/sdk`, `zod`

### **Dual-Brain System Integration**

#### **Micro Engineer (Free/Local Tier)**
```
Thinker/Planner: DeepSeek Chat (API reasoning only)
Executor: vLLM Qwen 2.5 Coder 7B AWQ (local zero-cost execution)
Fallback: Gemma 3 4B if vLLM unavailable
Cost: ZERO (local vLLM) or FREE tier (Gemma 14k RPD)
```

#### **Macro Engineer (Paid/Cloud Tier)**
```
Primary Brain: GLM 5 (autonomous execution)
Advisory Brain: DeepSeek R1 (strategic consultation)
Cost: ~$0.02-0.08 per task
```

### **4-Layer Safety Stack (Mechanical Enforcement)**
1. **Guardian**: Filesystem protection (blocks `/etc`, `/usr`, `~/.ssh/`)
2. **FirewallMesh**: 4 parallel firewalls (<50ms overhead)
3. **StagnationDetector**: 3 identical failures → escalation to higher reasoning
4. **Workflow Enforcement**: PLAN→BUILD→TEST→VERIFY→SHIP (brick-wall blocking)

## 🔌 OpenCode Hook Integration

### **Core Hook Mapping**
```typescript
// Main plugin hooks (vanilla OpenCode only)
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
  };
}
```

### **Hook Implementation Details**

#### **1. Mode Selector Wizard (`chat.message` hook)**
```typescript
// Uses OpenCode's built-in Question tool (identical to plan mode)
const answers = await Question.ask({
  sessionID,
  questions: [{
    question: "🦈 SHARK AGENT MODE SELECTOR",
    header: "Shark Mode",
    custom: false,
    options: [
      { 
        label: "Micro Engineer (Free/Local)", 
        description: "DeepSeek thinks + local vLLM Qwen executes (zero-cost)" 
      },
      { 
        label: "Macro Engineer (Paid/Cloud)", 
        description: "GLM 5 primary + DeepSeek R1 advisory (~$0.02-0.08/task)" 
      }
    ]
  }]
});
```

#### **2. Safety Stack Integration (`tool.execute.before` hook)**
```typescript
// All tool calls flow through safety stack
async 'tool.execute.before'(input, output) {
  const toolCall: ToolCall = {
    name: input.tool,
    args: output.args,
    sessionID: input.sessionID
  };
  
  // Run 4-layer safety check
  const safetyResult = await safetyStack.check(toolCall);
  
  if (!safetyResult.allowed) {
    throw new Error(`Safety blocked: ${safetyResult.reason}`);
  }
}
```

#### **3. Model Switching (`chat.params` hook)**
```typescript
// Dynamically switch models based on brain state
async 'chat.params'(input, output) {
  const brainState = coordinator.getCurrentBrain(input.sessionID);
  
  if (brainState === 'planning') {
    // Use thinking model (DeepSeek)
    return coordinator.adjustForPlanning(output);
  } else {
    // Use execution model (Qwen/GLM)
    return coordinator.adjustForExecution(output);
  }
}
```

## 🧩 Component Architecture

### **Plugin Entry Point (`src/index.ts`)**
```typescript
import type { PluginInput, Hooks } from '@opencode-ai/plugin';
import { SharkModeWizard } from './wizard';
import { SharkCoordinator } from './coordinator';

export default async function sharkPlugin(input: PluginInput): Promise<Hooks> {
  const wizard = new SharkModeWizard(input);
  const coordinator = new SharkCoordinator(input);
  
  return {
    // Session initialization wizard
    async 'chat.message'(input, output) {
      if (await wizard.shouldLaunch(input.sessionID)) {
        await wizard.launch(input.sessionID);
      }
    },
    
    // Tool safety enforcement
    async 'tool.execute.before'(input, output) {
      return coordinator.checkToolSafety(input.tool, output.args);
    },
    
    // Model switching
    async 'chat.params'(input, output) {
      return coordinator.adjustModelParams(input, output);
    },
    
    // Custom tools
    tool: {
      'shark_toggle': sharkToggleTool
    }
  };
}
```

### **Shark Frankenstein V2 Components to Extract**

#### **Core Components (Priority: V2 files)**
```
src/brain/coordinator-micro_v2.ts      # Micro engineer coordinator
src/brain/coordinator-macro_v2.ts      # Macro engineer coordinator  
src/brain/coordinator-base_v2.ts       # Base coordinator
src/tools/executor_v2.ts               # ToolExecutor (CONSTITUTIONAL ANCHOR)
src/tools/firewall-mesh_v2.ts          # Parallel firewall mesh
src/tools/stagnation-detector_v2.ts    # Stagnation detection
src/workflow/blocker.ts                # Workflow enforcement (NEEDS CONNECTION)
src/guardian/index.ts                  # Filesystem protection
```

#### **Model Clients**
```
src/brain/deepseek.ts                  # DeepSeek API client
src/brain/glm.ts                       # GLM API client  
src/brain/gemma.ts                     # Gemma API client
src/brain/vllm.ts                      # vLLM local client
```

### **Component Adaptation Strategy**

#### **1. Coordinator Adaptation**
```typescript
// Adapt Shark coordinator to OpenCode environment
class MicroCoordinatorAdapter {
  private coordinator: MicroCoordinator;
  
  constructor(config: MicroConfig) {
    // Extract from Shark Frankenstein V2
    this.coordinator = new MicroCoordinator({
      ...config,
      workspacePath: this.getWorkspacePath()
    });
  }
  
  async execute(task: string): Promise<CoordinationResult> {
    // Use Shark's dual-brain logic
    const result = await this.coordinator.execute(task);
    
    // Update OpenCode UI with brain switch
    await this.updateBrainIndicator('planning', '0-deepseek/deepseek-chat');
    
    return result;
  }
}
```

#### **2. Safety Stack Adaptation**
```typescript
// Map Shark safety stack to OpenCode hooks
class SafetyStackAdapter {
  private guardian: Guardian;
  private firewallMesh: FirewallMesh;
  private workflowBlocker: WorkflowBlocker;
  
  async checkToolCall(tool: string, args: any): Promise<SafetyResult> {
    // Run all safety checks in parallel
    const [guardianResult, firewallResult, workflowResult] = await Promise.all([
      this.guardian.check(tool, args),
      this.firewallMesh.check(tool, args),
      this.workflowBlocker.check(tool, args)
    ]);
    
    // First blocking decision wins
    if (!guardianResult.allowed) return guardianResult;
    if (!firewallResult.allowed) return firewallResult;
    if (!workflowResult.allowed) return workflowResult;
    
    return { allowed: true };
  }
}
```

## 🔧 Configuration Management

### **Plugin Configuration Schema**
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

### **Environment Variables**
```
# Required for Stage 2 tests (currently failing)
GLM_API_KEY=          # For Macro Engineer
DEEPSEEK_API_KEY=     # For DeepSeek planning
GOOGLE_API_KEY=       # For Gemma fallback
```

## 🚨 Critical Integration Points

### **1. WorkflowBlocker ↔ ToolExecutor Connection**
**CURRENT STATE**: Disconnected in Shark Frankenstein V2 architecture  
**REQUIRED**: Connect `WorkflowBlocker` to `ToolExecutor` for mechanical workflow enforcement  
**IMPACT**: Brick-wall blocking (PLAN→BUILD→TEST→VERIFY→SHIP) won't work without this

### **2. File Renaming for Shell Compatibility**
**CURRENT**: `integration-test(V2).ts` (parentheses break shell scripts)  
**REQUIRED**: `integration-test_v2.ts` (follow existing `*_v2.ts` pattern)  
**IMPACT**: Shell tab-completion and scripting broken

### **3. API Key Configuration for Testing**
**CURRENT**: Stage 2 tests failing (2/3) due to missing API keys  
**REQUIRED**: Set `GLM_API_KEY`, `DEEPSEEK_API_KEY`, `GOOGLE_API_KEY`  
**IMPACT**: Cannot validate real API integration

## 🧪 Testing Strategy

### **Unit Tests**
- Wizard flow and mode selection
- Brain switching logic  
- Safety stack integration
- Hook execution

### **Integration Tests**
- Full plugin loading in vanilla OpenCode
- Tool execution with safety enforcement
- Model switching in chat UI
- Session persistence

### **Performance Tests**
- Safety stack overhead (<50ms target)
- Brain switching latency (<100ms target)
- Memory usage with multiple sessions (<50MB/session)

## 📈 Performance Targets

| Component | Target | Measurement |
|-----------|--------|-------------|
| Safety stack | <50ms per tool call | 95th percentile |
| Brain switch | <100ms | End-to-end latency |
| Wizard launch | <30 seconds | User perception |
| Memory usage | <50MB per session | Resident set size |
| Plugin load | <500ms | Cold start time |

## 🔄 Workflow Enforcement Details

### **PLAN→BUILD→TEST→VERIFY→SHIP Brick Wall**
```
PLAN:    Strategic plan with DeepSeek R1
BUILD:   Code implementation with Qwen/GLM
TEST:    Unit/integration tests execution
VERIFY:  Code review and validation
SHIP:    Final deployment and commits
```

### **Blocking Mechanisms**
1. **Git pre-push hook** - Blocks `git push` if workflow not complete
2. **State check** - Any shark command checks workflow state first
3. **File protection** - Guardian blocks writes to protected paths
4. **BYPASS**: NONE. The only way through is to complete requirements.

## 🔗 Dependencies Graph

```
@opencode-ai/plugin  →  Shark Agent Plugin  →  @opencode-ai/sdk
        ↓                           ↓                  ↓
   OpenCode Hooks           Shark Frankenstein       Question.ask()
        ↓                           ↓                  ↓
   Vanilla OpenCode          V2 Components         Wizard UI
```

**NO DEPENDENCIES ON**: opencode-ultra, or any other plugins

---
**Architecture Version**: 2.0 (Vanilla OpenCode)  
**Last Updated**: March 30, 2025  
**Status**: Ready for Implementation  
**Critical Issues**: WorkflowBlocker ↔ ToolExecutor connection missing