# 🦈 SHARK AGENT + OPENCODE GLM ENGINEER BUILD PROMPT

## 🎯 MISSION
Integrate Shark Agent's mechanical enforcement systems into Opencode's TypeScript codebase, preserving 100% of Opencode's UI/UX while adding hardcoded workflow enforcement, file protection, and dual-brain architecture at the deepest possible level.

**CRITICAL CONSTRAINT:** DO NOT replace or remove ANY Opencode code—only enhance or add to existing architecture.

## 📊 CURRENT STATUS (Mar 24 2026)

### ✅ Discoveries Made
1. **Opencode is TypeScript** (55.3% TS, 40.7% MDX) - not Go as previously assumed
2. **Shark Frankenstein CLI exists** (~50% of Qwen Code level) with identified theatrical code issues
3. **Correct GitHub URLs** identified for all context documents
4. **Shark-agent skill file exists** (`~/.config/opencode/skills/shark-agent/SKILL.md`) showing prior integration attempt
5. **User has working vLLM setup** for testing Micro Engineer execution
6. **GLM 4.7 coding plan endpoint confirmed working** with tool use capabilities
7. **Integration approach clarified**: Surgical addition to Opencode codebase, not replacement

### ✅ Shark Systems Examined (All TypeScript)
- **Guardian** (`src/guardian/index.ts` ~800 lines) - File protection with zone classification
- **Workflow State Machine** (`src/workflow/state-machine.ts` ~862 lines) - 5-step workflow enforcement  
- **AutoDebug** (`src/debug/autodebug.ts` ~530 lines) - Pattern-based error fixing
- **DualBrainCoordinator** (`src/brain/coordinator.ts`) - Micro/Macro mode switching
- **ToolExecutor** (`src/tools/executor.ts`) - Protected tool execution

### ✅ Opencode Architecture Analyzed
Key integration points:
- `packages/opencode/src/agent/agent.ts` - Plan/build agent definitions
- `packages/opencode/src/session/processor.ts` - Message/tool processing
- `packages/opencode/src/tool/registry.ts` - Tool execution system
- `packages/opencode/src/permission/index.ts` - Permission system
- `packages/opencode/src/session/status.ts` - Session completion logic

## 🏗️ INTEGRATION STRATEGY

### Core Principles
1. **Build on top of Opencode's plan/build toggle system** - enhance with autonomous agent switching
2. **Integrate at deepest CLI level** - Guardian, Workflow, AutoDebug hardcoded into CLI core
3. **Use sandboxed development** - fork Opencode, protect original with Guardian
4. **Enable parallel development** - 6-8 GLM engineers can work on different components
5. **MVP = Mode switching + Guardian + 5-step workflow** → V2 = Add Crash Test (Step 6)

### Technical Specifications
- **Micro Engineer**: vLLM (primary) and Gemma (fallback) as equal execution engine options
- **Macro Engineer**: GLM 4.7 on coding plan endpoint (`api.z.ai/api/coding/paas/v4/`) with DeepSeek advisory
- **Compiler firewall**: Agent outputs must pass through CLI validation layer that enforces full workflow completion
- **3-failure reset**: Three consecutive failures at any workflow step triggers reset to Plan with full context capture
- **Autonomous mode switching**: Agents automatically switch between plan/build modes based on workflow context (DEMONSTRATED LIVE)
- **Auto-switch criteria**: Task analysis, user intent, tool requirements, complexity scoring
- **Integration method**: Plugin/middleware system hardcoded into CLI core (operating system level enhancement)
- **Sandbox approach**: Fork Opencode repo for parallel development
- **Auto-switch behavior**: Always-on enhancement working alongside manual toggle

## 📁 REFERENCE: FIXED SHARK CLI (`FIXED-cli.ts`)

A fully integrated version of Shark CLI exists at:
`/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/GLM Engineer Shared Workspace/FIXED-cli.ts`

**Key Integration Patterns:**
1. **Guardian initialization** - `createProductionGuardian(workspacePath)`
2. **Workflow initialization** - `new WorkflowMachine(workspacePath)`
3. **AutoDebug initialization** - `new AutoDebugEngine()`
4. **Guardian wrapping** - All file operations checked via `checkGuardian()`
5. **Workflow enforcement** - `setOriginalPrompt()` and step tracking
6. **AutoDebug integration** - Error analysis and auto-fix attempts

**Use this file as the model for Opencode integration.**

## 🎯 INTEGRATION POINTS (OPENCODE → SHARK)

### 1. MODE SWITCHING SYSTEM (Primary Target)
**Location**: Opencode's plan/build mode toggle mechanism
**Files**: `packages/opencode/src/agent/agent.ts`, `packages/opencode/src/session/processor.ts`

**CRITICAL CLARIFICATION**: DO NOT REPLACE manual toggle. Add **autonomous dual-brain switching** as an ALWAYS-ON ENHANCEMENT that works alongside manual toggle.

**Integration Tasks:**
1. Map Opencode's plan/build mode to Shark's Micro/Macro modes
2. **Add AutoSwitchDetector layer** that monitors sessions for mode transition opportunities
3. **Micro Engineer Mode** = Automatic detection when to switch from Plan (DeepSeek analysis) → Build (vLLM/Gemma execution)
4. **Macro Engineer Mode** = GLM handles planning+building internally, DeepSeek as advisory
5. Leverage Opencode's existing "cannot build in plan mode" enforcement as foundation for Guardian/Workflow systems
6. **Auto-switch criteria**: Task analysis, user intent, tool requirements, complexity scoring (DEMONSTRATED LIVE)

**Reference**: `SHARK_AUTO_SWITCH_DEMONSTRATION.md` - Real-time example captured

### 2. COMMAND EXECUTION PIPELINE (Core Enforcement)
**Location**: Where Opencode processes/executes agent-generated commands
**Files**: `packages/opencode/src/session/processor.ts`, `packages/opencode/src/tool/registry.ts`

**Integration Tasks:**
1. **Guardian Angel**: Wrap ALL file operations (read/write/delete) with permission checks
2. **WorkflowMachine**: Inject 5-step validation (PLAN→BUILD→TEST→VERIFY→SHIP) at command boundaries
3. **ToolExecutor**: Replace native tool execution with Shark's Guardian-protected version
4. **AutoDebugEngine**: Integrate into error handling - provide mechanical fixes before allowing retry

### 3. ERROR HANDLING & FEEDBACK LOOP (Anti-Hallucination)
**Location**: How Opencode handles/reports errors from agent commands
**Files**: `packages/opencode/src/session/processor.ts`, `packages/opencode/src/session/status.ts`

**Integration Tasks:**
1. Replace error display with **mechanical violation detection**
2. When agent attempts to bypass workflow (e.g., faking test results):
   - CLI detects violation via workflow state
   - Outputs: `VIOLATION DETECTED: [specific workflow step skipped]`
   - Provides: `AUTO-DEBUG SOLUTION: [mechanical fix from knowledge base]`
   - Forces: `NEXT STEPS: [clear mechanical instructions to complete correct step]`
3. Prevents theatrical simulation by requiring actual workflow completion evidence

### 4. COMPLETION/SHIP VALIDATION (Final Gatekeeper)
**Location**: How Opencode determines when a task is "complete"
**Files**: `packages/opencode/src/session/processor.ts`, `packages/opencode/src/session/status.ts`

**Integration Tasks:**
1. Implement **mechanical compile-from-scratch validation** at ship stage
2. Before allowing user output:
   - CLI checks workflow state = SHIP stage
   - CLI mechanically compiles entire codebase from scratch (no agent context)
   - Verifies build workflow completion through artifact analysis (0 AI inference)
   - If validation fails: Forces restart from PLAN stage with added context
3. This is the "satisfaction firewall" - ensures agents can't hallucinate completion

## 🛠️ IMPLEMENTATION ROADMAP (Parallel Engineering)

### PHASE 1: FOUNDATION SETUP (Week 1)
**Engineers: 2**

#### Task 1.1: Fork and Sandbox Opencode
- Fork `https://github.com/anomalyco/opencode` to local development directory
- Set up development environment with TypeScript, npm dependencies
- Verify existing Opencode functionality works
- Create integration branch

#### Task 1.2: Analyze Integration Points in Detail
- Map Opencode's tool execution flow (`processor.ts`, `tool/registry.ts`)
- Understand permission system hooks
- Identify where to inject Guardian file protection
- Document all touchpoints for Shark systems

#### Task 1.3: Set Up Parallel Development Workspace
- Create shared workspace directory structure
- Set up documentation for GLM engineers
- Create component assignment matrix
- Establish communication protocol

### PHASE 2: CORE SYSTEMS INTEGRATION (Weeks 2-3)
**Engineers: 3**

#### Task 2.1: Guardian Integration (High Priority)
- Port Guardian system from Shark Frankenstein to Opencode
- Wrap all file system operations (read/write/edit/delete) with permission checks
- Implement system file blocking (.ssh, /etc/passwd, etc.)
- Add audit logging
- **Verification**: Guardian blocks `/etc/passwd` write attempts

#### Task 2.2: Workflow State Machine Integration (High Priority)
- Port WorkflowMachine to Opencode
- Hook into command execution pipeline
- Enforce 5-step (MVP) → 6-step (V2) sequence
- Block advancement until step completion evidence
- **Verification**: Workflow prevents BUILD step without complete PLAN

#### Task 2.3: ToolExecutor Integration
- Replace native tool execution with Shark's Guardian-protected version
- Ensure consistent tool result formatting
- Integrate with Opencode's tool registry
- **Verification**: ToolExecutor blocks unauthorized file operations

### PHASE 3: DUAL-BRAIN ARCHITECTURE (Weeks 4-5)
**Engineers: 2**

#### Task 3.1: DualBrainCoordinator Integration
- Replace core agent logic with DualBrainCoordinator
- Implement Micro Engineer: DeepSeek plans → vLLM/Gemma executes
- Implement Macro Engineer: GLM plans+executes → DeepSeek advises
- Configure automatic switching based on task complexity
- **Verification**: Both modes functional, automatic switching works

#### Task 3.2: Model Client Integration
- Integrate GLM client for coding plan endpoint (`api.z.ai/api/coding/paas/v4`)
- Integrate DeepSeek client for advisory role
- Integrate vLLM client for local execution
- Configure fallback to Gemma proxy
- **Verification**: All model clients respond correctly

### PHASE 4: ANTI-HALLUCINATION SYSTEMS (Weeks 6-7)
**Engineers: 2**

#### Task 4.1: AutoDebug Integration
- Port AutoDebugEngine to Opencode
- Integrate into error handling pipeline
- Pattern matching for common errors (missing scripts, wrong paths, etc.)
- Mechanical fix attempts before user error display
- **Verification**: AutoDebug fixes "missing script: build" automatically

#### Task 4.2: Mechanical Violation Detection
- Implement detection for agents faking completion or skipping steps
- Clear error messages with mechanical next steps
- Integrate with Workflow state machine
- **Verification**: Agent faking test results gets mechanical violation error

### PHASE 5: FINAL VALIDATION (Week 8)
**Engineers: 3**

#### Task 5.1: Mechanical Ship Validation
- Implement compile-from-scratch verification at completion
- Artifact-based workflow completion proof (0 AI inference)
- Forced restart from PLAN on validation failure
- **Verification**: Ship validation requires actual mechanical compilation proof

#### Task 5.2: Integration Test Suite
- Create comprehensive test suite for all Shark systems
- Test edge cases and violation scenarios
- Verify no theatrical code remains
- **Verification**: All integration tests pass

## ✅ SUCCESS CRITERIA

### Mechanical Enforcement (MVP)
- [ ] Guardian blocks system file writes
- [ ] Workflow prevents step skipping
- [ ] AutoDebug fixes 60% of common errors
- [ ] ToolExecutor blocks unauthorized operations

### Anti-Hallucination (V1)
- [ ] Agents cannot fake test results
- [ ] Ship validation requires actual compilation
- [ ] No simulated/mocked outputs without workflow completion

### Dual-Brain Functionality
- [ ] Micro Engineer: DeepSeek plans → vLLM/Gemma executes
- [ ] Macro Engineer: GLM handles end-to-end with DeepSeek advisory
- [ ] Automatic mode switching based on task complexity

### UI Preservation
- [ ] Opencode's interface remains intact
- [ ] Shark-specific indicators added (mode, workflow step, guardian status)
- [ ] All existing Opencode features accessible

## 📁 FILE STRUCTURE FOR INTEGRATION

After forking Opencode, add Shark systems to:

```
/packages/shark-agent/
├── src/
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
```

## ⚙️ CONFIGURATION SYSTEM INTEGRATION

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

## 🚫 WHAT NOT TO DO (USER PREFERENCES)

- ❌ **Do NOT** describe/explain without implementing
- ❌ **Do NOT** stay silent then claim "done" 
- ❌ **Do NOT** suggest older/slower models when user wants latest (use glm-4.7)
- ❌ **Do NOT** create mock tests instead of running real tests
- ❌ **Do NOT** use standard GLM endpoint (user has Coding Plan subscription)
- ❌ **Do NOT** push to git without explicit user approval

## ✅ WHAT TO DO

- ✅ **Actually write code, run commands, modify files**
- ✅ **Report incrementally** (every action) using the format below
- ✅ **Test real functionality**, not just imports or syntax
- ✅ **Verify glm-4.7 works specifically** on the coding plan endpoint
- ✅ **Ask for approval** before any git operations
- ✅ **Focus on implementation**, not explanation
- ✅ **Preserve what user likes** about Opencode's UI

## 📋 COMMUNICATION PROTOCOL (MANDATORY)

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

## 🔗 RESOURCES

### Shark Frankenstein Repository
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/` - Main TypeScript CLI codebase
- `SHARK-MASTER-PROMPT.md` - Architecture definition for vanilla agents
- `SHARK_OPENCODE_INTEGRATION_BLUEPRINT.md` - Integration roadmap
- `FIXED-cli.ts` - Integrated Shark CLI (reference implementation)

### Opencode Source
- `https://github.com/anomalyco/opencode` - Main repository
- Key integration files identified above

### Context Documents (GitHub URLs)
- `https://raw.githubusercontent.com/leviathan-devops/shark-frankenstein/main/SHARK-MASTER-PROMPT.md`
- `https://raw.githubusercontent.com/leviathan-devops/shark-frankenstein/main/SHARK_OPENCODE_INTEGRATION_BLUEPRINT.md`
- `https://raw.githubusercontent.com/leviathan-devops/shark-frankenstein/main/docs/COMPLETE-HANDOFF-PROMPT.md`

## 🏁 COMPLETION CRITERIA

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
