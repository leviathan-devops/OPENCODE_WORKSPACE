# knowledge-curator

**Type**: Tool After Hook
**Hook Key**: `toolAfter`
**Plugin**: Spider Agent
**Purpose**: Extract and store knowledge from tool outputs

---

## Hook Signature

```typescript
type KnowledgeCuratorHook = (input: ToolInput, output: ToolOutput) => Promise<void>;
```

---

## Trigger Conditions

Fires after evidence-generating tools:
- `evidence_check`
- `complexity_hotspots`
- `detect_domains`
- `co_change_analyzer`
- Analysis tools that produce notable findings

---

## What It Does

1. **Extracts knowledge candidates**
   - From evidence check results
   - From analysis findings
   - From review outputs

2. **Validates candidates**
   - Ensures not duplicate
   - Checks relevance threshold
   - Validates format

3. **Stores valid knowledge**
   - Writes to `.swarm/knowledge/`
   - Creates `{type}-{timestamp}.json` files

---

## Extraction Patterns

| Tool | Knowledge Type | Content |
|------|---------------|---------|
| `complexity_hotspots` | pattern | "High complexity in {path}: {suggestion}" |
| `detect_domains` | context | "Domain boundaries: {domains}" |
| `evidence_check` | context | "QA gaps found: {gaps}" |
| `reviewer` | pattern | "Pattern found: {pattern}" |

---

## Knowledge Entry Format

```typescript
interface KnowledgeEntry {
  id: string;
  type: 'decision' | 'pattern' | 'context' | 'lesson';
  content: string;
  source: string;  // Tool that generated it
  taskId?: string;
  phase: string;
  timestamp: string;
  validated: boolean;
}
```

---

## Behavior

- **Fails silently** — logs error, continues if curation fails
- **Does not block** — advisory only
- **Deduplicates** — won't store exact duplicate

---

## State Mutations

| Read | Write | Effect |
|------|-------|--------|
| Tool output | `.swarm/knowledge/*.json` | Stores entries |

---

## Source Reference

```typescript
export function createKnowledgeCuratorHook(directory) {
  return {
    toolAfter: async (input, output) => {
      const candidates = extractKnowledgeCandidates(input, output);
      for (const candidate of candidates) {
        if (isValid(candidate) && !isDuplicate(candidate)) {
          await writeKnowledgeEntry(candidate);
        }
      }
    }
  };
}
```

---

## Related Hooks

- `knowledge-injector` — Retrieves curated knowledge
- `dark-matter-detector` — Detects unresolved items
- `system-enhancer` — Uses knowledge for context
