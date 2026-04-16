# Shark Agent Plugin - Next Steps for Sisyphus Agent

## 🚀 **Immediate Action Items**

### **PRIORITY 1: Fix Shark Frankenstein Blockers**
**Time Estimate**: 2-3 hours  
**Critical Path**: Must complete before plugin development

#### **Task 1.1: Connect WorkflowBlocker to ToolExecutor**
**Location**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/`  
**Files**: 
- `src/tools/executor_v2.ts` (constitutional anchor)
- `src/workflow/blocker.ts` (brick wall enforcement)
- `src/tools/firewall-mesh_v2.ts` (integrates both)

**Action**:
1. Examine `executor_v2.ts` constructor and `workflowBlocker` usage
2. Check if `workflowBlocker` is properly initialized or passed as `null`
3. Ensure `firewall-mesh_v2.ts` properly uses `workflowBlocker` parameter
4. Connect the components so workflow enforcement actually blocks tool execution
5. Test that PLAN→BUILD→TEST→VERIFY→SHIP brick wall works

**Verification**:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
npm test -- --grep "workflow"
# Should show workflow enforcement tests passing
```

#### **Task 1.2: Rename Shell-Incompatible Files**
**Location**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/testing/`  
**File**: `integration-test(V2).ts` → `integration-test_v2.ts`

**Action**:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
mv "testing/integration-test(V2).ts" testing/integration-test_v2.ts

# Update all import references
grep -r "integration-test(V2)" . --include="*.ts" --include="*.js"
# Update each found reference

# Update package.json scripts if referenced
# Update test runners and build scripts
```

**Verification**:
```bash
# File should no longer exist with parentheses
ls -la testing/integration-test*.ts
# Should show: integration-test_v2.ts

# Shell tab completion should work
cd testing/
# Type: integration-test then press Tab
# Should complete to integration-test_v2.ts
```

#### **Task 1.3: Configure API Keys for Stage 2 Tests**
**Location**: Environment variables for testing  
**Current Status**: 2/3 Stage 2 tests failing due to missing keys

**Action**:
```bash
# Set API keys (use actual keys or test values)
export GLM_API_KEY="test_or_actual_key"
export DEEPSEEK_API_KEY="test_or_actual_key"
export GOOGLE_API_KEY="test_or_actual_key"

# Run Stage 2 tests
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
./testing/run-stage2.sh --api-test

# Check results
cat testing/reports/stage2-latest.json | jq '.summary'
# Should show: "passed": 3, "failed": 0
```

**Alternative**: If actual API keys unavailable, modify test-real-api.sh to mock API responses for validation.

### **PRIORITY 2: Create Standalone Plugin Project**
**Time Estimate**: 1-2 hours  
**Dependency**: After blocker fixes (or in parallel if quick)

#### **Task 2.1: Initialize Plugin Project**
**Location**: New directory in workspace  
**Constraint**: **ZERO** opencode-ultra dependencies

**Action**:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE
mkdir shark-agent-plugin
cd shark-agent-plugin

# Initialize with ONLY vanilla OpenCode dependencies
npm init -y
npm install @opencode-ai/plugin @opencode-ai/sdk zod
npm install -D typescript @types/node @types/bun

# Create basic structure
mkdir -p src/{wizard,coordinator,safety,hooks,ui,utils}
mkdir -p test/{unit,integration,performance}

# Copy SDK reference (NOT opencode-ultra)
mkdir -p reference/sdk
cp -r ../configs/opencode/opencode/node_modules/@opencode-ai/plugin/* reference/sdk/
cp -r ../configs/opencode/opencode/node_modules/@opencode-ai/sdk/* reference/sdk/
```

#### **Task 2.2: Create Core Configuration Files**
**Files to create**:
1. `tsconfig.json` - TypeScript configuration
2. `package.json` scripts - build, test, lint
3. `.gitignore` - standard Node.js/TypeScript
4. `README.md` - project-specific (different from context docs)

**Action**:
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "types": ["bun-types", "node"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### **PRIORITY 3: Extract Shark Frankenstein V2 Components**
**Time Estimate**: 2-3 hours  
**Dependency**: After plugin project setup

#### **Task 3.1: Extract V2 Components**
**Source**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/`  
**Destination**: `shark-agent-plugin/src/extracted/`

**Action**:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/shark-agent-plugin

# Extract V2 components (prioritize *_v2.ts files)
cp -r ../projects/shark-frankenstein/src/brain src/extracted/brain
cp -r ../projects/shark-frankenstein/src/tools src/extracted/tools
cp -r ../projects/shark-frankenstein/src/guardian src/extracted/guardian
cp -r ../projects/shark-frankenstein/src/workflow src/extracted/workflow

# Clean up: remove non-V2 files if they cause conflicts
# Focus on: coordinator-*_v2.ts, executor_v2.ts, firewall-mesh_v2.ts, etc.
```

#### **Task 3.2: Create Adapter Interfaces**
**Purpose**: Define interfaces between Shark components and OpenCode hooks

**Action**:
```typescript
// src/types/adapters.ts
export interface SharkToOpencodeAdapter {
  // Convert Shark tool call to OpenCode tool execution
  adaptToolCall(toolCall: SharkToolCall): OpencodeToolCall;
  
  // Convert Shark safety result to OpenCode hook response
  adaptSafetyResult(result: SharkSafetyResult): OpencodeHookResult;
  
  // Convert Shark brain state to OpenCode model params
  adaptBrainState(state: BrainState): ModelParams;
}

// src/coordinator/base-adapter.ts
export abstract class BaseCoordinatorAdapter {
  abstract execute(task: string): Promise<CoordinationResult>;
  abstract switchBrain(from: BrainType, to: BrainType): Promise<void>;
  abstract updateUI(sessionID: string, indicator: UIIndicator): Promise<void>;
}
```

### **PRIORITY 4: Implement Core OpenCode Hooks**
**Time Estimate**: 3-4 hours  
**Dependency**: After component extraction

#### **Task 4.1: Plugin Entry Point**
**File**: `src/index.ts` - Main plugin implementation

**Action**:
```typescript
// Implement from ARCHITECTURE.md
import type { PluginInput, Hooks } from '@opencode-ai/plugin';
import { SharkModeWizard } from './wizard';
import { SharkCoordinator } from './coordinator';
import { SafetyStack } from './safety';

export default async function sharkPlugin(input: PluginInput): Promise<Hooks> {
  // Initialize components
  const wizard = new SharkModeWizard(input);
  const coordinator = await SharkCoordinator.create(input);
  const safety = new SafetyStack(input);
  
  return {
    // Wizard launch on new sessions
    async 'chat.message'(input, output) {
      if (await wizard.shouldLaunch(input.sessionID)) {
        const mode = await wizard.launch(input.sessionID);
        await coordinator.initialize(mode, input.sessionID);
      }
    },
    
    // Safety enforcement
    async 'tool.execute.before'(input, output) {
      const result = await safety.checkTool(input.tool, output.args);
      if (!result.allowed) {
        throw new Error(`Safety blocked: ${result.reason}`);
      }
    },
    
    // Model switching
    async 'chat.params'(input, output) {
      return coordinator.adjustModelParams(input, output);
    },
    
    // Custom toggle tool
    tool: {
      'shark_toggle': {
        description: 'Toggle Shark Mode on/off',
        execute: async () => {
          return coordinator.toggle();
        }
      }
    }
  };
}
```

#### **Task 4.2: Wizard Implementation**
**File**: `src/wizard/index.ts` - Uses `Question.ask()`

**Action**:
```typescript
// Implement from ARCHITECTURE.md
import { Question } from '@opencode-ai/sdk';

export class SharkModeWizard {
  async launch(sessionID: string): Promise<'micro' | 'macro'> {
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
    await this.configureMode(mode, sessionID);
    return mode;
  }
}
```

## 🎯 **Success Verification Steps**

### **After Priority 1 (Blocker Fixes)**
```bash
# 1. WorkflowBlocker connected
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
grep -n "workflowBlocker" src/tools/executor_v2.ts
# Should show actual usage, not just null assignment

# 2. File renamed
ls -la testing/integration-test*.ts
# Should show integration-test_v2.ts, NOT integration-test(V2).ts

# 3. Stage 2 tests passing
cat testing/reports/stage2-latest.json | jq '.summary.passed'
# Should be 3
```

### **After Priority 2 (Plugin Project)**
```bash
# 1. Verify zero opencode-ultra dependencies
cd /home/leviathan/OPENCODE_WORKSPACE/shark-agent-plugin
npm list | grep opencode-ultra
# Should show NO results

# 2. Verify vanilla OpenCode dependencies
npm list | grep "@opencode-ai"
# Should show: @opencode-ai/plugin, @opencode-ai/sdk

# 3. Build succeeds
npm run build
# Should create dist/index.js
```

### **After Priority 3 (Component Extraction)**
```bash
# 1. V2 components extracted
ls -la src/extracted/brain/*_v2.ts
# Should show: coordinator-micro_v2.ts, coordinator-macro_v2.ts, etc.

# 2. Adapter interfaces defined
ls -la src/types/*.ts
# Should show: adapters.ts, coordinator-types.ts, safety-types.ts
```

### **After Priority 4 (Core Hooks)**
```bash
# 1. Plugin loads in OpenCode
opencode --test-plugin shark-agent
# Should load without errors

# 2. TypeScript compiles
npm run typecheck
# Should show no errors

# 3. Basic tests pass
npm test
# Should run unit tests successfully
```

## 📁 **File Structure After Completion**
```
/home/leviathan/OPENCODE_WORKSPACE/shark-agent-plugin/
├── src/
│   ├── index.ts                          # Plugin entry (vanilla hooks)
│   ├── wizard/
│   │   └── index.ts                      # Question.ask() wizard
│   ├── coordinator/
│   │   ├── micro-coordinator.ts          # Micro engineer adapter
│   │   ├── macro-coordinator.ts          # Macro engineer adapter
│   │   └── base-adapter.ts               # Base adapter interface
│   ├── safety/
│   │   ├── guardian-adapter.ts           # Filesystem protection
│   │   ├── firewall-mesh-adapter.ts      # Parallel firewalls
│   │   └── workflow-enforcer.ts          # Brick wall enforcement
│   ├── extracted/                        # Shark Frankenstein V2 components
│   │   ├── brain/                        # coordinators, model clients
│   │   ├── tools/                        # executor, firewalls, detectors
│   │   ├── guardian/                     # filesystem protection
│   │   └── workflow/                     # workflow enforcement
│   ├── types/
│   │   ├── adapters.ts                   # Interface definitions
│   │   └── coordinator-types.ts          # Type definitions
│   └── utils/
│       └── model-switcher.ts             # Model switching utilities
├── test/
│   ├── unit/
│   │   └── wizard.test.ts                # Unit tests
│   ├── integration/
│   │   └── plugin.test.ts                # Integration tests
│   └── performance/
│       └── safety.test.ts                # Performance tests
├── package.json                          # ZERO opencode-ultra dependencies
├── tsconfig.json                         # TypeScript config
└── README.md                             # Project documentation
```

## ⚠️ **Risk Mitigation**

### **Risk 1: opencode-ultra dependency creep**
**Mitigation**: 
- Daily check: `npm list | grep opencode-ultra` must return empty
- CI check: Fail build if opencode-ultra appears in package.json
- Documentation: All examples show vanilla OpenCode only

### **Risk 2: Shark Frankenstein compatibility breaks**
**Mitigation**:
- Extract V2 components as read-only reference
- Create adapter layer for isolation
- Test with actual Shark Frankenstein Stage 2 tests
- Maintain compatibility matrix

### **Risk 3: Performance targets missed**
**Mitigation**:
- Daily performance benchmarks
- Safety stack overhead monitoring (<50ms target)
- Brain switching latency tracking (<100ms target)
- Optimization sprint in Week 6

## 📋 **Daily Progress Tracking**

### **Day 1 Goals**
- [ ] Shark Frankenstein blockers fixed (Priority 1)
- [ ] Plugin project initialized (Priority 2)
- [ ] Basic structure with zero opencode-ultra dependencies

### **Day 2 Goals**
- [ ] V2 components extracted (Priority 3)
- [ ] Adapter interfaces defined
- [ ] Core hook scaffolding (Priority 4 started)

### **Day 3 Goals**
- [ ] Plugin entry point complete
- [ ] Wizard implementation with Question.ask()
- [ ] Basic safety hook integration

### **Day 4 Goals**
- [ ] Micro coordinator adapter
- [ ] Guardian safety integration
- [ ] First integration test with vanilla OpenCode

## 🆘 **Troubleshooting**

### **If OpenCode plugin fails to load**:
1. Check dependencies: `npm list | grep -E "opencode-ultra|@opencode-ai"`
2. Verify hook signatures match `@opencode-ai/plugin` types
3. Test with minimal plugin: Just `chat.message` hook
4. Check OpenCode version: Must be 1.2.0+

### **If Shark components don't adapt**:
1. Check V2 vs V1 files: Use only `*_v2.ts` files
2. Verify WorkflowBlocker connection is fixed
3. Create simpler adapter interface first
4. Mock components for initial integration

### **If tests fail**:
1. Run Stage 2 tests in Shark Frankenstein first
2. Verify API keys are set
3. Check file renaming completed
4. Run unit tests before integration tests

---
**Next Steps Assigned To**: Sisyphus Agent  
**Start Time**: Immediately  
**Expected Completion**: 3-4 days for initial implementation  
**Success Criteria**: Plugin loads in vanilla OpenCode, wizard works, zero opencode-ultra dependencies