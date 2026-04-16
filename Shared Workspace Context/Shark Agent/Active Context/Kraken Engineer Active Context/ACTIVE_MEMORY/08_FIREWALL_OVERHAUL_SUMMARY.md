# FIREWALL ARCHITECTURE OVERHAUL — SUMMARY

## The Problem

Guardian-hook.ts (155 patterns) only fires on `tool.execute.before`. But `opencode run` sends messages, not tool calls. Agents interpret messages and respond naturally. Guardian never sees the intent.

**Result:** 17/17 unit tests pass, 0/0 container blocks work.

## The Solution: Two-Layer Firewall

```
LAYER 1 (Tool): tool.execute.before → toolArgs → BLOCK
LAYER 2 (Message): chat.message → agentMessage → BLOCK
```

## Plan Location

Full plan: `projects/shark-agent-v4/FIREWALL_ARCHITECTURE_OVERHAUL_PLAN.md`

## Quick Phases

1. **Phase 1:** Audit chat-message-hook.ts (1-2h)
2. **Phase 2:** Implement message patterns (2-3h)
3. **Phase 3:** Integrate both layers (1-2h)
4. **Phase 4:** Test in TUI (2-3h)

**Total:** 6-10 hours

## Key Files

| File | Action |
|------|--------|
| `src/hooks/v4.1/message-guardian-hook.ts` | CREATE |
| `src/hooks/v4.1/chat-message-hook.ts` | MODIFY |
| `src/hooks/v4.1/guardian-hook.ts` | REFACTOR |
| `message-test.mjs` | CREATE |

## Start Here

1. Read `src/hooks/v4.1/chat-message-hook.ts`
2. Create skeleton `message-guardian-hook.ts`
3. Implement THEATRICAL + FAKE_TEST patterns first
4. Test in actual TUI (not `opencode run`)