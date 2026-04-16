# knowledge-injector

**Type**: System Transform Hook
**Hook Key**: `systemTransform`
**Plugin**: Spider Agent
**Purpose**: Score and inject relevant knowledge entries into system prompt

---

## Hook Signature

```typescript
type KnowledgeInjectorHook = (sessionId: string, messages: Message[]) => Promise<Message[]>;
```

---

## Trigger Conditions

Fires during system prompt processing:
- Session start
- After phase transitions
- When context changes significantly

---

## What It Does

1. **Reads knowledge store**
   - Loads all entries from `.swarm/knowledge/`
   - Filters by current phase context

2. **Scores entries**
   - Relevance to current phase/task
   - Recency (newer entries weighted higher)
   - Type priority (decisions > patterns > lessons)

3. **Selects top entries**
   - Selects top 3-5 most relevant
   - Formats for injection

4. **Injects into system prompt**
   - Adds "Relevant Knowledge" section
   - Formats as bullet points with IDs

---

## Scoring Algorithm

```typescript
score = (
  relevance * 0.5 +      // Matches current context
  recency * 0.3 +        // Newer is better
  typeWeight * 0.2      // Decisions weighted highest
)
```

---

## Behavior

- **Does not block** — purely additive
- **Fails silently** — continues without injection if fails
- **Runs after** `system-enhancer`, `context-budget`

---

## State Mutations

None — reads from `.swarm/knowledge/` only.

---

## Source Reference

```typescript
export function createKnowledgeInjectorHook(directory) {
  return {
    systemTransform: async (sessionId, messages) => {
      const phase = getCurrentPhase();
      const entries = loadKnowledge(phase);
      const scored = scoreAndSort(entries, phase);
      const top = scored.slice(0, 5);
      return injectKnowledgeSection(messages, top);
    }
  };
}
```

---

## Related Hooks

- `system-enhancer` — Phase context
- `knowledge-curator` — Stores knowledge
- `context-budget` — Context warnings
