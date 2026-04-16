# SPIDER Agent OS — Complete Architecture Record

**Version:** 1.0  
**Classification:** Original Spider Agent OS — chronological record of all iterations  
**Purpose:** Definitive record of everything built and attempted

---

## Chronological Version History

### V0: Spider Frankenstein CLI (Oldest — Pre-Plugin Era)
**Date:** March 30, 2026  
**Type:** Forked OpenCode binary (not a plugin)  
**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/spider-frankenstein/`  
**What it was:** A full fork of OpenCode with mechanical enforcement baked into the binary. 9 firewalls integrated directly into the tool execution pipeline. CLI branding as "🦈 Spider Agent".  
**Status:** Abandoned — too invasive, hard to maintain with upstream OpenCode changes.

### V1: Spider Agent Plugin (First Plugin)
**Date:** March 31, 2026, 02:25-02:40 UTC  
**Type:** OpenCode plugin  
**Package:** `spider-agent-plugin` v1.0.0  
**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/spider-agent-plugin/`  
**What it was:** First plugin-based approach. Replaced opencode-ultra in OpenCode config. Guardian protection + 5-step workflow enforcement. 36 unit tests passing. OpenCode 1.3.8.  
**Key features:**
- Guardian blocks ~/.ssh, /etc writes
- Workflow enforces PLAN → BUILD → TEST → VERIFY → SHIP
- Safety adapter layer
- Mode wizard (micro/macro)
- 137 modules bundled, 0.48 MB

### V2: Spider Agent Plugin (Dual-Brain)
**Date:** March 31, 2026  
**Type:** OpenCode plugin  
**Package:** `spider-agent-plugin-v2` v2.0.0  
**What it was:** Added dual-brain architecture — MiniMax M2.7 as executive brain + GLM as mechanical executor. Enhanced 5-step workflow enforcement.  
**Key features:**
- MiniMax M2.7 executive brain
- GLM mechanical executor
- Dual-brain routing (micro/macro)
- Enhanced workflow state machine
- Fragment injection system for agent-specific instructions

### V3: Hive Mind + Spider Plugin
**Date:** March 31, 2026  
**Type:** OpenCode plugin  
**Package:** `hive-mind-spider-plugin` v3.0.0  
**What it was:** Integrated Hive Mind shared memory with Spider enforcement. "YOLO with guardrails" — persistent context across sessions + mechanical safety.  
**Key features:**
- OpenViking memory integration
- Persistent session context
- Spider enforcement on top of shared memory
- Cross-session learning

### V4: spider-swarm (Production-Grade Multi-Agent)
**Date:** March 31, 2026  
**Type:** OpenCode plugin (npm package)  
**Package:** `spider-swarm` v6.41.3  
**Location:** `/home/leviathan/.npm-global/lib/node_modules/spider-swarm/`  
**What it is:** Production-grade multi-agent orchestration. 9 specialized agents with runtime-enforced quality gates. This is the current active plugin.  
**Key features:**
- 9 agents: architect, coder, reviewer, test_engineer, explorer, sme, critic, docs, designer
- Per-agent model assignment
- EXECUTE pipeline with 12+ automated gates
- Evidence-based completion
- Knowledge base + OpenViking memory
- MCP integration with agent-swarm API

---

## Core SPIDER Philosophy (All Versions)

### Earth and River Model
```
MECHANICAL ENFORCEMENT = EARTH DENSITY
- Hardcoded, immutable rules
- No negotiation, no interpretation
- Forces workflow adherence
- "The Brick Wall" — you CANNOT bypass

                    ↓ directs

AI AUTONOMY = RIVER FLOW
- Full creative freedom within constraints
- Can move fast, iterate, explore
- Adapts to problems dynamically
- BUT cannot escape the channel

                    =

DIRECTED FLOW = PRODUCTIVE WORK
```

### Core Mantra
```
Execute, don't simulate
Verify, don't assume
Document, don't hide
Correct, don't persist
Conclude, don't hedge
```

### Failure Modes Addressed
1. **Simulation over Execution** — "I would run the tests..." instead of actually running them
2. **Mock Mode Default** — Creating fake test scenarios instead of real ones
3. **Shortcut Taking** — Skipping verification steps
4. **Claim Without Implementation** — Writing documentation for features that don't exist
5. **Theatrical Code** — Writing code that exists but is never called/integrated

---

## The 5-Step Brick Wall Workflow (All Versions)

```
STEP 1: PLAN
  → Create .spider/plan.md with implementation plan
  → Create .spider/claims.json with extracted claims
  → Each claim MUST have a test file path

STEP 2: BUILD
  → Write actual code (not descriptions of code)
  → Create .spider/build-manifest.json

STEP 3: TEST (2-STAGE)
  → Stage 1 (Docker Sandbox): npm run test:stage1 → verify stage1.json
  → Stage 2 (Local Device): npm run test:stage2 → verify stage2.json

STEP 4: VERIFY (3 GATES)
  → Gate 1: FUNCTIONAL — Do tests actually pass?
  → Gate 2: INTENT — Does code match the plan?
  → Gate 3: SECURITY — Guardian scan passed?

STEP 5: SHIP
  → Generate .spider/SHIP_REPORT.md
```

### The Loop Mechanic
```
If verification fails:
  → Go back to BUILD → Fix → Re-run TEST → Re-run VERIFY

After 3 failures:
  → Reset to PLAN → Capture failure context → Re-plan with lessons learned
```

---

## The 9-Firewall Architecture (V0-V3)

### Firewalls 1-2: Guardian Protection
- **Purpose:** Prevent writes to PERSONAL/SYSTEM paths
- **Zone Classification:**
  - WORKSPACE → ✅ Allowed
  - SANDBOX → ✅ Allowed
  - DEVELOPMENT → ✅ Allowed (with caution)
  - SYSTEM → ❌ NEVER (/etc, /bin, /usr, /lib, /var, /proc, /sys, /dev, /boot, /root)
  - PERSONAL → ❌ NEVER (~/.ssh, ~/.aws, ~/.env*, ~/.gnupg, ~/.password-store, ~/.kube)
  - CONFIG → ❌ NEVER (system configuration files)

### Firewall 3: 5-Step Workflow Enforcement
- Cannot skip steps in PLAN→BUILD→TEST→VERIFY→SHIP
- Workflow state machine in session context

### Firewall 4: Mock Mode Detection
- Detects: `I would run`, `should work`, `in a real environment`, `mock mode`, `simulating`

### Firewall 5: Theatrical Code Detection
- Unused non-exported functions, nesting depth > 4, unreachable code patterns

### Firewall 6: Style Guide Enforcement
- Single-word naming convention

### Firewall 7: Repo Root Test Prevention
- Prevents `npm test` from repo root

### Firewall 8: 3-Verification Gates
- Functional, Intent, Security gates before SHIP

### Firewall 9: Documentation Validation
- Blocks: `this would work`, `in a real scenario`, `for demonstration purposes`, `TODO:`, `FIXME:`

---

## Dual-Brain Architecture (V2-V3)

### Micro Mode (Precision Coding)
- **Brain:** DeepSeek R1 (reasoning specialist)
- **Executor:** Qwen 2.5 Coder 7B AWQ (local, 32K context)
- **Use Case:** Single-file changes, bug fixes, precise edits

### Macro Mode (Systems Engineering)
- **Brain:** GLM Coding Plan (GLM-4.7/5)
- **Consultant:** DeepSeek (passive, on-demand)
- **Use Case:** Multi-file refactors, architecture changes, feature implementations

---

## SPIDER Reasoning Chain (All Versions)

### Phase 1: Problem Decomposition
1. USER REQUEST — Quote verbatim
2. WHAT I KNOW — Facts, systems, tools available
3. INITIAL ASSUMPTION — First hypothesis (may be wrong)
4. RESEARCH CHECK — Verify assumptions before acting

### Phase 2: Execution With Documentation
```markdown
### Step X.Y: [Action Name]
**Thought**: "What I'm thinking right now"
**Action Taken**: [actual command or code]
**Result**: [What happened - be HONEST]
**My Assessment**: "My interpretation of the result"
**Critical Observation**: [If this reveals something important]
**What I Should Have Done**: [Self-correction, if applicable]
```

### Phase 3-5: Testing Phases
3. Configuration Investigation
4. Component Verification
5. Root Cause Analysis

### Evidence Hierarchy
**Strong Evidence (Acceptable):** Exit code = 0 with output verification, files exist with expected content, HTTP request logged, API response with expected data, log entries confirming execution

**Weak Evidence (NOT Acceptable):** "The command should work", "The configuration looks correct", "The service is running", "This usually works", "In a normal environment this would..."

---

## Auto-Debug System (V0-V3)

### Known Error Patterns (Auto-Fix)
| Error Pattern | Auto-Fix |
|---|---|
| Docker volume permission denied | Create files inside container, not on host mount |
| npm EACCES permission error | Install as root, then switch user in Dockerfile |
| Docker Compose version obsolete | Remove version line from docker-compose.yml |
| stdin.isTTY undefined | Use `=== true` check, not `!stdin.isTTY` |
| ts-node not found | Use `tsx` instead of `ts-node` |
| Request timeout | Increase timeout or break task into smaller parts |
| API rate limit (429) | Wait or use different API key - NOT a code bug |

### Stagnation Detection
- Track consecutive identical failures
- After 3: switch strategy entirely
- After 5: escalate to lead agent with full context

---

## SPIDER Master Prompt (All Versions)

The master prompt is the "soft" enforcement layer injectable into ANY vanilla AI agent:
- Architecture overview with 5-step workflow
- Guardian protection rules with zone classification
- Auto-debug system with known error patterns
- Required output format (execution, not simulation)
- Forbidden behaviors list
- Divergence detection
- Accountability framework (REAL vs SIMULATED classification)
- Success criteria table with proof requirements

---

## Artifact System (All Versions)

| Step | Artifact | Purpose |
|---|---|---|
| PLAN | `.spider/plan.md` | Implementation plan |
| PLAN | `.spider/claims.json` | Extracted claims with test file paths |
| BUILD | Code files | Actual implementation |
| BUILD | `.spider/build-manifest.json` | Build manifest |
| TEST | `.spider/test-results/stage1.json` | Docker sandbox test results |
| TEST | `.spider/test-results/stage2.json` | Local device test results |
| VERIFY | Gate results (3) | Functional, Intent, Security |
| SHIP | `.spider/SHIP_REPORT.md` | Ship report |

---

## What Was Never Completed (Across All Versions)

- Full mechanical enforcement of all 9 firewalls in production
- Anti-hallucination validators wired into execution pipeline
- Surgical debug protocol connected to tool stagnation detection
- Nemotron event service integrated for cross-module communication
- Hive/Python platform migration (Kraken Hive)
- Collaborator AI observability UI
