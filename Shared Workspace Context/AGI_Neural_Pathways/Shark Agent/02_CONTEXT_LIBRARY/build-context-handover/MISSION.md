# MISSION — SHARK AGENT V4 V1.1

## The Goal
Transform Shark Agent V4 from a "shell" project (V1.0) into a functional, mechanically-enforced plugin (V1.1).

## Core Constraints

### 1. Mechanical Enforcement
The agent must not "decide" to follow the process; the process must be enforced by the runtime.
- **Guardian**: Must block dangerous commands before they execute.
- **Gates**: Must block phase transitions until evidence is collected.
- **Evidence**: Must be archived automatically after tool execution.

### 2. The Human is Out
The human is **never** part of the build loop.
- Failures $\rightarrow$ Auto-debug.
- Repeated failures $\rightarrow$ Escalate to Plan Brain.
- Plan Brain $\rightarrow$ Re-spec $\rightarrow$ Restart Build.

### 3. Zero Spillover (V4.1)
The plugin must be invisible to vanilla OpenCode agents.
- No hooks should fire for non-Shark agents.
- No state should leak between sessions.
- No system prompt injection for vanilla agents.

### 4. Iteration Protocol
- **Copy $\rightarrow$ Iterate $\rightarrow$ Swap**.
- Original files are preserved as `.v1.0.ts`.
- New files are created as `.v1.1.0.ts`.
- Swap occurs only after mechanical verification.

## Success Criteria
1. `bun build` produces a bundle containing all 5 required hooks.
2. `opencode --agent shark-micro` shows the tab toggle.
3. `shark-evidence --action status` returns valid JSON from the workspace.
4. `rm -rf /` is blocked by the Guardian hook.
5. 3 failed VERIFY attempts trigger an automatic escalation to PLAN (V1.1).
