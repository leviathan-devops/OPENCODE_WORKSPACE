# context-budget

**Type**: System Transform Hook
**Hook Key**: `systemTransform`
**Plugin**: Spider Agent
**Purpose**: Inject context usage warnings and compaction suggestions

---

## Hook Signature

```typescript
type ContextBudgetHook = (sessionId: string, messages: Message[]) => Promise<Message[]>;
```

---

## Trigger Conditions

Fires during system prompt processing:
- Session start
- After phase transitions
- Periodically during long sessions

---

## What It Does

1. **Analyzes context window usage**
   - Counts tokens/messages in current context
   - Estimates remaining capacity

2. **Detects budget pressure**
   - Warns at 70% capacity
   - Critical warning at 85%
   - Compulsion at 95%

3. **Injects advisory into system prompt**
   - Budget status
   - Suggested actions (compaction, summarization)

---

## Advisory Levels

| Level | Threshold | Message |
|-------|-----------|--------|
| OK | <70% | No advisory |
| Watch | 70-85% | Context at {n}%, consider compaction |
| Warning | 85-95% | High context usage, compaction recommended |
| Critical | >95% | Context nearly full, must compact |

---

## Behavior

- **Does not block** — purely advisory
- **Fails silently** — continues without warning if measurement fails
- **Runs after** `system-enhancer`

---

## State Mutations

None — reads context state only.

---

## Source Reference

```typescript
export function createContextBudgetHandler(directory, config) {
  return {
    systemTransform: async (sessionId, messages) => {
      const usage = analyzeContextUsage(messages);
      if (usage.percent > 0.7) {
        return injectBudgetWarning(messages, usage);
      }
      return messages;
    }
  };
}
```

---

## Related Hooks

- `system-enhancer` — Runs first, provides context
- `consolidateSystemMessages` — Reduces context waste
