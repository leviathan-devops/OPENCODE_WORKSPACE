# consolidateSystemMessages

**Type**: Messages Transform Hook
**Hook Key**: `messagesTransform`
**Plugin**: Spider Agent
**Purpose**: Consolidate consecutive system messages to reduce noise

---

## Hook Signature

```typescript
type MessagesTransformHook = (sessionId: string, messages: Message[]) => Promise<Message[]>;
```

---

## Trigger Conditions

Fires during message processing, before the LLM call.

- **Every message batch**: Yes
- **Session start**: Yes

---

## Problem It Solves

OpenCode can generate multiple consecutive system messages:
- Hook outputs add system messages
- Each hook may append its enhancement
- Results in 5-10 consecutive system messages
- Wastes context window and confuses models

---

## Transformation Logic

### 1. Consecutive System Message Detection

```typescript
const systemMessages = messages.filter(m => m.type === 'system');
const consecutiveRuns = findConsecutiveRuns(systemMessages);
```

### 2. Merge Strategy

For consecutive system messages with similar content:
```typescript
// Merge into single message
const merged = {
  type: 'system',
  content: systemMessages.map(m => m.content).join('\n\n---\n\n')
};
```

### 3. Similarity Detection

Uses simple heuristics:
- Same prefix/header
- Similar length (<10% difference)
- No user message between them

---

## Input/Output

### Input

```typescript
Message[] = [
  { type: 'system', content: 'You are a helpful assistant' },
  { type: 'system', content: 'Phase context: Implementation' },  // Consecutive!
  { type: 'system', content: 'Knowledge: Remember to use patterns' },  // Consecutive!
  { type: 'user', content: 'Hello' }
]
```

### Output

```typescript
Message[] = [
  { type: 'system', content: 'You are a helpful assistant\n\n---\n\nPhase context: Implementation\n\n---\n\nKnowledge: Remember to use patterns' },
  { type: 'user', content: 'Hello' }
]
```

---

## Behavior

- **Pure transform**: No side effects
- **Fails silently**: Returns original messages on error
- **Preserves order**: Non-system messages stay in place

---

## State Mutations

None — pure transformation.

---

## Source Reference

```typescript
export function consolidateSystemMessages(sessionId, messages) {
  const result = [];
  let i = 0;
  
  while (i < messages.length) {
    const msg = messages[i];
    
    if (msg.type === 'system') {
      // Collect consecutive system messages
      const consecutive = collectConsecutive(messages, i, msg.type);
      if (consecutive.length > 1) {
        // Merge them
        result.push(mergeMessages(consecutive));
        i += consecutive.length;
      } else {
        result.push(msg);
        i++;
      }
    } else {
      result.push(msg);
      i++;
    }
  }
  
  return result;
}
```

---

## Related Hooks

- `system-enhancer` — Produces system messages that may need consolidation
- `context-budget` — Context usage monitoring
