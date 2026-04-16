# Shark Agent Plugin - Build Team Implementation Plan

## Project Overview
Build a toggleable Opencode plugin that integrates Shark Frankenstein's dual-brain architecture with mechanical safety enforcement, featuring a mode selector wizard and visible brain switching in the Opencode chat UI.

## Team Structure

### Core Team (3 Engineers)
1. **Plugin Architect** (Senior): Opencode plugin system expertise
2. **Shark Integration Lead** (Senior): Shark Frankenstein codebase expertise  
3. **UI/UX Engineer** (Mid): Opencode UI integration and wizard design

### Support Roles
- **QA Engineer**: Testing and validation
- **DevOps Engineer**: Build pipeline and deployment
- **Technical Writer**: Documentation

## Phase 1: Foundation (Week 1-2)

### Week 1: Setup and Analysis
**Lead: Plugin Architect**

#### Day 1-2: Environment Setup
```bash
# Create plugin project structure
mkdir shark-agent-plugin
cd shark-agent-plugin
npm init -y
npm install @opencode-ai/plugin @opencode-ai/sdk zod
npm install -D typescript @types/node

# Analyze OpenCode plugin SDK (vanilla, no plugin dependencies)
cp -r /home/leviathan/OPENCODE_WORKSPACE/configs/opencode/opencode/node_modules/@opencode-ai/plugin ./reference/sdk
cp -r /home/leviathan/OPENCODE_WORKSPACE/configs/opencode/opencode/node_modules/@opencode-ai/sdk ./reference/sdk
```

#### Day 3-4: Shark Codebase Analysis
```bash
# Extract core components from Shark Frankenstein
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/brain ./src/extracted/brain
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/tools ./src/extracted/tools
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/guardian ./src/extracted/guardian
```

#### Day 5: Architecture Design Review
- Review SHARK_AGENT_PLUGIN_ARCHITECTURE.md
- Create detailed component interface specifications
- Define hook mapping strategy

### Week 2: Core Plugin Structure
**Lead: Shark Integration Lead**

#### Day 1-2: Plugin Entry Point
```typescript
// src/index.ts - Main plugin entry
import type { PluginInput, Hooks } from '@opencode-ai/plugin';
import { SharkModeWizard } from './wizard';
import { SharkCoordinator } from './coordinator';

export default async function sharkPlugin(input: PluginInput): Promise<Hooks> {
  const wizard = new SharkModeWizard(input);
  const coordinator = new SharkCoordinator(input);
  
  return {
    // Session initialization
    async 'chat.message'(input, output) {
      if (await wizard.shouldLaunch(input.sessionID)) {
        await wizard.launch(input.sessionID);
      }
    },
    
    // Tool safety enforcement
    async 'tool.execute.before'(input, output) {
      return coordinator.checkToolSafety(input.tool, input.args);
    },
    
    // Model switching
    async 'chat.params'(input, output) {
      return coordinator.adjustModelParams(input, output);
    },
    
    // Custom tools
    tool: {
      'shark_toggle': sharkToggleTool,
      'shark_mode_select': sharkModeSelectTool
    }
  };
}
```

#### Day 3-4: Wizard Implementation
```typescript
// src/wizard/index.ts
import { Question } from '@opencode-ai/sdk';

export class SharkModeWizard {
  constructor(private input: PluginInput) {}
  
  async shouldLaunch(sessionID: string): Promise<boolean> {
    // Check if this is a new session without shark configuration
    return !this.hasSharkConfig(sessionID);
  }
  
  async launch(sessionID: string): Promise<'micro' | 'macro'> {
    const answers = await Question.ask({
      sessionID,
      questions: [{
        question: "🦈 SHARK AGENT MODE SELECTOR\\n\\nSelect your Shark Agent mode:",
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
    await this.configureMode(mode, sessionID);
    return mode;
  }
}
```

#### Day 5: Initial Integration Test
```bash
# Build and test basic plugin
npm run build
cp dist/index.js ~/.config/opencode/plugins/shark-agent.js

# Test in Opencode
opencode --test-plugin shark-agent
```

## Phase 2: Dual-Brain Integration (Week 3-4)

### Week 3: Micro Engineer Integration
**Lead: Shark Integration Lead**

#### Day 1-2: Extract and Adapt Shark Coordinators
```typescript
// src/coordinator/micro-coordinator.ts
import { MicroCoordinator } from '../extracted/brain/coordinator-micro_v2';
import { OpencodeAdapter } from './opencode-adapter';

export class MicroCoordinatorAdapter {
  private coordinator: MicroCoordinator;
  private adapter: OpencodeAdapter;
  
  constructor(config: MicroConfig) {
    // Adapt Shark coordinator to Opencode environment
    this.coordinator = new MicroCoordinator({
      ...config,
      workspacePath: this.adapter.getWorkspacePath()
    });
  }
  
  async execute(task: string): Promise<CoordinationResult> {
    // Use Shark's dual-brain logic
    const result = await this.coordinator.execute(task);
    
    // Update Opencode UI with brain switch
    await this.adapter.switchModelIndicator(
      'planning',
      '0-deepseek/deepseek-chat'
    );
    
    return result;
  }
}
```

#### Day 3-4: Safety Stack Integration
```typescript
// src/safety/guardian-adapter.ts
import { Guardian } from '../extracted/guardian';

export class GuardianAdapter {
  private guardian: Guardian;
  
  async initialize(workspacePath: string): Promise<void> {
    this.guardian = new Guardian({
      workspacePath,
      protectionLevel: 'BALANCED'
    });
  }
  
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

#### Day 5: Integration Testing
```bash
# Test Micro Engineer flow
npm test -- --grep "Micro Engineer"

# Test safety stack
npm test -- --grep "Guardian"
```

### Week 4: Macro Engineer & UI Integration
**Lead: UI/UX Engineer**

#### Day 1-2: Macro Coordinator Integration
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

#### Day 3-4: UI Integration
```typescript
// src/ui/model-indicator.ts
export class ModelIndicator {
  async update(sessionID: string, brain: string, model: string): Promise<void> {
    // Update Opencode chat UI to show current brain/model
    await this.injectCSS(`
      .shark-brain-indicator {
        position: absolute;
        top: 5px;
        right: 10px;
        background: #1a1a1a;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        color: #00ff88;
      }
    `);
    
    await this.updateIndicatorText(`${brain} • ${model}`);
  }
}
```

#### Day 5: Toggle Interface
```typescript
// src/ui/toggle-integration.ts
export class SharkToggle {
  async integrateWithOpencodeUI(): Promise<void> {
    // Add Shark toggle to Opencode agent harness
    await this.injectToggleHTML(`
      <div class="agent-toggle shark-toggle">
        <input type="checkbox" id="shark-mode">
        <label for="shark-mode">🦈 Shark Mode</label>
      </div>
    `);
    
    // Connect toggle to plugin state
    document.getElementById('shark-mode')?.addEventListener('change', (e) => {
      this.onToggleChange((e.target as HTMLInputElement).checked);
    });
  }
}
```

## Phase 3: Safety & Workflow (Week 5-6)

### Week 5: Complete Safety Stack
**Lead: Plugin Architect**

#### Day 1-2: FirewallMesh Integration
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

#### Day 3-4: Workflow Enforcement
```typescript
// src/safety/workflow-enforcer.ts
import { WorkflowBlocker } from '../extracted/workflow/blocker';

export class WorkflowEnforcer {
  private blocker: WorkflowBlocker;
  private currentStep: WorkflowStep = 'PLAN';
  
  async enforceStep(step: WorkflowStep, evidence: Evidence): Promise<void> {
    if (!this.blocker.canProceed(this.currentStep, step, evidence)) {
      throw new WorkflowError(`Cannot proceed from ${this.currentStep} to ${step}`);
    }
    
    this.currentStep = step;
    await this.logStepTransition(step, evidence);
  }
}
```

#### Day 5: Stagnation Detection
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

### Week 6: Configuration & Optimization
**Lead: Shark Integration Lead**

#### Day 1-2: Configuration System
```typescript
// src/config/index.ts
export class SharkConfig {
  async load(): Promise<SharkPluginConfig> {
    // Load from Opencode config
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

#### Day 3-4: Performance Optimization
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

#### Day 5: Comprehensive Testing
```bash
# Run full test suite
npm test

# Performance testing
npm run test:performance

# Integration testing with Opencode
npm run test:integration
```

## Phase 4: Deployment & Documentation (Week 7)

### Week 7: Finalization
**Lead: Plugin Architect**

#### Day 1-2: Build Pipeline
```bash
# package.json scripts
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

#### Day 3-4: Documentation
```markdown
# Documentation structure
docs/
├── GETTING_STARTED.md
├── CONFIGURATION.md
├── API_REFERENCE.md
├── TROUBLESHOOTING.md
└── EXAMPLES/
    ├── micro-engineer-example.md
    └── macro-engineer-example.md
```

#### Day 5: Release Preparation
```bash
# Version and publish
npm version 1.0.0
npm publish --access public

# Update Opencode configs
cp example-config.json ~/.config/opencode/opencode.json
```

## Testing Strategy

### Unit Tests (Jest)
```typescript
// test/unit/wizard.test.ts
describe('SharkModeWizard', () => {
  test('should launch wizard for new sessions', async () => {
    const wizard = new SharkModeWizard(mockInput);
    const shouldLaunch = await wizard.shouldLaunch('new-session');
    expect(shouldLaunch).toBe(true);
  });
});
```

### Integration Tests
```typescript
// test/integration/plugin.test.ts
describe('Shark Plugin Integration', () => {
  test('should load plugin and register hooks', async () => {
    const plugin = await import('../src/index.ts');
    const hooks = await plugin.default(mockInput);
    expect(hooks['chat.message']).toBeDefined();
  });
});
```

### Performance Tests
```typescript
// test/performance/safety.test.ts
describe('Safety Stack Performance', () => {
  test('firewall mesh should complete in <50ms', async () => {
    const start = performance.now();
    await firewallMesh.checkAllFirewalls(mockToolCall);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
```

## Success Criteria

### Technical Success
- [ ] Plugin loads without errors in Opencode
- [ ] Wizard launches on new sessions
- [ ] Brain switching works with UI indicators
- [ ] Safety stack prevents dangerous operations
- [ ] Performance overhead <100ms per tool call

### User Experience Success
- [ ] Wizard completes in <30 seconds
- [ ] Mode selection is clear and intuitive
- [ ] Brain switches are visible in UI
- [ ] Toggle interface works seamlessly
- [ ] Error messages are helpful

### Quality Success
- [ ] 90%+ test coverage
- [ ] All TypeScript errors resolved
- [ ] Documentation complete
- [ ] Performance benchmarks met

## Risk Management

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Opencode API changes | Medium | High | Abstraction layer, version pinning |
| Model availability | Low | Medium | Fallback systems, graceful degradation |
| Performance overhead | High | Medium | Caching, optimization, benchmarking |
| Security vulnerabilities | Low | High | Code review, security testing |

### Project Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep | Medium | Medium | Strict phase gates, change control |
| Team dependencies | High | Medium | Cross-training, documentation |
| Integration complexity | High | High | Incremental integration, testing |

## Deliverables Timeline

| Week | Deliverables |
|------|-------------|
| 1 | Project setup, architecture review |
| 2 | Basic plugin with wizard |
| 3 | Micro engineer integration |
| 4 | Macro engineer & UI integration |
| 5 | Complete safety stack |
| 6 | Configuration & optimization |
| 7 | Testing, documentation, release |

## Post-Release Plan

### Week 8: Monitoring & Support
- Monitor plugin usage and errors
- Collect user feedback
- Address critical bugs

### Week 9-10: Enhancement Phase
- Add additional safety features
- Improve UI/UX based on feedback
- Optimize performance further

### Ongoing: Maintenance
- Monthly updates for Opencode compatibility
- Security patches as needed
- Feature enhancements based on user requests

## Conclusion

This implementation plan provides a structured 7-week roadmap to deliver a production-ready Shark Agent Plugin for Opencode. By following this phased approach with clear deliverables and success criteria, the build team can systematically integrate Shark Frankenstein's advanced dual-brain architecture with Opencode's plugin system, delivering a unique value proposition: autonomous AI coding assistance with mechanical safety enforcement and visible brain switching.