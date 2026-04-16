# checkpoint

**Type**: Coordination tool
**Plugin**: Spider Agent
**Purpose**: Create, restore, list, or delete named checkpoints using git commits

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `action`, `label?` |
| Returns | `{ success, action, label?, sha?, message?, error?, checkpoints? }` |
| Errors | Invalid action, checkpoint not found |

---

## Purpose

The `checkpoint` tool provides git-based checkpointing for the Spider Agent workflow. It creates named snapshots using git commits, allowing the architect to save progress at key points and restore if needed.

Checkpoints are logged in `.swarm/checkpoints.json` and backed by actual git commits. This means checkpoints survive plugin restarts and can be restored even after the OpenCode session ends.

---

## Arguments

### `action` (enum) — **Required**

One of: `save`, `restore`, `list`, `delete`

### `label` (string) — Optional (required for `save` and `restore`)

The checkpoint name/label.

---

## Behavior

### `save` Action

1. Creates a git commit with the message `[checkpoint] {label}`
2. Reads existing `checkpoints.json` or creates new
3. Adds entry with label, SHA, timestamp
4. Writes updated `checkpoints.json`

**Returns**:
```json
{
  "action": "save",
  "success": true,
  "label": "before-refactor",
  "sha": "abc1234",
  "message": "Checkpoint created: before-refactor"
}
```

### `restore` Action

1. Looks up SHA for given label in `checkpoints.json`
2. Runs `git reset --soft {sha}` to reset to checkpoint
3. Preserves working tree (doesn't lose uncommitted changes)

**Returns**:
```json
{
  "action": "restore",
  "success": true,
  "label": "before-refactor",
  "sha": "abc1234"
}
```

### `list` Action

1. Reads `checkpoints.json`
2. Returns all checkpoints sorted by timestamp (newest first)

**Returns**:
```json
{
  "action": "list",
  "success": true,
  "checkpoints": [
    { "label": "phase-2-done", "sha": "def5678", "timestamp": "2026-04-03T10:00:00Z" },
    { "label": "before-refactor", "sha": "abc1234", "timestamp": "2026-04-03T09:00:00Z" }
  ]
}
```

### `delete` Action

1. Removes entry from `checkpoints.json`
2. Git commit is preserved (just removed from ledger)

**Returns**:
```json
{
  "action": "delete",
  "success": true,
  "label": "old-checkpoint"
}
```

---

## Implementation Note

```typescript
// Checkpoints stored in .swarm/checkpoints.json
interface Checkpoint {
  label: string;
  sha: string;
  timestamp: string;
}
```

Git commit is created with:
```bash
git add -A
git commit -m "[checkpoint] {label}"
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Primary caller — creates checkpoints before risky operations |
| **Architect** | Restores checkpoints when coder work needs to be undone |
| **Delegation Gate** | May require checkpoint before certain delegations |

---

## Usage Examples

```
/checkpoint action=save label="before-major-refactor"
```

```
/checkpoint action=restore label="before-major-refactor"
```

```
/checkpoint action=list
```

---

## Related Tools

- `save_plan` — Saves plan state (checkpoints save git state)
- `phase_complete` — Creates retrospective checkpoint
