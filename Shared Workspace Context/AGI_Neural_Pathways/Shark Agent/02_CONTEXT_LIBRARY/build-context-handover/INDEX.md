# SHARK AGENT V4 — BUILD HANDOVER CONTEXT

**Status**: ACTIVE BUILD
**Current Version**: V1.0 (Inert) $\rightarrow$ Target: V1.1 (Functional)
**Build Path**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/`

---

## 1. Mission Overview

The goal is to transform Shark Agent V4 from a "shell" (V1.0) into a "mechanical enforcer" (V1.1). 

**V1.0 State**: The classes (Guardian, GateManager, EvidenceCollector) exist, but they are not wired into the OpenCode runtime. The plugin is inert.
**V1.1 Goal**: Wire these primitives into OpenCode hooks so that the agent is mechanically forced to follow the gate chain and collect evidence.

### Success Criteria
- [ ] **Guardian Blocks**: `tool.execute.before` blocks dangerous commands and path violations.
- [ ] **Gates Advance**: `tool.execute.after` advances gates based on tool results.
- [ ] **Evidence Collected**: Work products are archived to `{workspace}/.shark/evidence/`.
- [ ] **Context Injected**: `chat.system.transform` injects current gate/iteration state into the prompt.
- [ ] **No Spillover**: Vanilla OpenCode agents are completely unaffected by the plugin.
- [ ] **Iteration Loop**: 3 VERIFY failures $\rightarrow$ escalate to PLAN (V1.0 $\rightarrow$ V1.1).

---

## 2. Architecture Reference

### The Gate Chain
`PLAN` $\rightarrow$ `BUILD` $\rightarrow$ `TEST` $\rightarrow$ `VERIFY` $\rightarrow$ `AUDIT` $\rightarrow$ `SHIP`

### The Brains (Macro Mode)
- **Execution Brain**: Primary BUILD+TEST agent.
- **Reasoning Brain**: Context bridge + auto-debug. Primary during VERIFY.
- **System Brain**: Watchdog + VERIFY+AUDIT+SHIP enforcer.
- **Plan Brain**: Spec owner + escalation target.

### V4.1 Safety Guardrails (MANDATORY)
- **Agent Awareness**: Every hook must check `ctx.isMyAgent()`.
- **Session Isolation**: State must be per-session via `ctx.getSessionState()`.
- **Declarative Filtering**: Use `agentFilter` in `safeHook` options.

---

## 3. Handover Map

| Document | Purpose | Path |
|----------|----------|------|
| **MISSION** | Goal, constraints, success criteria | `MISSION.md` |
| **ARCHITECTURE** | V4.1 patterns, Brains, Gates, Guardian | `ARCHITECTURE.md` |
| **BUILD_STATE** | Current progress, file versions, missing pieces | `BUILD_STATE.md` |
| **FIX_SEQUENCE** | Step-by-step implementation plan for V1.1 | `FIX_SEQUENCE.md` |
| **VERIFICATION** | Pre- and post-build mechanical checks | `VERIFICATION_PROTOCOL.md` |
| **GUARDRAILS** | Detailed V4.1 safety rules | `REFERENCE/V4_1_GUARDRAILS.md` |

---

## 4. Critical Warnings for the Next Agent

1. **NEVER OVERWRITE**: Follow the Iteration Protocol. Copy $\rightarrow$ Iterate $\rightarrow$ Swap.
2. **NO GLOBALS**: Never use bare module-level globals for session state. Use `ctx.getSessionState()`.
3. **NO SPILLOVER**: If a vanilla agent sees "Shark" instructions, the build is a failure.
4. **WORKSPACE PATHS**: Use `process.cwd()` for evidence and state. Never use `input.directory`.
5. **SURE-FIRE BUILD**: Always run `bun build` and `grep` the bundle for hook strings before registering.

---

## 5. Quick Start for New Agent

1. Read `MISSION.md` and `ARCHITECTURE.md`.
2. Review `BUILD_STATE.md` to see where the previous agent left off.
3. Follow `FIX_SEQUENCE.md` step-by-step.
4. Verify each step using `VERIFICATION_PROTOCOL.md`.
5. Swap files and build.
