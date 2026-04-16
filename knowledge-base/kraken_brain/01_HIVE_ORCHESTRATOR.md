# Kraken Brain - Hive Orchestrator Architecture

## Overview
Kraken Brain is the macro-orchestrator agent that coordinates a swarm of Shark agents to accomplish complex software engineering tasks. It implements a hierarchical intelligence system where a central brain (Kraken) manages multiple specialized worker agents (Sharks).

## Core Architecture: Three-Layer System

### Layer 1: DeepSeek Kraken Brain (Strategic Commander)
- **Role**: Central decision maker & coordinator
- **Model**: DeepSeek Reasoner (128K context window)
- **Responsibilities**:
  - High-level architecture decisions
  - Assigning GLM engineers to specific modules
  - Reviewing critical integration points
  - Managing overall build timeline (~1 week with 5 engineers)
  - Receiving filtered intelligence from Nemotron
  - Issuing commands through Nemotron bridge
- **Critical Constraint**: Must NOT absorb raw GLM engineer outputs (100K+ tokens every 10 minutes)

### Layer 2: Nemotron Context Bridge (Intelligence Firewall)
- **Role**: Context firewall & intelligence filter
- **Model**: Free model with 1M token context window
- **Responsibilities**:
  - Ingest ALL outputs from 5 GLM engineers
  - Maintain complete build context
  - Filter & compact information using:
    1. Criticality scoring (bug fixes > feature progress > routine updates)
    2. Dependency tracking (changes affecting other modules)
    3. Progress aggregation (daily summaries vs real-time minutiae)
    4. Decision distillation (extract key decisions for Kraken Brain)
  - Pass 1-2K token summaries to Kraken Brain
  - Relay Kraken Brain commands to GLM engineers
  - Maintain "ground truth" of build state
- **Implementation**: TypeScript-based context bridge with smart token sizing

### Layer 3: GLM 4.7 Engineers (Parallel Workforce)
- **Role**: Implementation workforce (5 parallel engineers)
- **Allocation**:
  1. Engineer #1: Guardian module integration
  2. Engineer #2: Workflow State Machine integration  
  3. Engineer #3: AutoDebug module integration
  4. Engineer #4: DualBrain Coordinator integration
  5. Engineer #5: Integration testing & verification
- **Work Pattern**: Parallel development on separate modules with daily sync via Nemotron

## Communication Architecture

### Token Flow Control
```
Raw GLM Outputs (100K+ tokens)
        ↓
[NEMOTRON BRIDGE - 1M tokens]
        │
        ├─ Store full context (900K+ tokens available)
        │
        └─ Extract essentials (1-2K tokens)
                ↓
    [KRAKEN BRAIN - 128K tokens]
```

### Compaction Algorithms
1. **Critical Event Detection**: Bugs, blockers, architecture decisions
2. **Progress Aggregation**: "Module X: 75% complete" vs detailed file lists
3. **Dependency Mapping**: Changes affecting other engineers
4. **Decision Logging**: Key choices for audit trail
5. **Anomaly Flagging**: Unexpected behaviors or errors

### Information Priority
- **CRITICAL**: Build failures, blocking issues, security concerns
- **HIGH**: Architecture changes, integration conflicts, major progress
- **MEDIUM**: Module completion milestones, test results
- **LOW**: Routine file edits, minor refactors, debugging details

## Workflow Orchestration

### Phase 1: Initialization (Day 0)
1. Kraken Brain creates master build prompt (updated)
2. Kraken Brain spawns Nemotron context bridge subagent
3. Nemotron initializes with 1M token context
4. Opencode-ultra spawns 5 GLM engineers with assigned modules
5. GLM engineers begin parallel development

### Phase 2: Daily Build Cycle (Days 1-7)
```
07:00 - GLM engineers report progress → Nemotron
08:00 - Nemotron compacts reports → 1K summary → Kraken Brain
09:00 - Kraken Brain reviews, issues commands → Nemotron
10:00 - Nemotron distributes commands → GLM engineers
10:00-18:00 - Parallel development continues
18:00 - End-of-day sync (repeat cycle)
```

### Phase 3: Integration & Testing (Day 7)
1. GLM engineers complete modules
2. Nemotron coordinates integration testing
3. Kraken Brain reviews final integration
4. System validates Shark Agent in Opencode
5. Documentation of successful integration

## Context Firewall Mechanics

### Problem Solved
Prevents Kraken Brain from being overwhelmed by raw GLM engineer outputs (100K+ tokens every 10 minutes would quickly exceed its 128K context window).

### Solution
Nemotron bridge acts as an intelligent filter that:
1. Stores the full context (1M tokens)
2. Extracts only essential information (1-2K tokens) for the Kraken Brain
3. Preserves ability to request "more context" (24-72K tokens) when needed
4. Maintains FIFO eviction when context storage exceeds 1M tokens

## Surgical Debugging Protocol

### Problem
Context Bridge Inefficiency for Debugging - Debugging through a context firewall adds latency and communication overhead.

### Solution
Direct Debugging Agent Deployment - When Nemotron detects bugs, Kraken Brain deploys surgical debugging agents directly into the GLM engineer's container.

### Trigger Conditions
1. Code Quality Degradation: Nemotron detects broken/invalid code patterns
2. Build Failures: Compilation/test failures persisting >30 minutes
3. Progress Stagnation: Engineer stuck on same problem >1 hour
4. Complexity Threshold: Problem exceeds single-engineer capability
5. Explicit Request: Engineer requests debugging assistance

### Deployment Mechanism
```
Nemotron detects bug → Flags as [DEBUG_NEEDED] → Kraken Brain receives alert
    ↓
Kraken Brain selects debug agent type → Deploys via opencode-ultra
    ↓
Debug agent injected into engineer's container → Direct code access
    ↓
Parallel debugging session begins → Real-time collaboration
```

### Debug Agent Types
1. **DeepSeek Chat**: General debugging, logic analysis, architecture review
2. **Fresh GLM Model**: Language-specific debugging, code pattern matching
3. **Specialized Debugger**: Module-specific expertise (Guardian, Workflow, etc.)
4. **AutoDebug Agent**: Pattern-based error fixing from Shark systems

### Exit Criteria
Debug agent disengages when:
1. Bug Fixed: Root cause identified and resolved
2. Workaround Established: Temporary solution allows progress to continue
3. Escalation Needed: Problem requires architectural change (goes to Kraken Brain)
4. Time Limit: 2-hour maximum debugging session
5. Engineer Request: Original engineer resumes solo work

## Visibility & Control Layers

### Layer 1: Kraken Brain (Strategic)
- High-level progress (module completion %)
- Critical issues & blockers
- Architecture decisions
- Timeline adjustments
- Resource allocation

### Layer 2: Nemotron (Tactical)
- Full build context (all files, all changes)
- Detailed progress tracking
- Error logs & debugging
- Integration testing results
- Dependency graphs

### Layer 3: GLM Engineers (Operational)
- Code implementation details
- File-level changes
- Unit test results
- Debugging sessions
- Module-specific decisions

## Deployment Sequence

### Step 1: Knowledge Base Setup
- Update critical context documents to survive compaction
- Create Nemotron bridge configuration
- Finalize GLM engineer assignments

### Step 2: Nemotron Bridge Deployment
- Spawn Nemotron subagent with 1M token context
- Configure context filtering rules
- Test communication with Kraken Brain
- Establish GLM engineer monitoring

### Step 3: GLM Engineer Launch
- Use opencode-ultra to spawn 5 GLM 4.7 engineers
- Assign modules based on expertise
- Distribute master build prompt
- Begin parallel development

### Step 4: Orchestration Loop
- Establish daily sync rhythm
- Test context filtering efficiency
- Adjust compaction algorithms as needed
- Monitor token usage (target: <2K tokens/hour to Kraken Brain)

## Risk Mitigation

### Risk 1: Context Overflow to Kraken Brain
**Mitigation**: Strict 2K token limit on Nemotron→Kraken updates

### Risk 2: GLM Engineer Misalignment
**Mitigation**: Daily syncs + dependency tracking in Nemotron

### Risk 3: Nemotron Bridge Failure
**Mitigation**: Periodic ground truth snapshots + fallback logging

### Risk 4: Integration Conflicts
**Mitigation**: Dependency-aware scheduling + integration testing phase

## Success Metrics
1. Kraken Brain token usage: <2K tokens/hour from Nemotron
2. Build progress: 5 modules completed in ~1 week
3. Integration success: Shark Agent fully operational in Opencode
4. Context preservation: All critical decisions retained through compaction
5. Orchestration efficiency: Minimal manual intervention required

## Anti-Hallucination Protocols
Requires mechanical evidence at each phase:
- **PLAN**: Written plan file, specific/testable requirements, dependencies identified
- **BUILD**: Actual code files, compilation successful, TypeScript types valid
- **TEST**: Test execution logs, coverage metrics, edge case testing
- **VERIFY**: Clean environment results, no agent context, reproducible
- **SHIP**: Mechanical compilation from scratch, fresh dependency install, complete integration test

Detection mechanisms include mechanical compilation, workflow evidence, cross-validation, random sampling, and satisfaction firewall (no self-validation).

## Files & References
Key files in `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/`:
- `Kraken Ultra/PROJECT_ARCHITECTURE.md` - Master architecture
- `Kraken Ultra/KRAKEN_BRAIN_ORCHESTRATION_PLAN.md` - Detailed orchestration plan
- `Shared Macro Context/PROJECT_ARCHITECTURE.md` - Shared architecture
- `Shared Macro Context/KRAKEN_BUILD_LOG.md` - Complete development chronicle
- `Kraken Ultra/Orchestrator Workspace/TOOLEXECUTOR_CONSTITUTIONAL_ANCHOR.md` - Workflow enforcement anchor
- `Kraken Ultra/Orchestrator Workspace/SECURITY_AUDIT_WORKFLOW_ENFORCEMENT.md` - Security audit