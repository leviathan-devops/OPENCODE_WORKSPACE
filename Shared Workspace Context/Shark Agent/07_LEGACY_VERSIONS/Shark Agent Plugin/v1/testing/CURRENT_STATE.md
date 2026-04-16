# Shark Agent Plugin - Current State & Blockers

## 📊 Project Status (March 30, 2025)

### **Overall Status**: 🟡 **Ready for Implementation**

**Phase**: Pre-implementation analysis complete  
**Next Action**: Begin plugin development with sisyphus agent  
**Priority**: HIGH - Critical integration work needed in base Shark Frankenstein

## ✅ **Completed Work**

### **1. Codebase Analysis** ✅
- **Shark Frankenstein V2 architecture** fully understood
- **OpenCode plugin SDK** (`@opencode-ai/plugin`, `@opencode-ai/sdk`) studied
- **Component mapping** between Shark and OpenCode systems defined

### **2. Architecture Design** ✅
- **100% standalone plugin** design finalized (NO opencode-ultra dependencies)
- **Hook mapping strategy** documented
- **Component adaptation plan** created
- **Configuration schema** defined

### **3. Documentation** ✅
- **Project overview** with critical constraints
- **Technical architecture** for vanilla OpenCode
- **Implementation roadmap** (7-week plan)
- **Current state tracking** (this document)

### **4. Environment Setup** ✅
- **Workspace verified**: `/home/leviathan/OPENCODE_WORKSPACE/`
- **Shark Frankenstein source**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/`
- **OpenCode config**: `/home/leviathan/OPENCODE_WORKSPACE/configs/opencode/opencode/`
- **Plugin SDK available**: `@opencode-ai/plugin`, `@opencode-ai/sdk`

## ⚠️ **Critical Blockers (Shark Frankenstein Base)**

### **🔴 BLOCKER 1: WorkflowBlocker ↔ ToolExecutor Disconnected**
**Location**: `src/workflow/blocker.ts` ↔ `src/tools/executor_v2.ts`  
**Issue**: V2 WorkflowBlocker not connected to V2 ToolExecutor  
**Impact**: Mechanical workflow enforcement (brick wall) won't work  
**Evidence**: 
- `executor_v2.ts` imports `WorkflowBlocker` but passes `null` or doesn't connect
- `firewall-mesh_v2.ts` has `workflowBlocker` parameter but usage unclear
- Workflow enforcement is **CONSTITUTIONAL ANCHOR** - must be connected

**Required Action**: 
```typescript
// In executor_v2.ts constructor:
this.workflowBlocker = config.workflowBlocker; // Currently may be null

// In executeTool method:
if (this.workflowBlocker) {
  const canProceed = this.workflowBlocker.canProceed(currentStep, nextStep, evidence);
  if (!canProceed) throw new WorkflowError("Brick wall: workflow step required");
}
```

### **🔴 BLOCKER 2: File Naming Incompatible with Shell**
**Location**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/testing/integration-test(V2).ts`  
**Issue**: Parentheses in filename break shell scripting and tab completion  
**Impact**: Shell scripts fail, development tools misbehave  
**Pattern**: Should follow existing `*_v2.ts` convention

**Required Action**: 
```bash
# Rename file
mv "integration-test(V2).ts" integration-test_v2.ts

# Update all import statements
# Update build scripts and test runners
```

### **🔴 BLOCKER 3: Stage 2 Test Failures (API Keys Missing)**
**Location**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/testing/`  
**Issue**: 2/3 Stage 2 tests failing due to missing API keys  
**Test Results** (from `stage2-latest.json`):
- Total: 3 tests
- Passed: 1 (Interactive Wizard)
- Failed: 2 (Real API Calls - Gemma, GLM, DeepSeek)
- Skipped: 0

**Missing Environment Variables**:
```
GLM_API_KEY=          # Required for GLM 5 (Macro Engineer)
DEEPSEEK_API_KEY=     # Required for DeepSeek R1 (planning)
GOOGLE_API_KEY=       # Required for Gemma 3 4B (fallback)
```

**Required Action**:
```bash
# Set API keys for testing
export GLM_API_KEY="your_key"
export DEEPSEEK_API_KEY="your_key"  
export GOOGLE_API_KEY="your_key"

# Re-run Stage 2 tests
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
./testing/run-stage2.sh --api-test
```

## 🟡 **Technical Debt & TODO Items**

### **1. Placeholder Audit (Shark Frankenstein)**
**Location**: Various `TODO`, `FIXME`, placeholder comments in Shark codebase  
**Impact**: Production readiness blocked  
**Examples**:
- Model client implementations incomplete
- Error handling placeholders
- Configuration stubs

**Required Action**: Systematic audit and implementation of all TODOs

### **2. Model Async Storage Integration**
**Location**: Shark Frankenstein model coordination  
**Issue**: Async operations and state management needs refinement  
**Impact**: Potential race conditions in brain switching

### **3. Kraken Ultra Integration (Future)**
**Location**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/`  
**Status**: Separate concern, NOT required for initial plugin  
**Note**: This is for future swarm engineering, not initial plugin release

## 🟢 **Ready Components**

### **Shark Frankenstein V2 Components (Extraction Ready)**
```
✅ src/brain/coordinator-micro_v2.ts      # Micro engineer coordinator
✅ src/brain/coordinator-macro_v2.ts      # Macro engineer coordinator  
✅ src/brain/coordinator-base_v2.ts       # Base coordinator
✅ src/tools/executor_v2.ts               # ToolExecutor (needs WorkflowBlocker connection)
✅ src/tools/firewall-mesh_v2.ts          # Parallel firewall mesh
✅ src/tools/stagnation-detector_v2.ts    # Stagnation detection
✅ src/workflow/blocker.ts                # Workflow enforcement (needs connection)
✅ src/guardian/index.ts                  # Filesystem protection
✅ src/brain/deepseek.ts                  # DeepSeek API client
✅ src/brain/glm.ts                       # GLM API client  
✅ src/brain/gemma.ts                     # Gemma API client
✅ src/brain/vllm.ts                      # vLLM local client
```

### **OpenCode Plugin Infrastructure (Ready)**
```
✅ Plugin SDK: @opencode-ai/plugin, @opencode-ai/sdk
✅ Hook system: chat.message, tool.execute.before, chat.params, etc.
✅ Question tool: For wizard implementation (identical to plan mode)
✅ Configuration system: For plugin settings
```

## 📈 **Test Results Summary**

### **Stage 1: Docker Sandbox (Completed)**
- **Status**: ✅ PASSED
- **Environment**: Isolated Docker container
- **Tests**: Basic functionality, error handling, security
- **Result**: Core architecture validated

### **Stage 2: Local Device (CURRENT)**
- **Status**: ❌ PARTIAL FAILURE (2/3 tests failing)
- **Environment**: Real local device with Guardian protection
- **Tests**: 
  - ✅ Interactive Wizard (PASSED)
  - ❌ Real API Calls (FAILED - missing API keys)
  - ❌ Performance Tests (FAILED - depends on API)
- **Guardian Mode**: Balanced (protects system files)

### **Stage 3: Production Readiness (Pending)**
- **Status**: 🟡 NOT STARTED
- **Requirements**: Stage 2 must pass first
- **Tests**: End-to-end workflow, stress testing, security validation

## 🎯 **Immediate Next Actions**

### **Priority 1: Fix Shark Frankenstein Blockers**
1. **Connect WorkflowBlocker to ToolExecutor** (constitutional anchor)
2. **Rename `integration-test(V2).ts` to `integration-test_v2.ts`**
3. **Set API keys and validate Stage 2 tests**

### **Priority 2: Create Plugin Project**
1. **Initialize plugin project** with zero opencode-ultra dependencies
2. **Extract Shark Frankenstein V2 components** 
3. **Implement core OpenCode hooks** (wizard, safety, model switching)

### **Priority 3: Integration Testing**
1. **Test plugin with vanilla OpenCode 1.2.0+**
2. **Validate safety stack integration**
3. **Verify brain switching UI indicators**

## 🔍 **Verification Checklist**

### **Before Plugin Development**
- [ ] WorkflowBlocker connected to ToolExecutor in Shark base
- [ ] File naming issues resolved (parentheses removed)
- [ ] Stage 2 tests passing with API keys
- [ ] All critical TODOs addressed in Shark codebase

### **Plugin Readiness**
- [ ] 100% standalone (no opencode-ultra or other plugin dependencies)
- [ ] Uses only `@opencode-ai/plugin` and `@opencode-ai/sdk`
- [ ] Wizard uses `Question.ask()` (vanilla OpenCode)
- [ ] Safety stack integrates via standard hooks
- [ ] Configuration schema validated

## 📁 **File References**

### **Critical Files (Shark Frankenstein)**
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/tools/executor_v2.ts`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/workflow/blocker.ts`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/tools/firewall-mesh_v2.ts`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/testing/integration-test(V2).ts`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/testing/reports/stage2-latest.json`

### **Test Scripts**
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/testing/run-stage2.sh`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/testing/stage2-local/test-real-api.sh`

### **Documentation**
- `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin/`
- All `.md` files in this directory

---
**Last Updated**: March 30, 2025  
**Next Review**: After blocker resolution  
**Responsible**: Sisyphus agent for implementation