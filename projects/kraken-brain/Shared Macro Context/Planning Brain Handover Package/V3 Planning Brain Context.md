# 🧠 V3 PLANNING BRAIN CONTEXT
## For Deepseek R1 Strategic Planning & Architecture Decisions

**Purpose:** This document provides the Deepseek R1 planning brain with FULL necessary context to make strategic decisions about the ToolExecutor Constitutional Anchor implementation. It synthesizes all critical information from source code, architecture documents, and build logs within 36k input tokens.

**Usage:** The planning brain should read this file FIRST for complete context. Only reference the source files listed at the end when needing to verify specific implementation details.

---

## 🔑 CORE INSIGHT: THE CONSTITUTIONAL ANCHOR

```
EVERY AGENT ACTION → ToolExecutor.executeTool() → [FIREWALL MESH] → EXECUTION
                           │
                           └── NO BYPASS PATH EXISTS
                           └── THIS IS THE CONSTITUTION
```

**Strategic Importance:** The ToolExecutor is the SINGLE CHOKEPOINT through which ALL agent tool calls flow (GLM, Gemma, DeepSeek, Hephaestus, etc.). This makes it the only point where we can enforce **unbypassable mechanical firewalls** - the "Earth Density" that directs AI autonomy like riverbanks direct water flow.

> Without Earth Density: "Big puddle with waves" - energy dissipates, no direction  
> With Earth Density: Water flows with purpose → Productive output (working software)

---

## 📊 CURRENT STATE ANALYSIS (FROM SOURCE CODE INSPECTION)

### ✅ ALREADY IMPLEMENTED (Working Correctly)
1. **Guardian Integration** (`executor.ts:12, 38, 44`)
   - Universal file protection with zone classification
   - Already connected and functioning

2. **WorkflowBlocker Integration** (`executor.ts:12, 38, 44, 101-114`)
   - **Contrary to some documentation, this IS connected!**
   - Lines 101-114: `executeWriteFile()` calls `this.workflowBlocker.blockWrite(filePath)`
   - Blocks writes to `src/` during PLAN step, allows during BUILD step
   - Returns clear workflow-blocked messages

3. **Basic Theatrical Detection** (`executor.ts:228-235`)
   - Warning-only detection in `executeRunCommand()`
   - Logs theatrical command patterns but doesn't block
   - Patterns: variable injection, piped shell, base64 decode, Python/Bash exec

### ❌ MISSING / NEEDS ENHANCEMENT
Despite WorkflowBlocker being connected, these systems need integration or enhancement:

| System/File | Status | Priority | What's Needed |
|-------------|--------|----------|---------------|
| **Audit Trail** | ❌ Missing | P0 | Log all tool calls, decisions, blocks to `.shark/firewall-audit.json` |
| **AutoDebug Engine** | ❌ Not Connected | P1 | Integrate pattern-based error fixing (60% auto-fix rate) |
| **Enhanced Theatrical Detection** | ⚠️ Partial | P2 | Scan FILE CONTENT for mock/simulate/placeholder (warn only) |
| **State Integrity** | ❌ Missing | P1 | Checksum verification + tamper detection on workflow state |
| **Command Restriction Matrix** | ⚠️ Basic | P1 | Step-specific allowed/disallowed commands + network exfiltration prevention |
| **Evidence Capture** | ⚠️ Basic | P2 | Strengthen exit code/output verification |
| **Claim Verification** | ❌ Missing | P3 | VERIFY step only: ensure code addresses claims.json |
| **Secret Detection** | ❌ Missing | P2 | Scan for hardcoded credentials in file writes |
| **Stagnation Detection** | ❌ Missing | P2 | Detect repeated failures, force approach change |
| **Intent Verification** | ❌ Missing | P3 | VERIFY step only: plan-to-code alignment scoring |

---

## 🏗️ STRATEGIC IMPLEMENTATION APPROACH

### **Philosophy: "Firewall Mesh, Not Wall"**
Instead of sequential checks (slow, creates bottlenecks), implement a **PARALLEL FIREWALL MESH**:
- All firewalls run CONCURRENTLY for performance
- Each firewall independently evaluates the tool call
- First BLOCKING decision wins (fail-fast)
- WARNINGS collected but don't block execution
- Audit trail records ALL decisions (allow/block/warn)

### **Priority Implementation Waves**

#### **WAVE 1: FOUNDATIONAL ANCHOR (Days 1-2)**
**Objective:** Establish constitutional baseline with audit capability
- ✅ **WorkflowBlocker**: Already connected - verify it's working correctly
- 🔧 **Audit Trail**: Implement constitutional logging of all tool decisions
- 🔧 **CLI Stats**: Add `--firewall-stats` showing blocks/hour, top violations
- 🔧 **Emergency Bypass**: `SHARK_SKIP_FIREWALLS=true` for YOLO mode override
- 📊 **Metrics**: Track block rate (<5% target), performance overhead (<50ms)

#### **WAVE 2: ERROR RESILIENCE (Days 3-4)**
**Objective:** Reduce agent frustration from common errors
- 🔧 **AutoDebug Integration**: Hook into command failures (executeRunCommand)
- 🔧 **Pattern Matching**: 47+ baked-in error patterns (Docker perms, npm EACCES, etc.)
- 🔧 **Auto-Fix**: 60% of errors resolved automatically with known fixes
- 🔧 **Learning**: Log new patterns for future updates
- 📊 **Metrics**: Target 60% auto-fix rate, reduced agent intervention

#### **WAVE 3: BEHAVIORAL GUARDS (Days 5-6)**
**Objective:** Prevent gaming the system while maintaining flow
- 🔧 **Stagnation Detection**: Track repeated failures (same command/tool 3x+)
- 🔧 **Escalation Protocol**: After 3 identical failures, alert orchestrator
- 🔧 **Graceful Reset**: Allow continuation but flag for investigation
- 🔧 **Progress Tracking**: Detect zero-progress periods (>1hr)
- 📊 **Metrics**: Reduce looping behavior, increase novel approach attempts

#### **WAVE 4: QUALITY GATES (VERIFY STEP ONLY - Days 7-8)**
**Objective:** Ensure quality without restricting BUILD flow
- 🔧 **Intent Verification**: VERIFY step only - plan-to-code alignment (AST comparison)
- 🔧 **Claim Verification**: VERIFY step only - track claims.json coverage
- 🔧 **Scope Creep Detection**: Flag unplanned features during VERIFY
- 🔧 **Evidence Strengthening**: Enhance exit code/output validation
- ⚠️ **CRITICAL**: These ONLY apply in VERIFY step - zero impact on BUILD/PLAN flow
- 📊 **Metrics**: >80% intent alignment required to ship, <5% false positives

#### **WAVE 5: SECURITY HARDENING (Days 9-10)**
**Objective:** Prevent catastrophic failures and data leaks
- 🔧 **Secret Detection**: Scan file writes for hardcoded credentials (regex patterns)
- 🔧 **State Integrity**: Checksum verification + tamper detection on workflow state
- 🔧 **Auto-Recovery**: Reset to PLAN on corruption + context capture
- 🔧 **Network Controls**: Prevent data exfiltration during sensitive steps
- 📊 **Metrics**: 0% secret leaks, 0% state tampering undetected

---

## ⚖️ CONSTRAINT COMPLIANCE MATRIX

| Constraint | GLM 5 Plan | Our Strategic Plan | Compliant? |
|------------|------------|-------------------|------------|
| **YOLO mode compatible** | ✅ (Minimal changes) | ✅ (Parallel mesh + emergency bypass) | ✅ |
| **Anti-slop focus** | ✅ (Warn only theatrical) | ✅ (Warn/file scan, block only secrets/system destruction) | ✅ |
| **Only block `rm -rf /` exact** | ✅ (System destruction only) | ✅ (Same + step-specific command matrices) | ✅ |
| **Theatrical patterns WARN only** | ✅ (Log warnings) | ✅ (Never block flow for theatrical - warn/log only) | ✅ |
| **Connect, don't create** | ✅ (Uses existing systems) | ✅ (Integrates 9 existing systems, minimal new code) | ✅ |
| **Audit trail** | ❌ Missing | ✅ (Constitutional log of all decisions) | ✅ |
| **Performance optimized** | ❌ Sequential checks | ✅ (Parallel execution, caching, lazy loading) | ✅ |
| **Error recovery** | ❌ None | ✅ (Graceful degradation, fallback modes) | ✅ |

---

## 🚦 CRITICAL ARCHITECTURAL DECISIONS

### 1. **Parallel vs Sequential Firewall Execution**
- **CHOICE**: Parallel (performance critical)
- **WHY**: 10 firewalls × 10ms avg = 100ms sequential → unacceptable latency
- **HOW**: `Promise.all([firewall1.check(), firewall2.check(), ...])`
- **MITIGATION**: Short-circuit on first block, continue warnings

### 2. **Audit Log Implementation**
- **CHOICE**: Structured JSONL + rotation
- **WHY**: Queryable, machine-readable, tamper-evident when combined with checksums
- **FORMAT**: 
  ```jsonl
  {"timestamp":"2026-03-27T10:30:00Z","tool":"write_file","path":"src/test.ts","agent":"GLM-5","workflowStep":"PLAN","blockedBy":"WorkflowFirewall","reason":"PLAN step restriction","success":false}
  ```
- **LOCATION**: `.shark/firewall-audit.log` (rotated daily/monthly)

### 3. **Error Handling & Graceful Degradation**
- **CHOICE**: Fail-open for availability, fail-secure for security
- **WORKFLOWBLOCKER FAILURE**: Log error, continue with Guardian only + warning
- **AUTODEBUG FAILURE**: Continue without auto-fix, log for investigation
- **AUDIT FAILURE**: Continue execution, buffer logs in memory, retry

### 4. **YOLO Mode Implementation**
- **MECHANISM**: Environment variable + CLI flag
- **BEHAVIOR**: 
  - `SHARK_SKIP_FIREWALLS=true`: All firewalls return PASS immediately
  - `shark --yolo`: Same effect for single session
  - **LOGGING**: Still audit all decisions (but mark as YOLO mode bypass)
- **PHILOSOPHY**: Preserve audit trail even in YOLO mode for post-analysis

### 5. **Theatrical Detection Scope**
- **CHOICE**: Content scanning (warn only) + command scanning (warn only)
- **WHY**: Catch simulated work in both code AND commands
- **IMPLEMENTATION**: 
  - File content: `/TODO|FIXME|HACK|XXX|mock.*mode|simulat|stub.*test|fake.*test/i`
  - Command content: Existing patterns in `executeRunCommand()`
- **OUTPUT**: `⚠️  Theatrical patterns detected: [list]` (never blocks)

### 6. **VERIFY-Step Only Firewalls**
- **CHOICE**: Restrict Intent/Claim verification to VERIFY step
- **WHY**: Zero impact on BUILD/PLAN agent flow and creativity
- **TRIGGER**: `currentStep === WorkflowStep.VERIFY` check
- **BENEFIT**: Agents free to experiment/build, quality gate only at end

---

## 📈 SUCCESS METRICS & KPIs

### Quantitative Targets
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Bypass Rate** | 0% | Audit log analysis for unauthorized state/command changes |
| **False Positive Rate** | <3% | User reports of blocked legitimate operations |
| **Performance Overhead** | <50ms/tool call | Benchmark with/without firewalls |
| **Auto-Fix Rate** | 60% | Auto-resolved errors / total errors |
| **Audit Completeness** | 100% | Every tool call logged in constitutional trail |
| **Test Coverage** | >90% | Jest coverage on firewall modules |

### Qualitative Targets
| Metric | Target | Assessment Method |
|--------|--------|-------------------|
| **Agent Flow** | Unimpeded creativity | Observe BUILD/PLAN step agent behavior |
| **Theatrical Reduction** | >80% decrease | Code review pre/post implementation |
| **Workflow Compliance** | 100% step adherence | State machine transition analysis |
| **User Trust** | Increased confidence | Feedback surveys, reduced intervention requests |
| **Debugging Speed** | Faster resolution | Mean time to resolution (MTTR) tracking |

---

## 🗺️ DEPLOYMENT ROADMAP

### **WEEK 1: FOUNDATION**
- **Mon-Tue**: Wave 1 - Audit trail, CLI stats, emergency bypass
- **Wed-Thu**: Wave 1 verification - manual tests, TypeScript compile, existing test pass
- **Fri**: Wave 1 integration - connect to all coordinators, end-to-end testing

### **WEEK 2: RESILIENCE**
- **Mon-Tue**: Wave 2 - AutoDebug integration, pattern matching, auto-fix
- **Wed-Thu**: Wave 2 verification - error injection tests, auto-fix validation
- **Fri**: Wave 2 performance - benchmarking, optimization

### **WEEK 3: BEHAVIORAL GUARDS**
- **Mon-Tue**: Wave 3 - Stagnation detection, escalation protocols
- **Wed-Thu**: Wave 3 verification - loop simulation, escalation testing
- **Fri**: Wave 3 integration - cross-wave testing, performance validation

### **WEEK 4: QUALITY & SECURITY**
- **Mon-Tue**: Wave 4 - VERIFY-step only firewalls (intent, claims)
- **Wed-Thu**: Wave 4 - Wave 5 - Security hardening (secrets, state integrity)
- **Thu-Fri**: Full system testing, documentation, knowledge transfer

### **POST-DEPLOYMENT**
- **Weekly**: Metrics review, false positive analysis, pattern updates
- **Monthly**: Architecture review, constraint compliance check
- **Quarterly**: Performance optimization, new firewall evaluation

---

## 📋 FILES FOR DIRECT REFERENCE (IF NEEDED)

The planning brain should ONLY reference these files directly when verifying specific implementation details. Otherwise, this context file provides sufficient information.

1. **`/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/tools/executor.ts`**
   - Verify current ToolExecutor implementation
   - Check lines: 12 (imports), 38-44 (constructor), 97-114 (executeWriteFile)
   - Lines 228-235 (theatrical command detection in executeRunCommand)

2. **`/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/workflow/blocker.ts`**
   - Understand workflow enforcement mechanics
   - Focus on `blockWrite()` method (lines 170-194)
   - Review `checkOperation()` and `blockPush()` for gate mechanics

3. **`/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/debug/autodebug.ts`**
   - Examine AutoDebug pattern database (lines 1208-1261)
   - Understand auto-fix mechanism (lines 1222-1233)
   - Review specific patterns like docker-volume-permission, npm-eacces

4. **`/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/src/anti-hallucination/patterns.ts`**
   - See theatrical detection patterns (61 lines total)
   - Note: Current implementation only scans commands, not file content

5. **`/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/workflow/state-machine.ts`**
   - Understand the "brick wall" thesis (lines 297-324)
   - Review 3-failure reset mechanism (lines 332-349)
   - Examine loop mechanist (lines 359-382)

---

## 🎯 STRATEGIC SUMMARY FOR DECISION MAKING

**The Opportunity:** We have a working foundation (WorkflowBlocker + Guardian already connected) but lack the comprehensive constitutional enforcement that makes the system truly unbypassable while preserving YOLO mode flow.

**The Strategy:** Implement a parallel firewall mesh that:
1. **Preserves autonomy** - Only blocks true system destruction (`rm -rf /` exact)
2. **Catches simulation** - Warns on theatrical code (never blocks flow)
3. **Ensures quality** - VERIFY-step gates for intent/claims (zero build impact)
4. **Provides visibility** - Complete audit trail of all decisions
5. **Reduces friction** - AutoDebug fixes 60% of common errors
6. **Prevents gaming** - Stagnation detection forces novel approaches
7. **Maintains integrity** - State checksums prevent tampering
8. **Enables oversight** - CLI stats and emergency bypass for control

**The Result:** A system where AI agents can be genuinely creative and autonomous within productive constraints, where theatrical behavior is visible but not blocked, and where shipping code requires genuine mechanical verification - not just agent claims.

**The Metric of Success:** When agents stop simulating work and start delivering working software because the system makes simulation harder than actual execution.

--- 
*Context synthesized from: SECURITY_AUDIT_WORKFLOW_ENFORCEMENT.md, TOOLEXECUTOR_CONSTITUTIONAL_ANCHOR.md, ToolExecutor Firewall Anchor.md, KRAKEN_BUILD_LOG.md, and direct inspection of source code files. Total tokens estimated: <32,000.*