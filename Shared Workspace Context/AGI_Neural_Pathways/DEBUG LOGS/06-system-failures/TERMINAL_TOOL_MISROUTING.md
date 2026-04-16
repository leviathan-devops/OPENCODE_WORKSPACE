# SYSTEM FAILURE: Terminal Tool Misrouting — ROOT CAUSE FOUND

## Date: 2026-04-12

---

## CRITICAL DISCOVERY

**The `opencode run` command does NOT invoke tools directly. It sends messages to agents.**

When you run:
```bash
opencode run "terminal" --command "echo test"
```

OpenCode interprets this as:
1. Send message "terminal" to an agent
2. Agent decides what to do with the message
3. If message looks like a command, OpenCode checks if it's a registered command
4. "terminal" is NOT a registered command → Error: Command not found

**The error `Command not found: "echo test". Available commands: init, review` comes from OpenCode CORE, not any plugin.**

---

## Proof

### With --pure (no plugins):
```bash
opencode run "terminal" --command "echo test" --pure
→ Error: Command not found: "echo test". Available commands: init, review
```
(No plugins loaded, error still appears → OpenCode core issue)

### With Spider and Hermes disabled:
```bash
opencode run "terminal" --command "echo test" --agent shark
→ Error: Command not found: "echo test". Available commands: init, review, Hermes
```
(Error includes "Hermes" from kraken-agent which is still loaded)

---

## OpenCode run Architecture

```
opencode run "terminal" --command "echo test"
           │
           ▼
┌──────────────────────────────────────┐
│  CLI parses: message="terminal"      │
│  --command flag becomes part of args │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Message sent to AGENT                │
│  (NOT direct tool invocation)        │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Agent interprets "terminal"          │
│  → Thinks it's a Spider command      │
│  → or dispatches to command router   │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Command router checks if valid       │
│  "terminal" is NOT a valid command   │
│  → "Command not found" + help text  │
└──────────────────────────────────────┘
```

---

## Why This Is A System Design Issue

### Expected (What We Wanted)
```bash
opencode run "terminal" --command "echo test"
→ Directly calls terminal tool with {command: "echo test"}
→ Guardian hook intercepts
→ Pattern matching happens
```

### Actual (What Happens)
```bash
opencode run "terminal" --command "echo test"
→ Sends message "terminal" to agent
→ Agent never calls terminal tool
→ No guardian hook fires
→ Pattern matching never happens
```

---

## Impact on Firewall Testing

### CANNOT Test Via CLI
- L1 theatrical patterns — cannot test
- L2 fake test runner — cannot test
- L3-L5 patterns — cannot test
- Any pattern that depends on toolArgs

### Why opencode run exists
`opencode run` is designed for:
- Sending messages to agents
- Getting agent responses
- Interactive conversations

NOT for:
- Direct tool invocation
- Automated testing
- Firewall validation

---

## Real Testing Methods

### 1. Interactive Session (Works)
```bash
opencode
# In TUI, type naturally - agent will call tools
```

### 2. Container Testing (Full Isolation)
```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && opencode run 'execute terminal command: grep pattern | wc -l'"
```

### 3. Unit Test the Hook Directly
Write a test that imports `createGuardianHook` and calls it with mock inputs.

---

## What Was Disabled

### Plugins Disabled to Test
1. spider-agent — Disabled (was intercepting Spider commands)
2. Hermes Agent Plugin — Disabled (was intercepting Hermes commands)

### Still Enabled
- coding-subagents — Safe (no command interception)
- opencode-plugin-engineering — Safe (no command interception)
- kraken-agent — Still produces error
- shark-agent-v4.7-hotfix-v3 — Safe (our firewall)
- manta-agent — Safe
- opencode-watchdog — Safe

### The Error Persists
Even with Spider and Hermes disabled, the error persists because:
1. It's from OpenCode core command handling
2. `opencode run` sends messages, not tool calls
3. Agent never calls terminal tool directly

---

## Real Fix Required

OpenCode would need to provide:
```bash
opencode tool terminal --command "echo test"
```
Or a direct tool invocation syntax.

Without this, firewall testing must use:
1. Interactive sessions
2. Container testing
3. Direct unit tests

---

## Related Files

- `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/06-system-failures/TERMINAL_TOOL_MISROUTING.md`
- `/home/leviathan/.config/opencode/opencode.json` (Spider and Hermes disabled)
