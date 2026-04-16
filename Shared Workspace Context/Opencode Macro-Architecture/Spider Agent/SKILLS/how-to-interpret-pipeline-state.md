# How to Interpret the Pipeline State

## Reading /swarm status

```
$ /swarm status
Spider Agent Status:
- Phase: 3 (coder_delegated)
- Active Agent: coder
- Tasks: 7 total | 2 complete | 3 in progress | 2 blocked
- Context Budget: 62% used (warning threshold: 80%)
- Last Activity: 45 seconds ago
- Turbo: OFF
```

## Phase Numbers

| Phase | Name | Active Agent | Description |
|-------|------|--------------|-------------|
| 0 | idle | spider | No active task |
| 1 | exploring | explorer | Indexing project |
| 2 | planning | architect | Creating plan |
| 3 | coding | coder | Implementation |
| 4 | testing | test_engineer | Writing tests |
| 5 | review | reviewer | QA review |
| 6+ | complete | spider | Done |

## Task States

| State | Meaning |
|-------|---------|
| `pending` | Not started, waiting for dependencies |
| `in_progress` | Currently being worked on |
| `blocked` | Waiting on another task |
| `complete` | Finished and verified |
| `failed` | Attempted but failed (see evidence) |

## Context Budget Indicators

| Usage | Status | Action |
|-------|--------|--------|
| 0-80% | Normal | None |
| 80-95% | Warning | Consider `/swarm turbo off` to reduce activity |
| 95%+ | Critical | Automatic compaction may trigger |

## Active Agent Indicators

When Spider is coordinating:
- Shows as `spider` with `MODE: COORDINATING`

When delegating:
- Shows as `architect` with `MODE: DELEGATING`

When coding:
- Shows as `coder` with `MODE: CODING`

## Understanding Blockers

`/swarm status` shows blockers like:
```
Blocked Tasks:
- task-5: waiting on task-3 (API spec not ready)
- task-7: waiting on task-6 (tests not written)
```

To resolve, ensure the blocking task completes.

## Reading /swarm plan

```
$ /swarm plan
Phase 2: Planning
├── Task 2.1: Design API schema [IN_PROGRESS]
├── Task 2.2: Create data model [PENDING]
└── Task 2.3: Define auth flow [PENDING]
```

Shows hierarchical task structure.

## Evidence Indicators

When a task has evidence:
```
Task 3.2: [COMPLETE] ✓
  └─ Evidence: syntax_check, sast_scan, build_check
```

If a gate failed:
```
Task 3.2: [GATE_FAILED] ✗
  └─ Failed: build_check (exit code 1)
  └─ Evidence: build_log.txt
```

Run `/swarm evidence <taskId>` to view details.

## Drift Indicators

If critic detected drift:
```
⚠ DRIFT DETECTED
- Task 3.1 drifted from plan
- Run /swarm clarify to review
```

## Reading History

```
$ /swarm history
Phase 1: Exploring [COMPLETE] 2m 34s
Phase 2: Planning [COMPLETE] 5m 12s
Phase 3: Coding [IN_PROGRESS] 12m 45s
  └─ Current: task-3.2
```

Shows completed phases and cumulative time.

---

## Common State Patterns

### Healthy State
```
Phase: 3 (coding)
Tasks: 5 complete, 2 in progress, 0 blocked
Context: 55%
```

### Warning State
```
Phase: 3 (coding)
Tasks: 2 in progress, 3 blocked
Context: 82% ⚠
```

### Stuck State
```
Phase: 3 (coding) [STUCK]
Tasks: 0 complete, 1 in progress, 4 blocked >30min
Context: 91% ⚠
```
Run `/swarm diagnose` for diagnosis.

---

## State File Structure

`.Spider/state.json`:
```json
{
  "phase": 3,
  "activeAgent": "coder",
  "tasks": [...],
  "contextBudget": {
    "used": 0.62,
    "lastUpdated": "..."
  },
  "turbo": false
}
```

Don't edit manually unless debugging.
