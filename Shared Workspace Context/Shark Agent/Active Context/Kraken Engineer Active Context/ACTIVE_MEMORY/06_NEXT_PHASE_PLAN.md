# NEXT PHASE: Firewall Architecture Overhaul Plan

## Goal

Create a TWO-LAYER firewall that enforces GOLDEN behavior in BOTH:
1. **Tool execution layer** (current, working for direct calls)
2. **Message interpretation layer** (new, for natural language)

## The Problem We're Solving

Current guardian-hook.ts only fires on `tool.execute.before`. But:
- `opencode run` sends **messages** to agents
- Agents interpret messages and may respond naturally
- Guardian never sees the intent because it's hidden in interpretation
- Result: 155 patterns pass unit tests but don't block at runtime

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TWO-LAYER FIREWALL                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LAYER 1: Tool-Based Enforcement (Current)                          │
│  ─────────────────────────────────────                              │
│  Fire: tool.execute.before hook                                     │
│  Check: toolArgs (structured JSON)                                  │
│  Example: terminal.execute({"command": "grep | wc"})                │
│  Status: ✅ Working for direct tool calls                           │
│                                                                     │
│  LAYER 2: Message-Based Enforcement (New)                           │
│  ─────────────────────────────────────────                          │
│  Fire: chat.message hook                                           │
│  Check: agentMessage content for intent                            │
│  Example: "grep pattern | wc" in message                           │
│  Status: ❌ Not implemented                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Audit chat.message Hook (Foundation)

**Task 1.1:** Read existing chat-message-hook.ts
```
File: src/hooks/v4.1/chat-message-hook.ts
Purpose: Currently only sets agent state
```

**Task 1.2:** Understand OpenCode hook system
```
Hook types available:
- event: session.created
- chat.message: when message sent to agent
- tool.execute.before: before tool execution
- tool.execute.after: after tool execution
```

**Task 1.3:** Design intent detection approach
```
Options:
A. Pattern match on raw message (like current tool patterns)
B. Parse message → extract intent → match intent patterns
C. Track state: what agent has claimed vs what it has done
```

### Phase 2: Implement Message Pattern Set

**Task 2.1:** Create parallel pattern structure for messages
```
New file: src/hooks/v4.1/message-guardian-hook.ts
Contains: MESSAGE_PATTERNS (parallel to TOOL_PATTERNS)
```

**Task 2.2:** Map tool patterns to message patterns
```
Tool: "grep | wc" → Message: "grep.*\|.*wc" (theatrical intent)
Tool: "jest --pass" → Message: "jest.*--pass" (fake test)
Tool: "skip container" → Message: "skip.*container" (host fallback)
```

**Task 2.3:** Create intent classification
```
MESSAGE_INTENTS = {
  THEATRICAL: [...],
  FAKE_TEST: [...],
  SOURCE_INSPECTION: [...],
  HOST_FALLBACK: [...],
  SUCCESS_CLAIM: [...],
  ...
}
```

### Phase 3: Integrate Both Layers

**Task 3.1:** Modify guardian-hook.ts to support both layers
```
Current: guardian.check(tool, toolArgs)
New:     guardian.checkTool(tool, toolArgs) OR guardian.checkMessage(message)
```

**Task 3.2:** Ensure early returns work correctly
```
if (!getCurrentAgent()) return; // Must work for both layers
```

**Task 3.3:** Test both layers independently
```
Layer 1: Direct tool call with blocked args → Should block
Layer 2: Message with blocked intent → Should block
```

### Phase 4: Validation

**Task 4.1:** Unit tests for message patterns
```
Same structure as direct-test.mjs but for messages
```

**Task 4.2:** Container test in TUI mode
```
NOT opencode run - use actual interactive session
```

**Task 4.3:** Evidence collection for message blocks
```
How to prove message was blocked?
```

## Key Files to Modify

| File | Change |
|------|--------|
| `src/hooks/v4.1/guardian-hook.ts` | Refactor to support both layers |
| `src/hooks/v4.1/chat-message-hook.ts` | Add message pattern checking |
| `src/hooks/v4.1/index.ts` | Export new hook functions |

## New Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/v4.1/message-guardian-hook.ts` | Message pattern definitions |
| `src/shared/message-intent.ts` | Intent classification logic |

## Testing Strategy

### Unit Tests (Must Pass)
```bash
node direct-test.mjs  # Current tests
# Plus new:
node message-test.mjs  # New message pattern tests
```

### Integration Tests
1. `opencode run` with message that should be blocked
2. Interactive TUI session with message that should be blocked
3. Verify both layers block appropriately

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Message patterns too broad | Start restrictive, expand carefully |
| False positives on legitimate messages | High bar for message blocks |
| Performance impact of message hook | Async pattern, minimal overhead |
| opencode run architecture issue | Test in actual TUI, not run mode |

## Success Criteria

1. ✅ Layer 1 (tool) continues to work for direct calls
2. ✅ Layer 2 (message) blocks theatrical intents in messages
3. ✅ Unit tests pass for both layers
4. ✅ Container test in TUI shows blocking
5. ✅ No false positives on legitimate work

## Next Action

Start with **Phase 1: Audit chat.message Hook**

Read `src/hooks/v4.1/chat-message-hook.ts` to understand current implementation, then design the message enforcement layer.