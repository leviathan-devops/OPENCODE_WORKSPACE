# SHARK AGENT V4 — Brain Models Reference

**Purpose:** T2 reference for model-agnostic brain configuration
**Usage:** Loaded on-demand via read_file, zero prompt overhead

---

## The Model-Agnostic Principle

**Shark V4 does not hardcode models.** The original Shark Agent used DeepSeek R1 for reasoning and Qwen for execution — but this coupling was a historical artifact, not a design requirement. Shark V4 defines brains by their **function** and **behavior**, not by specific model names.

A brain is defined by:
- **What it does** (reasoning vs execution vs enforcement)
- **How it behaves** (aggressive vs conservative vs watchdog)
- **What it owns** (domain ownership in StateStore)
- **What it reads** (read-only observation of other domains)
- **How it decides** (decision style, priority, override capability)

**The actual model used is a runtime configuration detail**, not an architectural constraint.

---

## Shark Micro Brain Configuration

### Plan Brain (Reasoning Brain)

```
ROLE: Strategic reasoning, analysis, planning
CONTEXT: T1 (identity + thinking) + T2 (full reference)

BEHAVIORAL CONFIG:
  decisionStyle: strategic
  priority: 90
  canOverride: false
  strategyDepth: deep
  coordinationStyle: precise

DOMAIN OWNERSHIP:
  Owns: plan-state, spec document
  Reads: execution-state (Build Brain output for verification)

TOOLS: analysis, planning, design, review, spec-generation
```

### Build Brain (Execution Brain)

```
ROLE: Mechanical execution, precise implementation
CONTEXT: T1 only (clean, no T2 by default)

BEHAVIORAL CONFIG:
  decisionStyle: mechanical
  priority: 80
  canOverride: false
  executionPrecision: exact
  autonomyLevel: zero (execute only, no reasoning)

DOMAIN OWNERSHIP:
  Owns: execution-state, artifact
  Reads: plan-state (Plan Brain spec for exact execution)

TOOLS: file-write, terminal, test-runner, build-checker
```

### Coordinator (Mechanical Switch)

```
ROLE: Flip between Plan and Build brains
CONTEXT: T1 for switching logic only

BEHAVIORAL CONFIG:
  switchingStyle: mechanical (not agent-driven)
  triggers: spec-complete, build-complete, test-complete, gate-passed
  enforcement: hard (cannot be bypassed by agent)

MECHANISM:
  → NOT "Build Brain decides it needs a new plan"
  → RATHER "Coordinator sees gate-passed signal, flips switch"
```

---

## Shark Macro Brain Configuration

### Execution Brain (Primary Agent)

```
ROLE: Primary autonomous execution, steamrolls the build
CONTEXT: T1 (clean identity) + injected context from Reasoning Brain

BEHAVIORAL CONFIG:
  decisionStyle: aggressive
  priority: 100 (highest)
  canOverride: true
  autonomyLevel: full (within scope)
  executionSpeed: fast
  aggressionLevel: high

DOMAIN OWNERSHIP:
  Owns: execution-state, quality-state
  Reads: plan-state, thinking-state (from Reasoning Brain)

TOOLS: all execution tools, file operations, terminal, build tools
```

### Reasoning Brain (Floating 2nd Brain / Context Bridge)

```
ROLE: On-demand intelligence, dynamic T1/T2 context management
CONTEXT: T1 + T2 (full reference, manages its own synthesis)

BEHAVIORAL CONFIG:
  decisionStyle: analytical
  priority: 90
  canOverride: false
  intelligenceStyle: on-demand (not continuous)
  contextManagement: active (monitors Execution T1 gaps)

DOMAIN OWNERSHIP:
  Owns: thinking-state, context-bridge
  Reads: ALL domains (read-only observation)

FUNCTIONS:
  1. Context Gap Detection
     - Monitors Execution Brain T1
     - Notices when Execution needs context it doesn't have
     - Gets missing T2 from knowledge base
     - Synthesizes relevant patterns
     - Injects into Execution Brain

  2. Auto-Debug (60% error auto-fix)
     - Analyzes error patterns from execution-state
     - Matches against known error signatures
     - Applies automatic fixes
     - Reports back to Execution Brain

  3. T2 Synthesis
     - Takes raw T2 from knowledge base
     - Synthesizes into context-relevant pieces
     - Delivers exactly what Execution needs
     - Removes context when no longer needed

TOOLS: knowledge-base, synthesis, injection, pattern-matching
```

### System Brain (Watchdog / Enforcer)

```
ROLE: Active derailment detection, real-time enforcement, gate evaluation
CONTEXT: T1 + T2 (enforcement rules, escalation protocols)

BEHAVIORAL CONFIG:
  decisionStyle: defensive
  priority: 80 (lowest — enforces, doesn't drive)
  canOverride: true (can block Execution if needed)
  vigilanceLevel: maximum
  threatSensitivity: high
  enforcementStyle: active (not passive)

DOMAIN OWNERSHIP:
  Owns: workflow-state, security-state
  Reads: ALL domains (read-only observation)

FUNCTIONS:
  1. Derailment Detection
     - Monitors all three brains for domain violations
     - Detects scope creep, guardian breaches
     - Catches premature "done" declarations
     - Identifies when brains drift from their roles

  2. Real-Time Fix Application
     - When derailment detected → applies fix immediately
     - Sends priority message to offending brain
     - Blocks until correction made
     - Reports to all brains

  3. Gate Enforcement
     - Evaluates gate criteria before phase transitions
     - Blocks transition until all criteria met
     - Collects evidence for evidence-type criteria
     - Can force auto-debug on failed gates

  4. Escalation Triggering
     - When auto-fix impossible → escalates to human
     - Formats escalation with full context
     - Provides recommended actions
     - Blocks further execution until resolved

TOOLS: guardian, gate-evaluator, evidence-collector, escalation-sender
```

---

## Brain Communication Patterns

### Micro: Sequential Handoff

```
Plan Brain ──────────────────────────────────────────────────────────►
  ↓ (spec complete)
  Coordinator flips switch
  ↓
Build Brain ──────────────────────────────────────────────────────────►
  ↓ (build complete)
  Coordinator flips switch
  ↓
Plan Brain (review) ────────────────────────────────────────────────►
```

### Macro: Parallel Peer Race

```
Execution Brain ────────────────────────────────────────────────────►
                  ▲
                  │ context injection
                  │
Reasoning Brain ─┼──── (monitors, synthesizes, injects)
                  │
                  │ priority messages
                  ▼
System Brain ─────┼──── (watches, enforces, blocks)
                  │
                  │ (gate signals)
                  │
                  └───────────────────────────────────────────────►
                       (synchronize at gates only)
```

---

## Model Selection Guidelines

| Brain | Recommended Model Traits | Why |
|-------|------------------------|-----|
| Plan Brain (Micro) | Strong reasoning, long context | Creates detailed specs |
| Build Brain (Micro) | Fast execution, precise output | Executes exactly |
| Execution Brain (Macro) | Autonomous agentic, fast | Steamrolls build |
| Reasoning Brain (Macro) | Strong synthesis, long context | T2 bridging, auto-debug |
| System Brain (Macro) | Rule-following, defensive | Enforces without overriding |

**Model-agnostic:** Any model with the right traits can fill any brain role. The architecture doesn't care about the model name — it cares about the behavior.

---

## Example Runtime Config

```json
{
  "shark": {
    "variant": "macro",
    "brains": {
      "execution": {
        "model": "claude-4-sonnet",
        "temperature": 0.3,
        "maxTokens": 8192
      },
      "reasoning": {
        "model": "deepseek-r1",
        "temperature": 0.5,
        "maxTokens": 16384
      },
      "system": {
        "model": "gpt-4.5",
        "temperature": 0.1,
        "maxTokens": 4096
      }
    },
    "guardian": {
      "level": "BALANCED",
      "workspacePath": "./project"
    },
    "gates": {
      "test": { "coverageFloor": 80 },
      "review": { "sastFailOn": "critical" }
    }
  }
}
```

---

*Brain Models Reference*
*Shark Agent V4 — T2 Reference*
