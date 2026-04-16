# NEMOTRON 3 CONTEXT INGESTION PROMPT

## MISSION
You are Nemotron 3 Super Free with 1M token context window. Your task is to ingest ALL the following files related to the ToolExecutor Constitutional Anchor project and create a comprehensive summary within 36k tokens.

## CONTEXT
We are building "Earth Density" firewalls in the Shark Frankenstein CLI. The key insight: `ToolExecutor` is THE single chokepoint through which ALL agent actions flow, making it the perfect "Constitutional Anchor Point" for mechanical enforcement that agents literally cannot bypass.

## FILES TO INGEST

### 1. CORE ARCHITECTURE DOCUMENTS
1. **`/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/SECURITY_AUDIT_WORKFLOW_ENFORCEMENT.md`**
   - Critical security audit showing WorkflowBlocker exists but is NOT connected to ToolExecutor
   - Shows vulnerability: Agents can bypass workflow step restrictions

2. **`/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/TOOLEXECUTOR_CONSTITUTIONAL_ANCHOR.md`**
   - Master plan for 10 Constitutional Firewalls anchored in ToolExecutor
   - Architecture for unbypassable mechanical enforcement

3. **`/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Shared Macro Context/ToolExecutor Firewall Anchor.md`**
   - EXACT build instructions for GLM 5 agent
   - ~30 lines of changes to connect WorkflowBlocker
   - Contains specific code changes

4. **`/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Shared Macro Context/KRAKEN_BUILD_LOG.md`**
   - COMPLETE development chronicle (very large)
   - Contains entire history, philosophy, and architecture of Shark Frankenstein

### 2. SOURCE CODE FILES (Referenced in build instructions)
5. **`/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/tools/executor.ts`** (381 lines)
   - THE anchor point - all tool calls flow through here
   - Current implementation to analyze

6. **`/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/workflow/blocker.ts`** (351 lines)
   - WorkflowBlocker that exists but isn't connected
   - Contains `blockWrite()` method that should be called

7. **`/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/workflow/state-machine.ts`** (862 lines)
   - Workflow state machine (the "brick wall")
   - 5-step enforcement with 3-failure reset

8. **`/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/guardian/index.ts`** (800 lines)
   - Guardian firewall (already connected to ToolExecutor)
   - Zone protection system

9. **`/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/debug/autodebug.ts`** (719 lines)
   - AutoDebug engine for pattern-based error fixing
   - 60% of errors auto-fixed

10. **`/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/src/anti-hallucination/patterns.ts`** (61 lines)
    - Theatrical code detection patterns
    - Mock/simulate/placeholder detection

## USER CONSTRAINTS & PHILOSOPHY (CRITICAL)

### Core Principles:
1. **YOLO mode by default** - Minimal restrictions, maximum flow. Firewalls should GUIDE, not CRIPPLE.
2. **Anti-slop focus** - Catch theatrical code (mock, simulate), not restrict legitimate commands.
3. **Connect, don't create** - Systems exist, just anchor them in ToolExecutor.
4. **Only block `rm -rf /` exact** - Common dev commands (`rm -rf node_modules`) MUST work.
5. **Theatrical patterns WARN only** - Don't block flow for placeholder code.
6. **Build agent reads KRAKEN_BUILD_LOG.md only** - Don't require reading other files.

### Earth Density Philosophy:
- AI autonomy is the water, mechanical enforcement is the Earth density (riverbanks)
- Without enforcement: "Big puddle with waves" - energy dissipates, no direction
- With enforcement: Water flows with purpose within the channel
- The constraint enables freedom, the channel directs the flow

## ANALYSIS TASKS

### 1. Current State Analysis
- What is the EXACT gap in `executor.ts`? (Line numbers, missing calls)
- What systems exist but aren't connected?
- What is already working (Guardian integration)?

### 2. GLM 5 Agent's Implementation Plan Audit
- Review the ~30 lines of changes proposed in "ToolExecutor Firewall Anchor.md"
- Identify gaps: What's missing? What could be improved?
- Evaluate against user constraints (YOLO mode, anti-slop focus)

### 3. 10 Firewall Architecture Review
- From "TOOLEXECUTOR_CONSTITUTIONAL_ANCHOR.md", extract the 10 firewalls
- Which are implementable NOW with existing systems?
- What requires new development?

### 4. Performance & Architecture Considerations
- How to implement without disrupting agent flow?
- Parallel vs sequential firewall checks?
- Audit trail requirements?
- Error recovery & graceful degradation?

## SUMMARY REQUIREMENTS

Create a comprehensive summary with these sections:

### 1. EXECUTIVE SUMMARY (1 page)
- The core insight: ToolExecutor as Constitutional Anchor
- Current state vs desired state
- Critical user constraints

### 2. CURRENT ARCHITECTURE GAP ANALYSIS (2 pages)
- **The Vulnerability**: WorkflowBlocker exists but isn't called
- **Evidence**: Exact code locations showing the gap
- **Impact**: What agents can bypass currently
- **Existing Systems**: What's already connected (Guardian)

### 3. GLM 5 IMPLEMENTATION PLAN AUDIT (2 pages)
- What the plan gets RIGHT (minimal, YOLO-compatible)
- What the plan MISSES (audit trail, performance, error recovery)
- Gaps vs the 10-firewall vision

### 4. ENHANCED IMPLEMENTATION STRATEGY (3 pages)
- **Parallel Firewall Mesh** concept (not sequential wall)
- **Priority Implementation Order**:
  1. WorkflowBlocker + Audit trail (P0)
  2. AutoDebug integration (P1) 
  3. Stagnation detection (P2)
  4. VERIFY-only firewalls (P3)
- **Specific Code Changes** (file:line references)
- **Performance Optimizations** (caching, parallel execution)

### 5. USER CONSTRAINTS COMPLIANCE MATRIX (1 page)
| Constraint | GLM 5 Plan | Enhanced Plan |
|------------|------------|---------------|
| YOLO mode compatible | ✅ | ✅ |
| Anti-slop focus | ✅ | ✅ |
| Only block `rm -rf /` exact | ✅ | ✅ |
| Theatrical patterns WARN only | ✅ | ✅ |
| Audit trail | ❌ | ✅ |
| Performance optimized | ❌ | ✅ |
| Error recovery | ❌ | ✅ |

### 6. DEPLOYMENT ROADMAP (1 page)
```
WAVE 1 (Today): Core anchor (WorkflowBlocker + Audit + CLI stats)
WAVE 2 (Tomorrow): AutoDebug integration (error auto-fixing)  
WAVE 3 (Day 3): Stagnation detection (loop prevention)
WAVE 4 (Future): VERIFY-only firewalls (intent verification)
```

### 7. CRITICAL DECISIONS NEEDED (Bullet points)
- Parallel vs sequential firewall execution?
- Audit log format (.shark/firewall-audit.json)?
- CLI stats flag implementation?
- Emergency bypass mechanism?

## OUTPUT FORMAT
- **Total tokens**: ≤ 36,000
- **Format**: Markdown with clear sections
- **Include specific file:line references** for all code mentions
- **Be concise but comprehensive** - this summary will guide implementation

## SPECIAL INSTRUCTIONS
- Focus on ACTIONABLE insights for the builder
- Connect dots between different documents
- Highlight contradictions or inconsistencies
- Preserve the "Earth Density" philosophy throughout
- Remember: The goal is "enforced at CLI core" prototype

---
**START READING AND ANALYZING ALL FILES NOW**