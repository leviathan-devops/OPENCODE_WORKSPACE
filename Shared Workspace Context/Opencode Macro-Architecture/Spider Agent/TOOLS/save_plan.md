# save_plan

**Type**: Coordination tool
**Plugin**: Spider Agent
**Purpose**: Persist the execution plan to disk in both markdown and JSON formats

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `plan`, `version?`, `force?` |
| Returns | `{ success: boolean, path?: string, error?: string }` |
| Errors | Path traversal blocked, write failure |

---

## Purpose

The `save_plan` tool persists the architect's execution plan to the `.swarm/` directory. It writes two files simultaneously:
- `.swarm/plan.md` — Human-readable markdown format with checkboxes
- `.swarm/plan.json` — Machine-readable JSON for programmatic access

This is the primary mechanism for plan persistence. The architect creates or updates the plan via this tool, and other agents (reviewer, test_engineer) read it to understand what was agreed upon.

---

## Arguments

### `plan` (string) — **Required**

The plan content in markdown format. Should follow the Spider Agent plan structure:

```markdown
# Plan

## Phase 1: Discovery
- [ ] 1.1: Explore codebase structure
- [ ] 1.2: Identify entry points

## Phase 2: Implementation
- [ ] 2.1: Implement feature X
- [ ] 2.2: Add tests
```

### `version` (string) — Optional

Plan version identifier. Used for tracking iterations. If not provided, defaults to timestamp.

### `force` (boolean) — Optional

Overwrite existing plan without prompting. Default: `false`.

---

## Behavior

1. **Validation**
   - Validates `plan` is non-empty string
   - Performs path traversal checks (blocks `../` escapes)
   - Checks `directory` parameter is safe

2. **Write Operation** (Atomic)
   - Writes to `plan.md.tmp` and `plan.json.tmp` first
   - fsyncs to ensure durability
   - Atomically renames to final path

3. **JSON Generation**
   - Parses markdown checkbox format (`- [ ]` / `- [x]`)
   - Extracts phase and task structure
   - Generates `plan.json` with task IDs, statuses, metadata

---

## Implementation Note

```typescript
async execute(args: unknown, directory: string): Promise<string> {
  const { plan, version, force } = extractArgs(args);
  
  // Atomic write pattern
  const planPath = path.join(directory, '.swarm', 'plan.md');
  const tmpPath = planPath + '.tmp';
  
  await writeFile(tmpPath, plan, 'utf-8');
  await fsync(tmpPath);
  await rename(tmpPath, planPath);
  
  // Generate JSON from markdown
  const planJson = parseMarkdownPlan(plan);
  await writeFile(planJsonPath, JSON.stringify(planJson), 'utf-8');
  
  return JSON.stringify({ success: true, path: planPath });
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Primary caller — saves plan after planning phase |
| **Explorer** | Reads plan to understand scope |
| **Coder** | Reads plan to know what to implement |
| **Reviewer** | Reads plan.json to verify evidence against tasks |
| **phase_complete** | Updates task checkboxes when phase completes |

---

## Usage Example

```
/save_plan plan="# Implementation Plan

## Phase 1
- [ ] 1.1: Setup project structure
- [ ] 1.2: Configure testing

## Phase 2  
- [ ] 2.1: Implement core feature
" version="v1"
```

---

## Related Tools

- `update_task_status` — Updates individual task checkboxes
- `retrieve_summary` — Reads plan to generate phase summaries
- `phase_complete` — Marks phase done and generates retrospective
