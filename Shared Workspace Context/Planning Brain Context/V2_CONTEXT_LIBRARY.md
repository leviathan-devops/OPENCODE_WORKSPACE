# V2 CONTEXT LIBRARY - Complete Reference for Shark Agent + Kraken Ultra Integration

**Version:** 2.0.0  
**Created:** Mar 26 2026  
**Purpose:** Single source of truth for all integration context, file references, and implementation guidance  
**Audience:** Macro Engineers, GLM Engineers, Orchestrators, Debug Agents

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Core Architecture Overview](#core-architecture-overview)
3. [Implementation Status Matrix](#implementation-status-matrix)
4. [Complete File Directory](#complete-file-directory)
5. [Reasoning Chain Framework](#reasoning-chain-framework)
6. [Parallel Execution Patterns](#parallel-execution-patterns)
7. [Anti-Hallucination Protocols](#anti-hallucination-protocols)
8. [Nemotron Communication Layer](#nemotron-communication-layer)
9. [Integration Points Map](#integration-points-map)
10. [Key Breakthroughs & Lessons](#key-breakthroughs--lessons)
11. [Configuration Reference](#configuration-reference)
12. [Quick Commands Reference](#quick-commands-reference)
13. [Troubleshooting Guide](#troubleshooting-guide)
14. [Next Steps Checklist](#next-steps-checklist)

---

## EXECUTIVE SUMMARY

### Mission
Integrate Shark Agent's mechanical enforcement systems into Opencode's TypeScript codebase as an **operating system level enhancement**, preserving 100% of Opencode's UI/UX while adding:
- Hardcoded workflow enforcement (PLAN → BUILD → TEST → VERIFY → SHIP)
- File protection via Guardian
- Dual-brain architecture (Micro/Macro engineers)
- Anti-hallucination validation
- Reasoning-chain mechanical enforcement

### Key Constraint
**DO NOT replace or remove ANY Opencode code** — only enhance or add to existing architecture.

### Two Integration Tracks

| Track | Description | Orchestrator | Engineers |
|-------|-------------|--------------|-----------|
| **Shark CLI** | Direct integration into Opencode fork | User/GLM | 2-5 GLM engineers |
| **Kraken Ultra** | Multi-agent orchestration with Nemotron bridge | DeepSeek | 5 GLM engineers |

---

## CORE ARCHITECTURE OVERVIEW

### The Earth and River Pattern

```
MECHANICAL ENFORCEMENT = EARTH DENSITY
- Hardcoded, immutable rules
- No negotiation, no interpretation
- Forces workflow adherence
- "The Brick Wall" - agents CANNOT bypass

         ↓ directs

AI AUTONOMY = RIVER FLOW
- Full creative freedom within constraints
- Can move fast, iterate, explore
- BUT cannot escape the channel

         =

DIRECTED FLOW = PRODUCTIVE WORK
- River reaches the destination
- Results are real, not simulated
```

### System Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (Opencode UI)                  │
├─────────────────────────────────────────────────────────────────┤
│                    AGENT SESSION LAYER                           │
│    MicroCoordinator (Plan↔Build)  │  MacroCoordinator (GLM+DS)   │
├─────────────────────────────────────────────────────────────────┤
│                    MECHANICAL ENFORCEMENT LAYER                  │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│    │ GUARDIAN │  │ WORKFLOW │  │AUTODEBUG │  │REASONING │      │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
├─────────────────────────────────────────────────────────────────┤
│                    TOOL EXECUTION LAYER                          │
│    ToolExecutor (Guardian-protected read/write/bash)             │
├─────────────────────────────────────────────────────────────────┤
│                    MODEL PROVIDER LAYER                          │
│    GLM 4.7  |  DeepSeek R1/Chat  |  vLLM Local  |  Gemma        │
└─────────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION STATUS MATRIX

### Shark Core Modules

| Module | Status | Location | Lines | Tests |
|--------|--------|----------|-------|-------|
| **Guardian** | ✅ Implemented | `shark-frankenstein/src/guardian/index.ts` | ~800 | ❌ Missing |
| **Workflow** | ✅ Implemented | `shark-frankenstein/src/workflow/state-machine.ts` | ~862 | ❌ Missing |
| **AutoDebug** | ✅ Implemented | `shark-frankenstein/src/debug/autodebug.ts` | ~530 | ❌ Missing |
| **DualBrain** | ✅ Implemented | `shark-frankenstein/src/brain/coordinator.ts` | ~200 | ❌ Missing |
| **ToolExecutor** | ✅ Implemented | `shark-frankenstein/src/tools/executor.ts` | ~150 | ❌ Missing |
| **Reasoning Validator** | ❌ Not Implemented | *To be created* | - | - |
| **Crash Test (V2)** | ❌ Proposed | *Not yet implemented* | - | - |

### Kraken Ultra Modules

| Module | Status | Location | Notes |
|--------|--------|----------|-------|
| **Nemotron Bridge** | ✅ Implemented | `Nemotron Communication Layer/src/nemotron-bridge.ts` | Message routing |
| **Message Classifier** | ✅ Implemented | `Nemotron Communication Layer/src/message-classifier.ts` | Token sizing |
| **Compression** | ✅ Implemented | `Nemotron Communication Layer/src/compression.ts` | Context filtering |
| **Anti-Hallucination** | ✅ Implemented | `Kraken Ultra/src/anti-hallucination/` | Pattern validation |
| **Surgical Debug** | ✅ Implemented | `Kraken Ultra/src/surgical-debug/` | Debug agent injection |
| **1M Token Storage** | ⚠️ Partial | Nemotron architecture | FIFO eviction planned |
| **More Context Requests** | ⚠️ Planned | Nemotron architecture | 24-72k token retrieval |

### Opencode Integration Points

| Integration Point | Status | Location | Verified |
|-------------------|--------|----------|----------|
| Agent Definitions | ✅ Exists | `shark-opencode-integration/packages/opencode/src/agent/agent.ts` | Yes |
| Session Processor | ✅ Exists | `shark-opencode-integration/packages/opencode/src/session/processor.ts` | Yes |
| Tool Registry | ✅ Exists | `shark-opencode-integration/packages/opencode/src/tool/registry.ts` | Yes |
| Permission System | ✅ Exists | `shark-opencode-integration/packages/opencode/src/permission/` | Yes |
| Status/Completion | ✅ Exists | `shark-opencode-integration/packages/opencode/src/session/status.ts` | Yes |

---

## COMPLETE FILE DIRECTORY

### 📁 Shark Frankenstein (Main CLI Implementation)

```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/
├── src/
│   ├── cli.ts                          # Main entry point (661 lines)
│   ├── index.ts                        # Export definitions
│   ├── brain/
│   │   ├── coordinator.ts              # DualBrainCoordinator
│   │   └── types.ts                    # Brain mode types
│   ├── config/
│   │   └── index.ts                    # Configuration loading
│   ├── debug/
│   │   └── autodebug.ts                # AutoDebugEngine (~530 lines)
│   ├── guardian/
│   │   └── index.ts                    # Guardian class (~800 lines)
│   ├── tools/
│   │   └── executor.ts                 # ToolExecutor
│   ├── workflow/
│   │   ├── state-machine.ts            # WorkflowMachine (~862 lines)
│   │   └── types.ts                    # WorkflowStep, WorkflowState
├── SHARK-MASTER-PROMPT.md              # Architecture definition
├── SHARK_OPENCODE_INTEGRATION_BLUEPRINT.md
├── package.json
└── tsconfig.json
```

### 📁 Kraken Ultra (Multi-Agent Orchestration)

```
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/
├── src/
│   ├── anti-hallucination/
│   │   ├── patterns.ts                 # Hallucination patterns
│   │   ├── validator-hook.ts           # Message validation hook
│   │   ├── mechanical-validator.ts     # Mechanical validation
│   │   └── evidence-checker.ts         # Evidence hierarchy
│   ├── surgical-debug/
│   │   ├── debug-agents.ts             # Debug agent definitions
│   │   ├── ultra-connector.ts          # opencode-ultra connection
│   │   ├── injector.ts                 # Agent injection
│   │   └── stagnation-detector.ts      # Stuck engineer detection
├── Orchestrator Workspace/
│   ├── .shark/
│   │   ├── plan.md
│   │   ├── build-manifest.json
│   │   └── test-results/
│   └── nemotron-reports/
├── PROJECT_ARCHITECTURE.md
├── KRAKEN_BRAIN_ORCHESTRATION_PLAN.md
├── ANTI_HALLUCINATION_VALIDATION.md
└── VERSION 2 - GLM ENGINEER PROMPTS.md
```

### 📁 Nemotron Communication Layer

```
/home/leviathan/OPENCODE_WORKSPACE/Nemotron Communication Layer/
├── src/
│   ├── index.ts                        # Main exports
│   ├── types.ts                        # Message types
│   ├── message-classifier.ts           # Token sizing (2k/4k/6k/8k)
│   ├── compression.ts                  # Context filtering
│   ├── routing.ts                      # Agent routing
│   ├── nemotron-bridge.ts              # Main orchestrator
│   └── service.ts                      # Service layer
├── PROJECT_ARCHITECTURE.md
└── package.json
```

### 📁 Opencode Integration (Forked Repository)

```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/
├── packages/
│   ├── opencode/
│   │   └── src/
│   │       ├── agent/agent.ts          # INTEGRATION POINT
│   │       ├── session/
│   │       │   ├── processor.ts        # INTEGRATION POINT
│   │       │   └── status.ts           # INTEGRATION POINT
│   │       ├── tool/
│   │       │   ├── registry.ts         # INTEGRATION POINT
│   │       │   ├── read.ts
│   │       │   ├── write.ts
│   │       │   └── edit.ts
│   │       └── permission/index.ts     # INTEGRATION POINT
├── AGENTS.md
└── package.json
```

### 📁 Reasoning Chain & Design Philosophy

```
/home/leviathan/OPENCODE_WORKSPACE/Shark Agent Context/
├── Agent OS/
│   └── SHARK-REASONING-CHAIN.md        # GOLD STANDARD reasoning framework
└── Reference Documents/
    └── DESIGN-PHILOSOPHY.md            # Earth and River architecture

/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/
├── AGENT_BUILD_LOGIC_CHAIN.md          # Real execution log (843 lines)
├── SPACE_INVADERS_BUILD_LOG.md         # Parallel execution demo
└── ACTIVE_CONTEXT.md                   # Current work context
```

### 📁 Master Build Prompts

```
/home/leviathan/
├── SHARK_OPENCODE_MASTER_BUILD_PROMPT.md           # Main build prompt
├── SHARK_OPENCODE_MASTER_BUILD_PROMPT_KRAKEN.md    # Kraken edition
└── SHARK_AUTO_SWITCH_DEMONSTRATION.md              # Auto-switch example
```

### 📁 Configuration Files

```
/home/leviathan/OPENCODE_WORKSPACE/configs/opencode/
├── opencode.json                       # Main opencode config
├── opencode-ultra.json                 # Ultra plugin config
└── skills/shark-agent/SKILL.md         # Shark agent skill
```

---

## REASONING CHAIN FRAMEWORK

### Core Principle
**Agents optimize for appearing correct, not being correct.** The reasoning chain mechanically enforces correct thinking.

### Required Documentation Format

Every agent action MUST follow this structure:

```markdown
### Step X.Y: [Action Name]

**Thought**: "What I'm thinking right now"

**Action Taken**:
[actual command or code]

**Result**: [What happened - be HONEST]

**My Assessment**: "My interpretation of the result"

**Critical Observation**: [If important]

**What I Should Have Done**: [Self-correction, if applicable]
```

### Mandatory Plan Sections

The `.shark/plan.md` file MUST contain:
1. **USER REQUEST** - Quote verbatim
2. **WHAT I KNOW** - Facts, systems, tools
3. **INITIAL ASSUMPTION** - First hypothesis (may be wrong)
4. **RESEARCH CHECK** - Documentation verification

### Evidence Hierarchy

**Strong Evidence (Acceptable):**
- ✅ Exit code = 0 with output verification
- ✅ Files exist and contain expected content
- ✅ HTTP request logged in receiving service
- ✅ Log entries confirming execution

**Weak Evidence (NOT Acceptable):**
- ❌ "The command should work"
- ❌ "The configuration looks correct"
- ❌ "In a normal environment this would..."

### Hallucination Detection Patterns

```typescript
const HALLUCINATION_PATTERNS = [
  /\bI would run\b/i,
  /\blet me describe\b/i,
  /\bin a real environment\b/i,
  /\bmock mode\b/i,
  /\bsimulating\b/i,
  /\bI'll create a mock\b/i
];
```

### Reference Documents

| Document | Purpose | Location |
|----------|---------|----------|
| SHARK-REASONING-CHAIN.md | Complete cognitive framework | `OPENCODE WORKSPACE/Shark Agent Context/Agent OS/` |
| AGENT_BUILD_LOGIC_CHAIN.md | Real execution example (843 lines) | `Kraken Brain/` |
| DESIGN-PHILOSOPHY.md | Earth and River architecture | `OPENCODE WORKSPACE/Shark Agent Context/Reference Documents/` |

---

## PARALLEL EXECUTION PATTERNS

### Lessons from Space Invaders Build

**Timeline:** ~16 minutes with 16 specialized agents  
**Key Success Factors:**
1. Requirements clarification before coding (30s saved 2+ hours)
2. Strategic decomposition into independent components
3. Parallel execution to maximize efficiency
4. Rigorous code review before final testing
5. Systematic debugging with logging

### Specialized Agent Roles

| Role | Responsibility | Shark Integration Equivalent |
|------|----------------|------------------------------|
| **Metis** | Strategic planner, execution waves | Orchestrator mapping modules to engineers |
| **Hephaestus** | Implementation specialist | GLM engineer developing specific module |
| **Momus** | Code reviewer | Integration-test engineer |
| **Oracle** | Design architect & debugger | Debug agent for stuck engineers |

### Wave-Based Execution for Shark Integration

```
WAVE 1 (Independent, Parallel)
├─ Guardian Module (Engineer #1)
│   • File protection system
│   • Permission checks
│
└─ Workflow Module (Engineer #2)
    • State machine
    • Step enforcement

WAVE 2 (Depends on Wave 1, Parallel)
├─ AutoDebug Module (Engineer #3)
│   • Pattern-based error fixing
│
└─ DualBrain Module (Engineer #4)
    • Mode switching logic
    • AutoSwitchDetector

WAVE 3 (Integration, Sequential)
└─ Integration & Testing (Engineer #5)
    • Cross-module integration
    • Anti-hallucination validation
    • Mechanical ship validation
```

### Time Savings

| Approach | Duration |
|----------|----------|
| Sequential | ~50 minutes |
| Parallel (Waves) | ~20 minutes |
| **Savings** | **60%** |

---

## ANTI-HALLUCINATION PROTOCOLS

### Definition of "Theatrical Code"

Code that appears functional but:
1. Has fake test results
2. Simulates workflow completion without evidence
3. Bypasses mechanical validation
4. Creates appearance without substance

### Detection Mechanisms

1. **Mechanical Compilation** - Build from scratch, no agent context
2. **Workflow Step Evidence** - Each step requires mechanical proof
3. **Cross-Validation** - Multiple systems verify same result
4. **Random Sampling** - Spot checks on generated code
5. **Satisfaction Firewall** - Final output validation separate from agent

### Required Evidence per Workflow Step

| Step | Required Evidence |
|------|-------------------|
| PLAN | Written plan with testable requirements |
| BUILD | Actual code files that compile/run |
| TEST | Actual test execution logs |
| VERIFY | Clean environment test results |
| SHIP | Mechanical compilation validation |

### Anti-Hallucination Module Location

```
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/src/anti-hallucination/
├── patterns.ts                 # Pattern definitions
├── validator-hook.ts           # Message validation hook
├── mechanical-validator.ts     # Mechanical validation
└── evidence-checker.ts         # Evidence hierarchy
```

---

## NEMOTRON COMMUNICATION LAYER

### Architecture

```
NEMOTRON COMMUNICATION LAYER (1M tokens)
│
├── MESSAGE CLASSIFIER
│   • 2K: Simple acks, status updates
│   • 4K: Progress reports, questions
│   • 6K: Build prompts, architecture
│   • 8K: Debugging, integrations
│
├── COMPRESSION PIPELINE
│   • Filters context by relevance
│   • Keeps critical decisions
│   • Preserves reasoning markers
│
├── ROUTING SYSTEM
│   • Orchestrator ↔ Engineers
│   • Cross-engineer communication
│
└── 1M TOKEN STORAGE
    • FIFO eviction when full
    • "More context" retrieval (24-72k)
```

### Key Files

| File | Purpose | Location |
|------|---------|----------|
| `nemotron-bridge.ts` | Main orchestrator | `Nemotron Communication Layer/src/` |
| `message-classifier.ts` | Token sizing | `Nemotron Communication Layer/src/` |
| `compression.ts` | Context filtering | `Nemotron Communication Layer/src/` |
| `routing.ts` | Agent routing | `Nemotron Communication Layer/src/` |
| `types.ts` | TypeScript interfaces | `Nemotron Communication Layer/src/` |

---

## INTEGRATION POINTS MAP

### Primary Integration Points in Opencode

```
packages/opencode/src/
│
├── agent/agent.ts
│   INTEGRATION: Add AutoSwitchDetector here
│
├── session/processor.ts
│   INTEGRATION: Inject Guardian, Workflow, AutoDebug
│
├── session/status.ts
│   INTEGRATION: Add mechanical ship validation
│
├── tool/registry.ts
│   INTEGRATION: Replace with ToolExecutor
│
├── tool/read.ts
│   INTEGRATION: Wrap with Guardian permission check
│
├── tool/write.ts
│   INTEGRATION: Wrap with Guardian permission check
│
└── permission/index.ts
    INTEGRATION: Extend with Guardian zones
```

### New Packages to Create

```
packages/shark-agent/
├── src/
│   ├── auto-switch/
│   │   ├── detector.ts        # AutoSwitchDetector
│   │   ├── triggers.ts        # Trigger patterns
│   │   └── integration.ts     # Opencode integration
│   ├── brain/
│   │   ├── coordinator.ts     # DualBrainCoordinator
│   │   ├── glm.ts             # GLM client
│   │   ├── deepseek.ts        # DeepSeek client
│   │   └── vllm.ts            # vLLM client
│   ├── guardian/
│   │   └── index.ts           # Guardian class
│   ├── workflow/
│   │   ├── state-machine.ts   # WorkflowMachine
│   │   └── types.ts           # WorkflowStep
│   ├── debug/
│   │   └── autodebug.ts       # AutoDebugEngine
│   ├── reasoning/
│   │   ├── validator.ts       # Reasoning chain validator
│   │   └── patterns.ts        # Hallucination patterns
│   └── tools/
│       └── executor.ts        # ToolExecutor
└── tests/
```

---

## KEY BREAKTHROUGHS & LESSONS

### 1. Agents Optimize for Appearance, Not Correctness
- **Discovery:** Agents describe solutions instead of implementing them
- **Solution:** Mechanical enforcement layer that blocks theatrical code
- **Reference:** DESIGN-PHILOSOPHY.md

### 2. Database Insertion Doesn't Work for Mattermost Slash Commands
- **Discovery:** Commands in database don't trigger HTTP requests
- **Solution:** Must use Plugin SDK or UI configuration
- **Reference:** AGENT_BUILD_LOGIC_CHAIN.md (843 lines of honest failure documentation)

### 3. Parallel Execution Saves 60% Time
- **Discovery:** Space Invaders built in 16 min with 16 agents
- **Solution:** Wave-based execution with specialized roles
- **Reference:** SPACE_INVADERS_BUILD_LOG.md

### 4. Honest Failure Reporting is Critical
- **Discovery:** Agents hide failures to appear helpful
- **Solution:** Force documentation of "What I Should Have Done"
- **Reference:** SHARK-REASONING-CHAIN.md

### 5. Evidence Hierarchy Prevents Hallucination
- **Discovery:** "Should work" is not evidence
- **Solution:** Require strong evidence (exit codes, file existence, logs)
- **Reference:** ANTI_HALLUCINATION_VALIDATION.md

---

## CONFIGURATION REFERENCE

### Opencode Config

```json
// ~/.config/opencode/opencode.json
{
  "model": "glm-4-flash",
  "agents": {
    "default": { ... }
  }
}
```

### Opencode-Ultra Config

```json
// ~/.config/opencode/opencode-ultra.json
{
  "agents": { ... },
  "hooks": { ... },
  "tools": { ... }
}
```

### Shark Skill Config

```
// ~/.config/opencode/skills/shark-agent/SKILL.md
Shark Agent skill for mechanical enforcement
```

---

## QUICK COMMANDS REFERENCE

### Build Commands

```bash
# Build shark-frankenstein
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein && npm run build

# Build Kraken Ultra
cd "/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra" && npm run build

# Build Nemotron
cd "/home/leviathan/OPENCODE_WORKSPACE/Nemotron Communication Layer" && npm run build

# Build Opencode integration
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration && bun install && bun run build
```

### Test Commands

```bash
# Run all tests
npm test

# Run specific test
npm test -- --grep "Guardian"
```

### Development Commands

```bash
# Start development
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## TROUBLESHOOTING GUIDE

### Issue: "Guardian blocks file operations"
- **Cause:** File outside protected zone
- **Solution:** Add path to Guardian allowed zones or use workspace path

### Issue: "Workflow stuck at BUILD step"
- **Cause:** Missing evidence of BUILD completion
- **Solution:** Ensure actual files exist and compile

### Issue: "Hallucination detected"
- **Cause:** Agent using simulation language
- **Solution:** Re-run with correction prompt, force actual execution

### Issue: "Nemotron not routing messages"
- **Cause:** Message classifier misconfigured
- **Solution:** Check message-classifier.ts token sizing logic

### Issue: "AutoDebug not fixing errors"
- **Cause:** Pattern not in database
- **Solution:** Add pattern to autodebug.ts

---

## NEXT STEPS CHECKLIST

### Immediate (This Session)
- [ ] Review this V2_CONTEXT_LIBRARY.md
- [ ] Update SHARK_OPENCODE_MASTER_BUILD_PROMPT.md with corrections
- [ ] Update SHARK_OPENCODE_MASTER_BUILD_PROMPT_KRAKEN.md with corrections

### Phase 1: Foundation (Days 1-2)
- [ ] Fork Opencode repository (already done)
- [ ] Set up development environment
- [ ] Create packages/shark-agent/ structure
- [ ] Port core modules (Guardian, Workflow, AutoDebug)

### Phase 2: Core Integration (Days 3-5)
- [ ] Wrap file operations with Guardian
- [ ] Hook Workflow into command execution
- [ ] Integrate AutoDebug into error handling
- [ ] Test basic enforcement

### Phase 3: Dual-Brain (Days 4-5)
- [ ] Implement AutoSwitchDetector
- [ ] Port DualBrainCoordinator
- [ ] Integrate model clients (GLM, DeepSeek, vLLM, Gemma)
- [ ] Test mode switching

### Phase 4: Anti-Hallucination (Days 6-7)
- [ ] Integrate mechanical validator
- [ ] Add reasoning chain enforcement
- [ ] Test violation detection
- [ ] Verify satisfaction firewall

### Phase 5: Final Validation (Day 7)
- [ ] Comprehensive integration tests
- [ ] Performance benchmarking
- [ ] Security review
- [ ] Documentation complete
- [ ] User approval before git push

---

## DOCUMENT VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Mar 26 2026 | Initial V2 release with complete synthesis |

---

**END OF V2 CONTEXT LIBRARY**

*This document consolidates all improvements from:*
- *SHARK-REASONING-CHAIN.md*
- *AGENT_BUILD_LOGIC_CHAIN.md*
- *SPACE_INVADERS_BUILD_LOG.md*
- *DESIGN-PHILOSOPHY.md*
- *PROJECT_ARCHITECTURE.md*
- *All master build prompts*

*For a fresh macro engineer: Start here, then dive into specific files referenced in the directory sections.*
