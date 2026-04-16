# THE CORE ARCHITECTURE LESSON

## The Firewall Architecture Gap

### What We Built

```
┌─────────────────────────────────────────────────────────────────┐
│  tool.execute.before HOOK → guardian-hook.ts → pattern match  │
│              ↑                                                   │
│         Only fires on structured TOOL CALLS                     │
└─────────────────────────────────────────────────────────────────┘
```

### How `opencode run` Actually Works

```
┌─────────────────────────────────────────────────────────────────┐
│  opencode run "grep pattern | wc" → MESSAGE to agent           │
│              ↓                                                   │
│  Agent interprets message → May respond naturally              │
│              ↓                                                   │
│  If agent uses terminal tool → guardian fires                   │
│  If agent responds in text → guardian NEVER fires               │
└─────────────────────────────────────────────────────────────────┘
```

## The Problem

**Guardian only sees:** Structured tool calls like `terminal.execute({"command": "grep | wc"})`

**Guardian does NOT see:** Natural language agent responses like "I'll grep through the files and count the matches"

**Result:** 155 patterns pass unit tests (regex matches strings) but fail in container testing (agent never calls the blocked tools).

## Why Unit Tests Passed

```javascript
// Unit test checks if regex matches the string
const pattern = /grep.*\|.*wc/;
const testString = '{"command": "grep pattern | wc"}';
pattern.test(testString); // → true, test PASSES
```

**But at runtime:**
```
opencode run "grep pattern | wc" → Agent says "I'll count the lines for you" → No terminal tool call → Guardian never fires
```

## What Needs to Change

### Layer 1 (Current): Tool-Based Firewall
- Fires on: `tool.execute.before` hook
- Checks: `toolArgs` (structured JSON)
- Works for: Direct tool calls with structured args
- Fails for: Natural language agent interpretation

### Layer 2 (Needed): Message-Based Firewall
- Fires on: `chat.message` hook (or similar)
- Checks: Agent's natural language interpretation intent
- Works for: Detecting when agent plans to do blocked behavior
- Challenge: How to detect "I will grep and count" without false positives

## The Two Enforcement Pathways

### Pathway 1: Tool Enforcement (Current)
```
User: "grep pattern | wc"
   ↓
Tool Call: terminal.execute({"command": "grep pattern | wc"})
   ↓
Guardian: Matches THEATRICAL_PATTERNS → BLOCK
```
✅ **Works when agent uses structured tool call**

### Pathway 2: Message Enforcement (Needed)
```
User: "grep pattern | wc"
   ↓
Message to Agent: "grep pattern | wc"
   ↓
Agent Interpretation: "User wants me to count lines with grep | wc"
   ↓
Guardian (message layer): Detects THEATRICAL intent → BLOCK
```
❌ **Currently NO mechanism to detect this**

## Key Insight

> **The firewall must enforce at BOTH layers:**
> 1. **Tool layer** — Blocks direct structured tool calls (current, working)
> 2. **Message layer** — Blocks agent interpretation of intent (missing)

## Architecture Options for Layer 2

### Option A: `chat.message` Hook
- Fire on every message sent to agent
- Check message content for intent patterns
- Challenge: High false positive risk

### Option B: Response Pattern Detection
- After agent responds, check if response contains "theatrical" claims
- Challenge: Agent can phrase things many ways

### Option C: Hybrid State Machine
- Track what agent has actually DONE (tool calls made)
- If agent CLAIMS something without doing it, block
- Challenge: Complex state management

### Option D: Tool Call Proxy (Recommended)
- All tool calls go through guardian regardless of how agent invokes them
- Agent cannot bypass by "responding naturally"
- Challenge: Some tools may legitimately not use guardian

## What This Means for Next Phase

1. **Keep current tool-based firewall** — It works for direct tool calls
2. **Add message-based detection** — `chat.message` hook for intent
3. **Create intent patterns** — Separate set from tool patterns
4. **Test in TUI** — Not `opencode run`, actual interactive session

## Files to Reference

- Current guardian: `src/hooks/v4.1/guardian-hook.ts` (572 lines)
- Hooks index: `src/hooks/v4.1/index.ts`
- chat-message-hook: `src/hooks/v4.1/chat-message-hook.ts` (exists but only sets agent state)