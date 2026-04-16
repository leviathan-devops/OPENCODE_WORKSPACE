# Shark Agent Plugin - Implementation Roadmap

## 🗓️ Timeline Overview

**Total Duration**: 7 weeks  
**Start Date**: March 30, 2025  
**Target Completion**: May 18, 2025  
**Priority**: HIGH - Critical integration work needed

## 📋 Phase 1: Foundation (Week 1-2)

### **Week 1: Environment Setup & Analysis**
**Goal**: Create clean plugin project with zero external dependencies

#### **Day 1-2: Project Initialization**
```bash
# Create standalone plugin project
mkdir shark-agent-plugin
cd shark-agent-plugin

# Initialize with ONLY vanilla OpenCode dependencies
npm init -y
npm install @opencode-ai/plugin @opencode-ai/sdk zod
npm install -D typescript @types/node

# Analyze vanilla OpenCode SDK (NO opencode-ultra)
cp -r /home/leviathan/OPENCODE_WORKSPACE/configs/opencode/opencode/node_modules/@opencode-ai/plugin ./reference/sdk
cp -r /home/leviathan/OPENCODE_WORKSPACE/configs/opencode/opencode/node_modules/@opencode-ai/sdk ./reference/sdk
```

#### **Day 3-4: Shark Codebase Extraction**
```bash
# Extract V2 components from Shark Frankenstein
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/brain ./src/extracted/brain
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/tools ./src/extracted/tools
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/guardian ./src/extracted/guardian

# Focus on V2 files only
# coordinator-micro_v2.ts, executor_v2.ts, firewall-mesh_v2.ts, etc.
```

#### **Day 5: Architecture Review**
- Review `ARCHITECTURE.md` and `CURRENT_STATE.md`
- Create detailed component interface specifications
- Define hook mapping strategy for vanilla OpenCode
- **Output**: Component adaptation plan document

### **Week 2: Core Plugin Structure**
**Goal**: Implement basic plugin with wizard and hook scaffolding

#### **Day 1-2: Plugin Entry Point**
```typescript
// src/index.ts - 100% vanilla OpenCode plugin
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
    
    // Custom toggle tool
    tool: {
      'shark_toggle': sharkToggleTool
    }
  };
}
```

#### **Day 3-4: Wizard Implementation**
```typescript
// src/wizard/index.ts - Uses OpenCode's Question.ask()
import { Question } from '@opencode-ai/sdk';

export class SharkModeWizard {
  async launch(sessionID: string): Promise<'micro' | 'macro'> {
    const answers = await Question.ask({
      sessionID,
      questions: [{
        question: "🦈 SHARK AGENT MODE SELECTOR",
        header: "Shark Mode",
        custom: false,
        options: [
          { label: "Micro Engineer (Free/Local)", description: "DeepSeek thinks + vLLM Qwen executes" },
          { label: "Macro Engineer (Paid/Cloud)", description: "GLM 5 primary + DeepSeek R1 advisory" }
        ]
      }]
    });
    
    const mode = answers[0]?.[0];
    await this.configureMode(mode, sessionID);
    return mode;
  }
}
```

#### **Day 5: Initial Integration Test**
```bash
# Build and test basic plugin
npm run build
cp dist/index.js ~/.config/opencode/plugins/shark-agent.js

# Test in vanilla OpenCode (NO opencode-ultra)
opencode --test-plugin shark-agent

# Verify: Plugin loads, wizard trigger logic works
```

## 📋 Phase 2: Dual-Brain Integration (Week 3-4)

### **Week 3: Micro Engineer Integration**
**Goal**: Implement Micro Engineer with local vLLM execution

#### **Day 1-2: Micro Coordinator Adaptation**
```typescript
// src/coordinator/micro-coordinator.ts
import { MicroCoordinator } from '../extracted/brain/coordinator-micro_v2';

export class MicroCoordinatorAdapter {
  private coordinator: MicroCoordinator;
  
  async execute(task: string): Promise<CoordinationResult> {
    // Use Shark's dual-brain logic
    const result = await this.coordinator.execute(task);
    
    // Update OpenCode UI with brain switch
    await this.updateBrainIndicator('planning', '0-deepseek/deepseek-chat');
    
    return result;
  }
}
```

#### **Day 3-4: Safety Stack Integration**
```typescript
// src/safety/guardian-adapter.ts
import { Guardian } from '../extracted/guardian';

export class GuardianAdapter {
  private guardian: Guardian;
  
  async checkToolCall(tool: string, args: any): Promise<CheckResult> {
    const permission = this.mapToolToPermission(tool);
    const filePath = this.extractFilePath(args);
    
    if (!filePath) return { allowed: true };
    
    const decision = this.guardian.checkPermission(filePath, permission);
    
    return {
      allowed: decision === ModificationDecision.ALLOW,
      reason: decision === ModificationDecision.BLOCK ? 'Guardian blocked' : undefined
    };
  }
}
```

#### **Day 5: Integration Testing**
```bash
# Test Micro Engineer flow
npm test -- --grep "Micro Engineer"

# Test safety stack
npm test -- --grep "Guardian"

# Test with local vLLM (if available)
npm test -- --grep "vLLM"
```

### **Week 4: Macro Engineer & UI Integration**
**Goal**: Implement Macro Engineer with cloud models and UI indicators

#### **Day 1-2: Macro Coordinator Integration**
```typescript
// src/coordinator/macro-coordinator.ts
import { MacroCoordinator } from '../extracted/brain/coordinator-macro_v2';

export class MacroCoordinatorAdapter {
  private coordinator: MacroCoordinator;
  
  async execute(task: string): Promise<CoordinationResult> {
    // GLM 5 primary execution
    const plan = await this.coordinator.planWithGLM(task);
    
    // DeepSeek R1 advisory review
    const review = await this.coordinator.reviewWithDeepSeek(plan);
    
    // Update UI with both brain indicators
    await this.updateBrainIndicators(['GLM-5', 'DeepSeek-R1']);
    
    return { plan, review };
  }
}
```

#### **Day 3-4: UI Integration**
```typescript
// src/ui/model-indicator.ts
export class ModelIndicator {
  async update(sessionID: string, brain: string, model: string): Promise<void> {
    // Update OpenCode chat UI to show current brain/model
    // Use OpenCode's UI extension points
    await this.injectIndicator(`
      <div class="shark-brain-indicator">
        ${brain} • ${model}
      </div>
    `);
  }
}
```

#### **Day 5: Toggle Interface**
```typescript
// src/ui/toggle-integration.ts
export class SharkToggle {
  async integrateWithOpencodeUI(): Promise<void> {
    // Add Shark toggle to OpenCode agent harness
    await this.injectToggleHTML(`
      <div class="agent-toggle shark-toggle">
        <input type="checkbox" id="shark-mode">
        <label for="shark-mode">🦈 Shark Mode</label>
      </div>
    `);
  }
}
```

## 📋 Phase 3: Safety & Workflow (Week 5-6)

### **Week 5: Complete Safety Stack**
**Goal**: Integrate all 4 safety layers and workflow enforcement

#### **Day 1-2: FirewallMesh Integration**
```typescript
// src/safety/firewall-mesh-adapter.ts
import { FirewallMesh } from '../extracted/tools/firewall-mesh_v2';

export class FirewallMeshAdapter {
  private mesh: FirewallMesh;
  
  async checkAllFirewalls(toolCall: ToolCall): Promise<MeshResult> {
    // Run all 4 firewalls in parallel
    const results = await Promise.all([
      this.mesh.checkGuardian(toolCall),
      this.mesh.checkWorkflow(toolCall),
      this.mesh.checkTheatrical(toolCall),
      this.mesh.checkSecret(toolCall)
    ]);
    
    return this.aggregateResults(results);
  }
}
```

#### **Day 3-4: Workflow Enforcement**
```typescript
// src/safety/workflow-enforcer.ts
import { WorkflowBlocker } from '../extracted/workflow/blocker';

export class WorkflowEnforcer {
  private blocker: WorkflowBlocker;
  private currentStep: WorkflowStep = 'PLAN';
  
  async enforceStep(step: WorkflowStep, evidence: Evidence): Promise<void> {
    // CRITICAL: This depends on WorkflowBlocker ↔ ToolExecutor connection
    if (!this.blocker.canProceed(this.currentStep, step, evidence)) {
      throw new WorkflowError(`Cannot proceed from ${this.currentStep} to ${step}`);
    }
    
    this.currentStep = step;
    await this.logStepTransition(step, evidence);
  }
}
```

#### **Day 5: Stagnation Detection**
```typescript
// src/safety/stagnation-detector.ts
import { StagnationDetector } from '../extracted/tools/stagnation-detector_v2';

export class StagnationDetectorAdapter {
  private detector: StagnationDetector;
  
  async checkForStagnation(failures: Failure[]): Promise<StagnationAlert | null> {
    if (failures.length >= 3) {
      const alert = this.detector.recordFailure(failures);
      
      if (alert?.type === 'escalation') {
        await this.escalateToHigherReasoning(alert);
      }
      
      return alert;
    }
    
    return null;
  }
}
```

### **Week 6: Configuration & Optimization**
**Goal**: Complete configuration system and performance optimization

#### **Day 1-2: Configuration System**
```typescript
// src/config/index.ts
export class SharkConfig {
  async load(): Promise<SharkPluginConfig> {
    // Load from OpenCode config (vanilla system)
    const config = await this.input.client.config.get();
    
    return {
      default_mode: config.shark?.default_mode || 'micro',
      auto_launch_wizard: config.shark?.auto_launch_wizard ?? true,
      safety: {
        guardian_enabled: config.shark?.safety?.guardian_enabled ?? true,
        firewall_mesh_enabled: config.shark?.safety?.firewall_mesh_enabled ?? true,
        workflow_enforcement: config.shark?.safety?.workflow_enforcement || 'strict'
      }
    };
  }
}
```

#### **Day 3-4: Performance Optimization**
```typescript
// src/performance/optimizer.ts
export class PerformanceOptimizer {
  private cache = new Map<string, any>();
  
  async withCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = await fn();
    this.cache.set(key, result);
    
    // Cache invalidation after 5 minutes
    setTimeout(() => this.cache.delete(key), 5 * 60 * 1000);
    
    return result;
  }
}
```

#### **Day 5: Comprehensive Testing**
```bash
# Run full test suite
npm test

# Performance testing
npm run test:performance

# Integration testing with vanilla OpenCode
npm run test:integration

# Verify zero dependencies on opencode-ultra
npm ls | grep -v "opencode-ultra" | grep -v "@opencode-ai"
```

## 📋 Phase 4: Deployment & Documentation (Week 7)

### **Week 7: Finalization & Release**
**Goal**: Complete testing, documentation, and release preparation

#### **Day 1-2: Build Pipeline**
```json
{
  "scripts": {
    "build": "tsc && bun build src/index.ts --outdir dist --target bun --format esm",
    "test": "bun test",
    "test:integration": "bun test/integration",
    "test:performance": "bun test/performance",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  }
}
```

#### **Day 3-4: Documentation**
```markdown
# Documentation structure
docs/
├── GETTING_STARTED.md          # Quick start for users
├── CONFIGURATION.md            # Configuration options
├── API_REFERENCE.md            # Plugin API documentation
├── TROUBLESHOOTING.md          # Common issues and solutions
└── EXAMPLES/
    ├── micro-engineer-example.md
    └── macro-engineer-example.md
```

#### **Day 5: Release Preparation**
```bash
# Version and publish
npm version 1.0.0
npm publish --access public

# Update OpenCode configs (vanilla, no plugin dependencies)
cp example-config.json ~/.config/opencode/opencode.json

# Verify standalone operation
opencode --plugins | grep shark-agent
```

## 🎯 Success Criteria Checkpoints

### **Week 2 Checkpoint**
- [ ] Plugin loads in vanilla OpenCode 1.2.0+
- [ ] Wizard launches with `Question.ask()`
- [ ] Basic hook scaffolding working
- [ ] Zero opencode-ultra dependencies confirmed

### **Week 4 Checkpoint**
- [ ] Micro Engineer functional with local vLLM
- [ ] Safety stack integrates via hooks
- [ ] UI indicators show brain switching
- [ ] Stage 2 tests passing with API keys

### **Week 6 Checkpoint**
- [ ] All 4 safety layers working
- [ ] Workflow enforcement (brick wall) operational
- [ ] Performance targets met (<50ms safety overhead)
- [ ] Configuration system complete

### **Week 7 Checkpoint**
- [ ] Full test suite passing
- [ ] Documentation complete
- [ ] Ready for production release
- [ ] 100% standalone, vanilla OpenCode compatible

## 🚨 Critical Path Items

### **MUST FIX BEFORE WEEK 3**
1. **WorkflowBlocker ↔ ToolExecutor connection** in Shark Frankenstein base
2. **File renaming** (`integration-test(V2).ts` → `integration-test_v2.ts`)
3. **API key configuration** for Stage 2 tests

### **MUST VALIDATE WEEKLY**
1. **Zero dependencies** on opencode-ultra or other plugins
2. **Vanilla OpenCode compatibility** with each feature
3. **Performance targets** maintained

## 📊 Resource Requirements

### **Development Environment**
- OpenCode 1.2.0+ (vanilla, no plugins)
- Node.js 18+ / Bun 1.0+
- TypeScript 5.8+
- Access to Shark Frankenstein V2 codebase
- API keys for testing (GLM, DeepSeek, Google)

### **Testing Infrastructure**
- Local vLLM setup for Micro Engineer testing
- API access for cloud model testing
- Vanilla OpenCode installation for integration tests

## 🔄 Iteration Cycle

### **Daily**
- Code implementation
- Unit testing
- Documentation updates

### **Weekly**  
- Integration testing with vanilla OpenCode
- Performance benchmarking
- Architecture review

### **Phase Gates**
- Complete all checkpoint criteria before proceeding
- Fix critical blockers immediately
- Validate zero external plugin dependencies continuously

---
**Roadmap Version**: 2.0 (Vanilla OpenCode Focus)  
**Last Updated**: March 30, 2025  
**Status**: Ready for Phase 1 Implementation  
**Next Action**: Begin Week 1 tasks with sisyphus agent