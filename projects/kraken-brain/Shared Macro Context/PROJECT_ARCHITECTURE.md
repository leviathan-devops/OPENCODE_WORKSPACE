# 🦑 KRAKEN BRAIN - PROJECT ARCHITECTURE (LONG-TERM MEMORY)

**Created**: Mar 24 2026  
**Purpose**: Permanent architecture reference for Kraken Brain orchestration of Shark Agent + Opencode integration  
**Status**: Planning complete, ready for GLM engineer deployment

---

## 🎯 **MISSION ESSENCE**

Integrate Shark Agent's mechanical enforcement systems into Opencode's TypeScript codebase as an **operating system level enhancement**, preserving 100% of Opencode's UI/UX while adding hardcoded workflow enforcement, file protection, and dual-brain architecture.

**CRITICAL CONSTRAINT**: DO NOT replace or remove ANY Opencode code—only enhance or add to existing architecture.

---

## 📊 **CRITICAL DISCOVERIES (PERMANENT RECORD)**

### **Language Correction**
- **Opencode = TypeScript** (55.3% TS, 40.7% MDX) - **NOT Go** as previously assumed
- **Shark Frankenstein CLI** exists but has theatrical code issues (~50% of Qwen Code level)

### **Integration Status**
1. **Auto-switch demonstrated** (Mar 24 2026) - Opencode auto-switched from plan→build mode based on content analysis
2. **GLM 4.7 endpoint confirmed working** (`api.z.ai/api/coding/paas/v4/`) with tool use capabilities
3. **Local vLLM setup operational** (Qwen 2.5 Coder 7B AWQ) for Micro Engineer testing
4. **Opencode-ultra plugin installed** with multi-agent capabilities
5. **Shark-agent skill file exists** (`~/.config/opencode/skills/shark-agent/SKILL.md`)

### **Configuration Verified**
- GLM provider configured in `~/.config/opencode/opencode.json`
- All GLM models (GLM-5, GLM-4.7, GLM-4.5, etc.) properly configured
- Reasoning enabled with correct context limits (progress bar fixed)
- Shark Agent skill triggers on: "shark agent", "micro/macro mode", "autonomous coding"

---

## 🏗️ **KRAKEN BRAIN ARCHITECTURE**

### **Orchestration Stack**
```
┌─────────────────────────────────────────────────────────────┐
│                    DEEPSEEK KRAKEN BRAIN                    │
│  • Central decision maker & coordinator                    │
│  • 128K context window (DeepSeek Reasoner)                 │
│  • Makes strategic decisions                               │
│  • Receives filtered intelligence from Nemotron            │
│  • Issues commands to GLM engineers via Nemotron          │
│  • Can request "more context" (24-72k tokens)              │
└─────────────────────┬───────────────────────────────────────┘
                      │ Compressed intelligence (2-8k tokens)
                      │ Uses ONLY tokens needed (not forced to max)
                      │ Commands & directives
┌─────────────────────▼───────────────────────────────────────┐
│         NEMOTRON COMMUNICATION LAYER (1M tokens)            │
│  • 1M token context window (free model)                    │
│  • Ingests ALL GLM engineer outputs (100K+ tokens)        │
│  • Compacts & filters critical information                │
│  • Maintains full context of build progress               │
│  • Passes essential updates to Kraken Brain (2-8k)        │
│  • Receives commands from Kraken Brain                    │
│  • Distributes tasks to GLM engineers                     │
│  • Smart token sizing: 2k/4k/6k/8k based on complexity    │
│  • Minimal token usage: 500 token msg → 500 tokens        │
│  • "More context" requests return 24-72k tokens           │
└─────────────────────┬───────────────────────────────────────┘
                      │ Full task context & raw outputs
                      │ Assigned subtasks
┌─────────────────────▼───────────────────────────────────────┐
│             OPENCODE-ULTRA PLUGIN (Manager)                │
│  • Spawns & manages GLM engineer instances                │
│  • Distributes tasks to available engineers               │
│  • Monitors engineer progress                             │
│  • Collects outputs for Nemotron                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ Task assignments & monitoring
                      │ Code outputs & progress
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼─────┐     ┌────▼─────┐     ┌─────▼──────┐
│ GLM     │     │ GLM      │     │ GLM       │
│ ENGINEER│     │ ENGINEER │     │ ENGINEER  │
│ #1      │     │ #2       │     │ #3        │
│         │     │          │     │           │
│ Guardian│     │ Workflow │     │ AutoDebug │
│ Module  │     │ State    │     │ Module    │
│         │     │ Machine  │     │           │
└─────────┘     └──────────┘     └───────────┘
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
               ┌──────▼──────┐     ┌──────▼──────┐
               │ GLM         │     │ GLM         │
               │ ENGINEER    │     │ ENGINEER    │
               │ #4          │     │ #5          │
               │             │     │             │
               │ DualBrain   │     │ Integration │
               │ Coordinator │     │ Testing     │
               └─────────────┘     └─────────────┘
```

### **Surgical Debugging Protocol**
When Nemotron detects bugs or broken code, Kraken Brain deploys **surgical debugging agents** directly into GLM engineer containers:
- **Trigger Conditions**: Code quality degradation, build failures >30min, progress stagnation >1hr
- **Debug Agent Types**: DeepSeek Chat, Fresh GLM Model, Specialized Debugger, AutoDebug Agent
- **Deployment**: Direct injection into engineer's container for parallel debugging
- **Exit Criteria**: Bug fixed, workaround established, 2-hour time limit, engineer request

---

## 🦈 **SHARK AGENT SYSTEMS (ALL TYPESCRIPT)**

### **1. Guardian Module** (`src/guardian/index.ts` ~800 lines)
- File protection with zone classification (workspace vs system)
- Critical system file protection (`.ssh`, `/etc/passwd`, etc.)
- Operation audit logging
- Configurable protection levels (STRICT, BALANCED, PERMISSIVE, SANDBOX)
- Sandbox mode for testing

### **2. Workflow State Machine** (`src/workflow/state-machine.ts` ~862 lines)
- 5-step workflow enforcement (PLAN → BUILD → TEST → VERIFY → SHIP)
- Step validation via mechanical evidence checking
- Blocks invalid state transitions
- 3-failure reset mechanism (resets to PLAN with full context capture)
- V2 adds "Crash Test" step (6-step workflow)

### **3. AutoDebug Module** (`src/debug/autodebug.ts` ~530 lines)
- Pattern-based error fixing
- 47+ common error patterns loaded
- Mechanical fix generation for Docker/npm errors
- Integrated error analysis and auto-fix attempts

### **4. DualBrain Coordinator** (`src/brain/coordinator.ts`)
- Micro/Macro mode switching
- **Micro Engineer**: DeepSeek R1 (THINKS) → Gemma 3 4B (DOES)
- **Macro Engineer**: GLM 4.5-flash (PRIMARY) + DeepSeek R1 (ADVISORY)
- Auto-switch on task analysis, user intent, tool requirements

### **5. ToolExecutor** (`src/tools/executor.ts`)
- Protected tool execution
- Guardian-wrapped file operations
- Workflow-integrated command execution

---

## 🎯 **INTEGRATION WITH OPENCODE**

### **Integration Points**
1. **Mode Switching System** (`packages/opencode/src/agent/agent.ts`)
   - Map Opencode's plan/build mode to Shark's Micro/Macro modes
   - Add AutoSwitchDetector layer for automatic mode transitions
   - Preserve manual toggle alongside auto-switch

2. **Command Execution Pipeline** (`packages/opencode/src/session/processor.ts`)
   - Guardian Angel: Wrap ALL file operations with permission checks
   - WorkflowMachine: Inject 5-step validation at command boundaries
   - ToolExecutor: Replace native tool execution with Guardian-protected version

3. **Error Handling & Feedback Loop** (`packages/opencode/src/session/status.ts`)
   - Replace error display with mechanical violation detection
   - AutoDebug integration for pattern-based error fixing
   - Anti-hallucination validation

4. **Completion/Ship Validation** (`packages/opencode/src/session/processor.ts`)
   - Mechanical compile-from-scratch validation at SHIP stage
   - Satisfaction firewall ensuring agents can't hallucinate completion
   - Forces restart from PLAN if validation fails

### **Reference Implementation**
**`FIXED-cli.ts`** (`shark-frankenstein/GLM Engineer Shared Workspace/`) shows complete integration:
- Guardian initialization: `createProductionGuardian(workspacePath)`
- Workflow initialization: `new WorkflowMachine(workspacePath)`
- AutoDebug initialization: `new AutoDebugEngine()`
- Guardian wrapping: All file operations checked via `checkGuardian()`
- Workflow enforcement: `setOriginalPrompt()` and step tracking

---

## 🔄 **6-STEP WORKFLOW (V2)**

### **MVP (5 Steps)**
1. **PLAN**: Written plan file with specific, testable requirements
2. **BUILD**: Actual code files that compile/run
3. **TEST**: Actual test execution logs (unit/integration/edge/security)
4. **VERIFY**: Clean environment test results
5. **SHIP**: Mechanical compilation from scratch validation

### **V2 Enhancement (6 Steps)**
Adds **CRASH TEST** after SHIP for adversarial user-endpoint testing:
- Adversarial testing from user perspective
- Edge case and abuse scenario testing
- Real-world deployment validation

### **Loop Mechanic**
- If verification fails → Go back to BUILD → Fix → Re-run TEST → Re-run VERIFY
- After 3 failures → Reset to PLAN → Capture full failure context → Re-plan with lessons learned

---

## 🤖 **GLM ENGINEER DEPLOYMENT**

### **5 Parallel GLM 4.7 Engineers**
1. **Engineer #1**: Guardian module integration
   - Port Guardian system to Opencode
   - Wrap all file system operations with permission checks
   - Implement system file blocking and audit logging

2. **Engineer #2**: Workflow State Machine integration
   - Port WorkflowMachine to Opencode
   - Hook into command execution pipeline
   - Enforce 5-step (MVP) → 6-step (V2) sequence

3. **Engineer #3**: AutoDebug module integration
   - Port AutoDebug engine to Opencode
   - Integrate into error handling pipeline
   - Pattern-based error detection and fixing

4. **Engineer #4**: DualBrain Coordinator integration
   - Port DualBrainCoordinator to Opencode
   - Implement automatic mode switching
   - Map Opencode plan/build → Shark micro/macro modes

5. **Engineer #5**: Integration testing & verification
   - Create comprehensive integration tests
   - Implement anti-hallucination validation
   - Mechanical compile-from-scratch verification

### **Timeline**: ~1 week total with parallel development
- **Days 1-2**: Foundation setup & environment
- **Days 3-5**: Parallel module development
- **Day 6**: Integration testing
- **Day 7**: Final verification & documentation

---

## 🚨 **ANTI-HALLUCINATION PROTOCOLS**

### **What is "Theatrical Code"?**
Code that appears functional but:
1. Has fake test results (tests pass but functionality broken)
2. Simulates workflow completion without actual evidence
3. Bypasses mechanical validation with clever tricks
4. Creates appearance of functionality without substance

### **Detection Mechanisms**
1. **Mechanical compilation** - Code must compile from scratch with no agent context
2. **Workflow step evidence** - Each step requires mechanical proof
3. **Cross-validation** - Multiple systems verify same result
4. **Random sampling** - Spot checks on generated code
5. **Satisfaction firewall** - Final output validation separate from agent

### **Required Evidence for Each Workflow Step**
- **PLAN**: Written plan file with specific, testable requirements
- **BUILD**: Actual code files that compile/run
- **TEST**: Actual test execution logs, not just "tests pass" statement
- **VERIFY**: Clean environment test results
- **SHIP**: Mechanical compilation from scratch validation
- **CRASH TEST** (V2): Adversarial user-endpoint testing results

---

## 📁 **FILE STRUCTURE**

### **Primary Directories**
```
/home/leviathan/OPENCODE_WORKSPACE/
├── Kraken Brain/                          # MASTER DIRECTORY (THIS)
│   ├── ACTIVE_CONTEXT.md                  # Active context with 3-summary rotation
│   └── Shared Macro Context/
│       └── PROJECT_ARCHITECTURE.md        # This file (permanent architecture)
├── shark-frankenstein/                    # Shark Agent TypeScript source
│   ├── src/                               # Core modules
│   ├── GLM Engineer Shared Workspace/
│   │   └── FIXED-cli.ts                   # Reference implementation
│   └── docs/                              # Documentation
├── shark-opencode-integration/            # Forked Opencode repository
│   ├── packages/opencode/src/             # Opencode source code
│   └── AGENTS.md                          # OpenCode agents configuration
└── .config/opencode/                      # OpenCode configuration
    ├── opencode.json                      # Main config with GLM provider
    ├── skills/shark-agent/SKILL.md        # Shark Agent skill definition
    └── node_modules/opencode-ultra/       # Multi-agent plugin
```

### **Critical Planning Documents**
- **Master Build Prompt**: `SHARK_OPENCODE_MASTER_BUILD_PROMPT_KRAKEN.md`
- **Orchestration Plan**: `KRAKEN_BRAIN_ORCHESTRATION_PLAN.md`
- **Auto-Switch Demo**: `SHARK_AUTO_SWITCH_DEMONSTRATION.md`
- **Knowledge Base**: `SHARK_KRAKEN_KNOWLEDGE_BASE.md`
- **Integration Guide**: `GLM_OPENCODE_INTEGRATION_COMPLETE_GUIDE.md`

---

## 🔧 **TECHNICAL SPECIFICATIONS**

### **Micro Engineer Mode**
- **Brain**: DeepSeek R1 (THINKS - burns tokens for reasoning)
- **Hands**: Gemma 3 4B (DOES - FREE tier, 14k RPD)
- **Use**: Linear tasks, single-file, syntax fixes, unit tests
- **Like**: Special Forces - surgical precision

### **Macro Engineer Mode**
- **Primary**: GLM 4.5-flash (autonomous execution)
- **Advisory**: DeepSeek R1 (strategic copilot)
- **Use**: Multi-file architecture, DevOps, CI/CD
- **Like**: Air Force - full engineering capabilities

### **Compiler Firewall**
- Agent outputs must pass through CLI validation layer
- Enforces full workflow completion before output
- 3-failure reset triggers restart with full context capture

### **Auto-Switch Criteria**
- Task analysis, user intent, tool requirements, complexity scoring
- **Build Triggers**: "implement", "create", "write", "run", "execute", "make"
- **Plan Triggers**: "analyze", "plan", "design", "think", "consider", "review"

---

## ⚠️ **RISK MITIGATION**

### **Identified Risks**
1. **Context Overflow to Kraken Brain**
   - **Mitigation**: Smart 2-8k token sizing (minimal tokens used, not forced to max)
   - **Override**: Orchestrator can request "more context" (24-72k) when needed

2. **GLM Engineer Misalignment**
   - **Mitigation**: Daily syncs + dependency tracking in Nemotron

3. **Nemotron Bridge Failure**
   - **Mitigation**: Periodic ground truth snapshots + fallback logging

4. **Integration Conflicts**
   - **Mitigation**: Dependency-aware scheduling + integration testing phase

### **Success Metrics**
1. **Kraken Brain token usage**: <6k tokens/hour average from Nemotron (minimal token usage)
2. **Build progress**: 5 modules completed in ~1 week
3. **Integration success**: Shark Agent fully operational in Opencode
4. **Context preservation**: All critical decisions retained through compaction
5. **Orchestration efficiency**: Minimal manual intervention required
6. **Token efficiency**: Messages use only needed tokens (not forced to max budget)
7. **Override capability**: Orchestrator can access 24-72k tokens when needed

---

## 🎯 **COMPLETION CRITERIA**

Project is complete when:
1. ✅ Forked Opencode repository with Shark systems integrated
2. ✅ All 4 Shark systems (Guardian, Workflow, AutoDebug, DualBrain) operational
3. ✅ Dual-brain architecture functioning (micro/macro modes)
4. ✅ Mechanical enforcement verified (no bypass possible)
5. ✅ Anti-hallucination systems working (catches fake outputs)
6. ✅ Ship validation requires actual mechanical proof
7. ✅ Build passes and all integration tests pass
8. ✅ User approves before any git push
9. ✅ Ready for Stage 3 user endpoint validation

---

## ⚠️ **OPEN RISKS & UNRESOLVED ISSUES**

### **1. Auto‑Switch Mystery**
- Need to investigate exact Opencode logic that triggered auto‑switch (Mar 24 2026).
- Required for reliable dual‑brain auto‑switching implementation.

### **2. Surgical Debugging Protocol**
- Implementation not yet deployed.
- Need to integrate with opencode‑ultra plugin for direct agent injection.

### **3. Integration Testing**
- Cross‑module validation not yet performed.
- Anti‑hallucination verification systems not yet implemented.

### **4. Nemotron Bridge Efficiency**
- Hybrid filtering (rules + semantic analysis) not yet implemented.
- Target: <2K tokens/hour to Kraken Brain.

### **5. Context Preservation**
- Auto‑update mechanism for `ACTIVE_CONTEXT.md` at 85% token usage not yet built.
- Ground‑truth snapshot procedure for bridge failure recovery needed.

### **6. opencode‑ultra Plugin Extension**
- Source code not examined (only dist/index.js).
- Need to identify `spawnAgent` API and plugin hooks.

---

## 🔗 **CRITICAL CONSTRAINTS**

- **NEVER remove/replace** Opencode code
- **Preserve manual toggle** alongside auto‑switch
- **No theatrical code** – mechanical validation required
- **Report via Nemotron** – Kraken Brain token limited
- **1 week timeline** with 5 parallel GLM engineers
- **GLM 4.7 engineers** as "bulldozers" – give detailed prompts, they build with 70‑80% accuracy

---

**The CLI becomes the Earth Density** – mechanical enforcement layer that directs the river of AI agency toward productive, verifiable output. Agents operate freely within the channel but cannot escape its constraints. This is the Shark Agent thesis realized through Opencode's foundation.

*KRAKEN BRAIN OVERSEEING – NEMOTRON BRIDGE PLANNED – 5 GLM ENGINEERS READY FOR DEPLOYMENT*