# evidence_check

**Type**: Coordination tool
**Plugin**: Spider Agent
**Purpose**: Verify that required evidence exists for completed tasks

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `required_types?` |
| Returns | `{ completedTasks, tasksWithFullEvidence, completeness, gaps }` |
| Errors | None (best-effort) |

---

## Purpose

The `evidence_check` tool verifies that completed tasks have the required evidence collected. It reads the `.swarm/plan.md` to find completed tasks, then checks for evidence files in `.swarm/evidence/` for each task.

This is the primary mechanism for the QA gate — the architect calls `evidence_check` before marking a phase complete to ensure all required reviews and tests were performed.

---

## Arguments

### `required_types` (string) — Optional

Comma-separated list of required evidence types. Default: `"reviewer,test_engineer"`

Supported types:
- `reviewer` — Code review evidence
- `test_engineer` — Test evidence  
- `architect` — Architect approval
- `sme` — SME consultation
- `critic` — Critic review

---

## Returns

```typescript
{
  completedTasks: { taskId: string, taskName: string }[],
  tasksWithFullEvidence: string[],
  completeness: number,  // 0.0 to 1.0
  requiredTypes: string[],
  gaps: {
    taskId: string,
    taskName: string,
    missing: string[],
    present: string[]
  }[]
}
```

### Example Output

```json
{
  "completedTasks": [
    { "taskId": "1.1", "taskName": "Setup project" },
    { "taskId": "2.1", "taskName": "Implement feature" }
  ],
  "tasksWithFullEvidence": ["1.1"],
  "completeness": 0.5,
  "requiredTypes": ["reviewer", "test_engineer"],
  "gaps": [
    {
      "taskId": "2.1",
      "taskName": "Implement feature",
      "missing": ["test_engineer"],
      "present": ["reviewer"]
    }
  ]
}
```

---

## Behavior

1. **Parse completed tasks** — Reads `plan.md`, extracts tasks with `- [x]` checkbox
2. **Check evidence directory** — For each completed task, looks for `.swarm/evidence/{taskId}/*.json`
3. **Normalize types** — Maps legacy types (review → reviewer, test → test_engineer)
4. **Compute gaps** — Identifies which required evidence is missing

---

## Implementation Notes

Evidence files stored as:
```
.swarm/evidence/
├── 1.1/
│   ├── reviewer.json
│   └── test_engineer.json
└── 2.1/
    └── reviewer.json   # missing test_engineer.json
```

Legacy format (flat) also supported:
```
.swarm/evidence/
├── review-1.1.json
└── test-2.1.json
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Calls before phase_complete to verify QA gates |
| **Reviewer** | Writes evidence after completing review |
| **test_engineer** | Writes evidence after running tests |
| **phase_complete** | Fails if evidence_check shows gaps |

---

## Usage Example

```
/evidence_check
```
Returns completeness report.

```
/evidence_check required_types="reviewer,test_engineer,architect"
```
Check with custom required types.

---

## Related Tools

- `phase_complete` — Fails if evidence gaps exist
- `write_retro` — Writes retrospective evidence
- `write_drift_evidence` — Writes drift verification evidence
