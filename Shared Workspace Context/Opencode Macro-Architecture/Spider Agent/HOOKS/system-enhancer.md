# system-enhancer

**Type**: System Transform Hook
**Hook Key**: `systemTransform`
**Plugin**: Spider Agent
**Purpose**: Enhance system prompt with phase context, retrospectives, and relevant knowledge

---

## Hook Signature

```typescript
type SystemTransformHook = (sessionId: string, messages: Message[]) => Promise<Message[]>;
```

---

## Trigger Conditions

This hook fires when the system message is being processed, before the LLM receives it.

- **Fires on**: System message in the message array
- **Session start**: Yes
- **After phase transition**: Yes

---

## Input/Output

### Input

```typescript
interface SystemEnhancerInput {
  sessionId: string;
  messages: Message[];  // Full message array including system
}
```

### Output

Returns modified message array with enhanced system prompt injected.

---

## Enhancement Pipeline

The `system-enhancer` applies these enhancements in order:

### 1. Phase Context Injection

Reads `.swarm/plan.md` to extract:
- Current phase and tasks
- Completed tasks (checked items)
- Pending tasks (unchecked items)
- Current delegation target

### 2. Decision Drift Detection

Reads `.swarm/drift-report.json` if exists:
- Flags any decision drift from original plan
- Injects warning into system prompt

### 3. Activity Log Summary

Reads `.swarm/activity/` directory:
- Recent agent activities
- Tool usage patterns
- Identifies repeated failures

### 4. Retrospective Evidence

Reads `.swarm/evidence/retro-*.json`:
- Previous phase outcomes
- Lessons learned injected into current phase

### 5. Knowledge Injection

Reads `.swarm/knowledge/` for relevant entries:
- Scored by phase context
- Top 3-5 entries injected
- Decisions, patterns, and lessons

### 6. Adversarial Detection (optional)

Scans system prompt for:
- Prompt injection patterns
- Teleportation attacks
- Role-playing attacks

---

## Enforcement Points

This hook does NOT block — it only transforms/enriches. If enhancement fails:
- Logs error
- Returns original system prompt unchanged

---

## State Mutations

| Read | Write | Effect |
|------|-------|--------|
| `.swarm/plan.md` | None | Injects phase context |
| `.swarm/drift-report.json` | None | Injects drift warning |
| `.swarm/activity/` | None | Injects activity summary |
| `.swarm/evidence/retro-*.json` | None | Injects lessons |
| `.swarm/knowledge/` | None | Injects relevant entries |

---

## Execution Order

Runs first in the system transform pipeline. Other system transforms (if any) run after.

---

## Source Reference

From `system-enhancer.ts`:

```typescript
export function createSystemEnhancerHook(directory: string, config: Config) {
  return {
    systemTransform: async (sessionId: string, messages: Message[]) => {
      // 1. Read plan.md for phase context
      // 2. Read drift-report.json if exists
      // 3. Read activity logs
      // 4. Read retro evidence
      // 5. Score and inject knowledge
      // 6. Return enhanced system message
      
      return enhancedMessages;
    }
  };
}
```

---

## Related Hooks

- `context-budget` — Runs after, injects context usage warnings
- `knowledge-injector` — Complementary, focuses on knowledge retrieval
