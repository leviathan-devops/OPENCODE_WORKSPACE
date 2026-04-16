# 🦈 SHARK AGENT + OPENCODE MASTER BUILD PROMPT

## 🎯 **MISSION FOR GLM ENGINEERS**
Integrate Shark Agent's mechanical enforcement systems into Opencode's TypeScript codebase as an **operating system level enhancement**, preserving 100% of Opencode's UI/UX while adding hardcoded workflow enforcement, file protection, and dual-brain architecture.

**CRITICAL CONSTRAINT**: DO NOT replace or remove ANY Opencode code—only enhance or add to existing architecture.

---

## 📊 **CURRENT STATUS & DISCOVERIES**

### ✅ **Key Discoveries (Mar 24 2026)**
1. **Opencode is TypeScript** (55.3% TS, 40.7% MDX) - not Go as previously assumed
2. **Shark Frankenstein CLI exists** (~50% of Qwen Code level) with identified theatrical code issues
3. **Correct GitHub URLs** identified for all context documents
4. **Shark-agent skill file exists** (`~/.config/opencode/skills/shark-agent/SKILL.md`) showing prior integration attempt
5. **User has working vLLM setup** for testing Micro Engineer execution
6. **GLM 4.7 coding plan endpoint confirmed working** with tool use capabilities
7. **Integration approach clarified**: Surgical addition to Opencode codebase, not replacement
8. **Auto-switch demonstration captured**: Real-time example of dual-brain switching documented

### ✅ **Opencode Architecture Analyzed**
**Key integration points**:
- `packages/opencode/src/agent/agent.ts` - Plan/build agent definitions
- `packages/opencode/src/session/processor.ts` - Message/tool processing
- `packages/opencode/src/tool/registry.ts` - Tool execution system
- `packages/opencode/src/permission/index.ts` - Permission system
- `packages/opencode/src/session/status.ts` - Session completion logic

### ✅ **Shark Systems Examined (All TypeScript)**
- **Guardian** (`src/guardian/index.ts` ~800 lines) - File protection with zone classification
- **Workflow State Machine** (`src/workflow/state-machine.ts` ~862 lines) - 5-step workflow enforcement  
- **AutoDebug** (`src/debug/autodebug.ts` ~530 lines) - Pattern-based error fixing
- **DualBrainCoordinator** (`src/brain/coordinator.ts`) - Micro/Macro mode switching
- **ToolExecutor** (`src/tools/executor.ts`) - Protected tool execution

### ✅ **6-Step Workflow Innovation (V2)**
V2 adds "Crash Test" step after Ship for adversarial user-endpoint testing:
1. PLAN → 2. BUILD → 3. TEST → 4. VERIFY → 5. SHIP → **6. CRASH TEST**

### ✅ **AUTO-SWITCH DEMONSTRATION CAPTURED**
**Real-time example of dual-brain auto-switching** (Mar 24 2026):
- **Trigger**: User observation of mode transition
- **From**: Plan mode (analysis, DeepSeek Reason) 
- **To**: Build mode (execution, DeepSeek Chat)
- **Criteria**: Task changed from "analyze what we did" → "document how switch happened"
- **Pattern**: User intent shift + tool requirement change
- **Documentation**: `SHARK_AUTO_SWITCH_DEMONSTRATION.md` created with exact implementation blueprint

---

## 🏗️ **INTEGRATION STRATEGY**

### **Core Principles**
1. **Build on top of Opencode's plan/build toggle system** - enhance with autonomous agent switching
2. **Integrate at deepest CLI level** - Guardian, Workflow, AutoDebug hardcoded into CLI core
3. **Use sandboxed development** - fork Opencode, protect original with Guardian
4. **Enable parallel development** - flexible team size based on component complexity
5. **MVP = Mode switching + Guardian + 5-step workflow** → V2 = Add Crash Test (Step 6)

### **Technical Specifications**
- **Micro Engineer**: vLLM (primary) and Gemma (fallback) as equal execution engine options
- **Macro Engineer**: GLM 4.7 on coding plan endpoint (`api.z.ai/api/coding/paas/v4/`) with DeepSeek advisory
- **Compiler firewall**: Agent outputs must pass through CLI validation layer that enforces full workflow completion
- **3-failure reset**: Three consecutive failures at any workflow step triggers reset to Plan with full context capture
- **Autonomous mode switching**: Agents automatically switch between plan/build modes based on workflow context (DEMONSTRATED LIVE)
- **Auto-switch criteria**: Task analysis, user intent, tool requirements, complexity scoring
- **Integration method**: Plugin/middleware system hardcoded into CLI core (operating system level enhancement)
- **Sandbox approach**: Fork Opencode repo for parallel development
- **Auto-switch behavior**: Always-on enhancement working alongside manual toggle

---

## 📁 **REFERENCE: FIXED SHARK CLI (`FIXED-cli.ts`)**

A fully integrated version of Shark CLI exists at:
`/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/GLM Engineer Shared Workspace/FIXED-cli.ts`

**Key Integration Patterns**:
1. **Guardian initialization** - `createProductionGuardian(workspacePath)`
2. **Workflow initialization** - `new WorkflowMachine(workspacePath)`
3. **AutoDebug initialization** - `new AutoDebugEngine()`
4. **Guardian wrapping** - All file operations checked via `checkGuardian()`
5. **Workflow enforcement** - `setOriginalPrompt()` and step tracking
6. **AutoDebug integration** - Error analysis and auto-fix attempts

**Use this file as the model for Opencode integration.**

---

## 🎯 **INTEGRATION POINTS (OPENCODE → SHARK)**

### **1. MODE SWITCHING SYSTEM (Primary Target)**
**Location**: Opencode's plan/build mode toggle mechanism
**Files**: `packages/opencode/src/agent/agent.ts`, `packages/opencode/src/session/processor.ts`

**CRITICAL CLARIFICATION**: DO NOT REPLACE manual toggle. Add **autonomous dual-brain switching** as an ALWAYS-ON ENHANCEMENT that works alongside manual toggle.

**Integration Tasks**:
1. Map Opencode's plan/build mode to Shark's Micro/Macro modes
2. **Add AutoSwitchDetector layer** that monitors sessions for mode transition opportunities
3. **Micro Engineer Mode** = Automatic detection when to switch from Plan (DeepSeek analysis) → Build (vLLM/Gemma execution)
4. **Macro Engineer Mode** = GLM handles planning+building internally, DeepSeek as advisory
5. Leverage Opencode's existing "cannot build in plan mode" enforcement as foundation for Guardian/Workflow systems
6. **Auto-switch criteria**: Task analysis, user intent, tool requirements, complexity scoring (DEMONSTRATED LIVE)

**Reference**: `SHARK_AUTO_SWITCH_DEMONSTRATION.md` - Real-time example captured

### **2. COMMAND EXECUTION PIPELINE (Core Enforcement)**
**Location**: Where Opencode processes/executes agent-generated commands
**Files**: `packages/opencode/src/session/processor.ts`, `packages/opencode/src/tool/registry.ts`

**Integration Tasks**:
1. **Guardian Angel**: Wrap ALL file operations (read/write/delete) with permission checks
2. **WorkflowMachine**: Inject 5-step validation (PLAN→BUILD→TEST→VERIFY→SHIP) at command boundaries
3. **ToolExecutor**: Replace native tool execution with Shark's Guardian-protected version
4. **AutoDebugEngine**: Integrate into error handling - provide mechanical fixes before allowing retry

### **3. ERROR HANDLING & FEEDBACK LOOP (Anti-Hallucination)**
**Location**: How Opencode handles/reports errors from agent commands
**Files**: `packages/opencode/src/session/processor.ts`, `packages/opencode/src/session/status.ts`

**Integration Tasks**:
1. Replace error display with **mechanical violation detection**
2. When agent attempts to bypass workflow (e.g., faking test results):
   - CLI detects violation via workflow state
   - Outputs: `VIOLATION DETECTED: [specific workflow step skipped]`
   - Provides: `AUTO-DEBUG SOLUTION: [mechanical fix from knowledge base]`
   - Forces: `NEXT STEPS: [clear mechanical instructions to complete correct step]`
3. Prevents theatrical simulation by requiring actual workflow completion evidence

### **4. COMPLETION/SHIP VALIDATION (Final Gatekeeper)**
**Location**: How Opencode determines when a task is "complete"
**Files**: `packages/opencode/src/session/processor.ts`, `packages/opencode/src/session/status.ts`

**Integration Tasks**:
1. Implement **mechanical compile-from-scratch validation** at ship stage
2. Before allowing user output:
   - CLI checks workflow state = SHIP stage
   - CLI mechanically compiles entire codebase from scratch (no agent context)
   - Verifies build workflow completion through artifact analysis (0 AI inference)
   - If validation fails: Forces restart from PLAN stage with added context
3. This is the "satisfaction firewall" - ensures agents can't hallucinate completion

---

## 🛠️ **STEP-BY-STEP IMPLEMENTATION INSTRUCTIONS**

### **PHASE 1: FOUNDATION SETUP (Week 1)**
**Team**: 2-3 engineers

#### **Step 1.1: Fork and Sandbox Opencode**
```bash
# Already done: /home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration
git checkout -b shark-integration
```

#### **Step 1.2: Set Up Development Environment**
```bash
# Install bun if not present
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Install dependencies
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration
bun install
```

#### **Step 1.3: Analyze Integration Points in Detail**
1. Examine `packages/opencode/src/session/processor.ts` - understand message flow
2. Map Opencode's plugin/middleware system (if exists)
3. Identify where to inject Shark systems
4. Document all touchpoints for Guardian, Workflow, AutoDebug

### **PHASE 2: CORE SYSTEMS INTEGRATION (Weeks 2-3)**
**Team**: 3-4 engineers (parallel work)

#### **Step 2.1: Guardian Integration (High Priority)**
1. Port Guardian system from Shark Frankenstein to Opencode
2. Create `packages/shark-agent/src/guardian/` directory
3. Wrap all file system operations (read/write/edit/delete) with permission checks
4. Implement system file blocking (.ssh, /etc/passwd, etc.)
5. Add audit logging
6. **Verification**: Guardian blocks `/etc/passwd` write attempts

#### **Step 2.2: Workflow State Machine Integration (High Priority)**
1. Port WorkflowMachine to Opencode
2. Create `packages/shark-agent/src/workflow/` directory
3. Hook into command execution pipeline
4. Enforce 5-step (MVP) → 6-step (V2) sequence
5. Block advancement until step completion evidence
6. **Verification**: Workflow prevents BUILD step without complete PLAN

#### **Step 2.3: ToolExecutor Integration**
1. Replace native tool execution with Shark's Guardian-protected version
2. Create `packages/shark-agent/src/tools/` directory
3. Ensure consistent tool result formatting
4. Integrate with Opencode's tool registry
5. **Verification**: ToolExecutor blocks unauthorized file operations

### **PHASE 3: DUAL-BRAIN ARCHITECTURE (Weeks 4-5)**
**Team**: 2-3 engineers

#### **Step 3.1: AutoSwitchDetector Implementation (CRITICAL)**
1. Implement based on `SHARK_AUTO_SWITCH_DEMONSTRATION.md`
2. Create `packages/shark-agent/src/auto-switch/` directory
3. Monitor sessions for mode transition opportunities
4. Implement trigger detection (task analysis, user intent, tool requirements)
5. Add suggestion/auto-switch logic
6. **Verification**: Auto-switch works as demonstrated

#### **Step 3.2: DualBrainCoordinator Integration**
1. Port DualBrainCoordinator to Opencode
2. Create `packages/shark-agent/src/brain/` directory
3. Implement Micro Engineer: DeepSeek plans → vLLM/Gemma executes
4. Implement Macro Engineer: GLM plans+executes → DeepSeek advises
5. Configure automatic switching based on task complexity
6. **Verification**: Both modes functional, automatic switching works

#### **Step 3.3: Model Client Integration**
1. Integrate GLM client for coding plan endpoint (`api.z.ai/api/coding/paas/v4`)
2. Integrate DeepSeek client for advisory role
3. Integrate vLLM client for local execution
4. Configure fallback to Gemma proxy
5. **Verification**: All model clients respond correctly

### **PHASE 4: ANTI-HALLUCINATION SYSTEMS (Weeks 6-7)**
**Team**: 2 engineers

#### **Step 4.1: AutoDebug Integration**
1. Port AutoDebugEngine to Opencode
2. Integrate into error handling pipeline
3. Pattern matching for common errors (missing scripts, wrong paths, etc.)
4. Mechanical fix attempts before user error display
5. **Verification**: AutoDebug fixes "missing script: build" automatically

#### **Step 4.2: Mechanical Violation Detection**
1. Implement detection for agents faking completion or skipping steps
2. Clear error messages with mechanical next steps
3. Integrate with Workflow state machine
4. **Verification**: Agent faking test results gets mechanical violation error

### **PHASE 5: FINAL VALIDATION (Week 8)**
**Team**: 3 engineers

#### **Step 5.1: Mechanical Ship Validation**
1. Implement compile-from-scratch verification at completion
2. Artifact-based workflow completion proof (0 AI inference)
3. Forced restart from PLAN on validation failure
4. **Verification**: Ship validation requires actual mechanical compilation proof

#### **Step 5.2: Integration Test Suite**
1. Create comprehensive test suite for all Shark systems
2. Test edge cases and violation scenarios
3. Verify no theatrical code remains
4. **Verification**: All integration tests pass

---

## 📁 **FILE STRUCTURE FOR INTEGRATION**

After forking Opencode, add Shark systems to:

```
/packages/shark-agent/
├── src/
│   ├── auto-switch/           # Auto-switch detection system
│   │   ├── detector.ts        # AutoSwitchDetector
│   │   ├── triggers.ts        # Trigger patterns
│   │   ├── integration.ts     # Opencode integration
│   │   └── safety.ts          # Guardian safety checks
│   ├── brain/                 # Dual-brain coordinator & model clients
│   │   ├── coordinator.ts     # DualBrainCoordinator (from Shark Frankenstein)
│   │   ├── glm.ts             # GLM client (coding plan endpoint)
│   │   ├── deepseek.ts        # DeepSeek client
│   │   ├── gemma.ts           # Gemma client (via proxy)
│   │   ├── vllm.ts            # vLLM client (local execution)
│   │   └── types.ts           # Shared types
│   ├── guardian/              # File protection system
│   │   └── index.ts           # Guardian class
│   ├── workflow/              # 5-step workflow enforcer
│   │   ├── state-machine.ts   # WorkflowMachine
│   │   └── types.ts           # WorkflowStep, etc.
│   ├── debug/                 # Auto-debug engine
│   │   └── autodebug.ts       # AutoDebugEngine
│   └── tools/                 # Safe tool execution
│       └── executor.ts        # ToolExecutor
├── docs/
│   ├── auto-switch-demo.md    # Auto-switch demonstration
│   └── integration-guide.md   # Integration documentation
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## ⚙️ **CONFIGURATION SYSTEM INTEGRATION**

Extend Opencode's config to include Shark's mechanical enforcement:

```json
// In opencode.json or .opencode/opencode.json
{
  "sharkEnforcement": {
    "dualBrainMode": "micro|macro",
    "workflowStrictness": "enforced",  // Always enforced
    "guardianLevel": "maximum",
    "autoDebugSensitivity": "high",
    "mechanicalValidation": true,     // Core requirement - zero-AI validation
    "apiKeys": {
      "glm": "your_glm_key_here",
      "deepseek": "your_deepseek_key_here",
      "google": "your_google_key_here"
    },
    "gemmaProxy": {
      "enabled": true,
      "url": "https://shark-gemini-proxy-production.up.railway.app"
    }
  }
}
```

---

## ✅ **SUCCESS CRITERIA**

### **Mechanical Enforcement (MVP)**
- [ ] Guardian blocks system file writes
- [ ] Workflow prevents step skipping
- [ ] AutoDebug fixes 60% of common errors
- [ ] ToolExecutor blocks unauthorized operations

### **Anti-Hallucination (V1)**
- [ ] Agents cannot fake test results
- [ ] Ship validation requires actual compilation
- [ ] No simulated/mocked outputs without workflow completion

### **Dual-Brain Functionality**
- [ ] Micro Engineer: DeepSeek plans → vLLM/Gemma executes
- [ ] Macro Engineer: GLM handles end-to-end with DeepSeek advisory
- [ ] Automatic mode switching based on task complexity (as demonstrated)

### **UI Preservation**
- [ ] Opencode's interface remains intact
- [ ] Shark-specific indicators added (mode, workflow step, guardian status)
- [ ] All existing Opencode features accessible

---

## 🔗 **RESOURCES**

### **Shark Frankenstein Repository**
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/` - Main TypeScript CLI codebase
- `SHARK-MASTER-PROMPT.md` - Architecture definition for vanilla agents
- `SHARK_OPENCODE_INTEGRATION_BLUEPRINT.md` - Integration roadmap
- `FIXED-cli.ts` - Integrated Shark CLI (reference implementation)

### **Opencode Source**
- `https://github.com/anomalyco/opencode` - Main repository
- Forked to: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/`

### **Context Documents (GitHub URLs)**
- `https://raw.githubusercontent.com/leviathan-devops/shark-frankenstein/main/SHARK-MASTER-PROMPT.md`
- `https://raw.githubusercontent.com/leviathan-devops/shark-frankenstein/main/SHARK_OPENCODE_INTEGRATION_BLUEPRINT.md`
- `https://raw.githubusercontent.com/leviathan-devops/shark-frankenstein/main/docs/COMPLETE-HANDOFF-PROMPT.md`

### **Local Documentation**
- `SHARK_AUTO_SWITCH_DEMONSTRATION.md` - Real-time auto-switch example
- `SHARK_OPENCODE_INTEGRATION_PLAN.md` - Complete integration plan
- `SHARK_OPENCODE_GLM_BUILD_PROMPT.md` - Detailed build prompt

---

## 🚫 **WHAT NOT TO DO**

- ❌ **Do NOT** replace or remove ANY Opencode code
- ❌ **Do NOT** describe/explain without implementing
- ❌ **Do NOT** stay silent then claim "done" 
- ❌ **Do NOT** suggest older/slower models when user wants latest (use glm-4.7)
- ❌ **Do NOT** create mock tests instead of running real tests
- ❌ **Do NOT** use standard GLM endpoint (user has Coding Plan subscription)
- ❌ **Do NOT** push to git without explicit user approval

## ✅ **WHAT TO DO**

- ✅ **Actually write code, run commands, modify files**
- ✅ **Report incrementally** (every action) using Shark communication format
- ✅ **Test real functionality**, not just imports or syntax
- ✅ **Verify glm-4.7 works specifically** on the coding plan endpoint
- ✅ **Ask for approval** before any git operations
- ✅ **Focus on implementation**, not explanation
- ✅ **Preserve what user likes** about Opencode's UI

---

## 📋 **COMMUNICATION PROTOCOL (MANDATORY)**

All work must follow Shark's communication standard:

```
[1/5] Description of action... ✓ (result)
[2/5] Description of action... ✓ (result)
...
```

**Examples**:
```
[1/5] Integrating Guardian file protection... ✓ (blocks /etc/passwd write)
[2/5] Wrapping read/write tools with permission checks... ✓ (all tools guarded)
[3/5] Testing workflow enforcement... ✓ (blocks build without plan)
[4/5] Configuring dual-brain coordinator... ✓ (micro/macro modes functional)
[5/5] Verifying anti-hallucination detection... ✓ (catches fake test results)
```

**NEVER** push to git without explicit user approval.

---

## 🏁 **COMPLETION CRITERIA**

You are done when:
1. ✅ Forked Opencode repository with Shark systems integrated
2. ✅ All 4 Shark systems (Guardian, Workflow, AutoDebug, ToolExecutor) operational
3. ✅ Dual-brain architecture functioning (micro/macro modes)
4. ✅ Mechanical enforcement verified (no bypass possible)
5. ✅ Anti-hallucination systems working (catches fake outputs)
6. ✅ Ship validation requires actual mechanical proof
7. ✅ Build passes and all integration tests pass
8. ✅ User approves before any git push
9. ✅ Ready for Stage 3 user endpoint validation

---

**The CLI becomes the Earth Density** - mechanical enforcement layer that directs the river of AI agency toward productive, verifiable output. Agents operate freely within the channel but cannot escape its constraints. This is the Shark Agent thesis realized through Opencode's foundation.

*Let's build the future of trustworthy AI agents.* 🦈
