# dark-matter-detector

**Type**: Tool After Hook
**Hook Key**: `toolAfter`
**Plugin**: Spider Agent
**Purpose**: Remind about unresolved gaps from planning (dark matter)

---

## Hook Signature

```typescript
type DarkMatterHook = (input: ToolInput, output: ToolOutput) => Promise<void>;
```

---

## Trigger Conditions

This hook is **rate-limited**: it only fires every 10th tool call.

This prevents noise while still surfacing unresolved items periodically.

---

## Purpose

During planning, items may be identified as "dark matter" — known gaps, TODOs, or unresolved questions that aren't captured in the formal plan. This hook periodically reminds the agent about these items.

---

## Input/Output

### Reads

- `.swarm/dark-matter.md` — Markdown file containing unresolved items

### Output

Logs a reminder message with:
- Count of unresolved items
- First 3 item descriptions

---

## Dark Matter File Format

```markdown
# Dark Matter

## Unresolved
- [ ] API design: Should we use REST or GraphQL?
- [ ] Performance: Need to benchmark current implementation
- [ ] Security: Token storage strategy not finalized

## Done
- [x] Database choice: PostgreSQL selected
```

---

## Behavior

1. **Rate Limiting**
   - Counts tool calls
   - Fires only when count % 10 === 0

2. **Dark Matter Parsing**
   - Reads `.swarm/dark-matter.md`
   - Extracts unchecked items as unresolved
   - Ignores checked items

3. **Reminder Injection**
   - Logs warning: `"Dark matter reminder: {n} unresolved items"`
   - Lists first 3 unchecked items
   - Suggests addressing if relevant to current work

---

## Advisory Behavior

Does NOT throw. Logs warning and continues.

---

## State Mutations

None — reads only.

---

## Source Reference

```typescript
export function createDarkMatterDetectorHook(directory: string) {
  let toolCallCount = 0;
  
  return {
    hook: async (input, output) => {
      toolCallCount++;
      if (toolCallCount % 10 !== 0) return;
      
      const darkMatter = readDarkMatterFile(directory);
      const unresolved = parseUnresolved(darkMatter);
      
      if (unresolved.length > 0) {
        logWarning(`Dark matter reminder: ${unresolved.length} unresolved items`);
        logWarning(`First 3: ${unresolved.slice(0, 3).join(', ')}`);
      }
    }
  };
}
```

---

## Related Hooks

- `slop-detector` — Detects code quality issues
- `knowledge-curator` — Stores discovered knowledge
- `brainstorm-gate` — Phase 0 enforcement
