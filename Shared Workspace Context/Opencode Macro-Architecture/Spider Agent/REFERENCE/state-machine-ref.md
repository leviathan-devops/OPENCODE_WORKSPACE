# Spider Agent Pipeline State Machine

## States

```
┌─────────┐
│  idle   │ ← Initial state, no active task
└────┬────┘
     │ start / new task
     ▼
┌─────────────┐
│  exploring  │ ← Explorer indexes project structure
└──────┬──────┘
       │ explorer completes
       ▼
┌─────────────┐
│  planning   │ ← Plan phase, architect creates plan.json
└──────┬──────┘
       │ plan approved
       ▼
┌──────────────────────┐
│ coder_delegated      │ ← Coder working on implementation
└──────────┬───────────┘
           │
           ├──► coding ──► test_engineer ──► reviewer ──► complete
           │        │              │            │
           │        └────────────────────────────┘ (if reviewer rejects)
           │
           ▼ (on drift detected)
┌─────────────┐
│   drifting  │ ← Critic detected plan/code mismatch
└──────┬──────┘
       │ resolved
       ▼
┌─────────────┐
│  recovering │ ← Architect rectifies drift
└──────┬──────┘
       │ recovery complete
       ▼
┌──────────────────────┐
│ coder_delegated      │ ← Back to coding with corrections
└──────────────────────┘

           ┌─────────────────────────────────────┐
           │                                     │
           ▼                                     ▼
┌─────────────────────┐              ┌───────────────────┐
│    blocked          │              │   gated           │ ← QA gate in progress
└─────────────────────┘              └───────────────────┘
     │                                    │
     │ unblocked                          │ gate passes
     ▼                                    ▼
┌─────────────────────┐              ┌───────────────────┐
│coder_delegated / etc │              │  next phase       │
└─────────────────────┘              └───────────────────┘
```

## State Transitions

| From | To | Trigger |
|------|-----|---------|
| idle | exploring | User starts task or `/swarm` command issued |
| exploring | planning | Explorer completes indexing |
| planning | coder_delegated | Plan approved by architect |
| coder_delegated | coding | Coder begins implementation |
| coding | test_engineer | Coder completes implementation |
| test_engineer | reviewer | Tests written and passing |
| reviewer | complete | All QA gates pass |
| reviewer | coding | Reviewer rejects (loop back) |
| reviewer | drifting | Critic detects significant drift |
| drifting | recovering | Architect intervenes |
| recovering | coder_delegated | Recovery complete |
| any | blocked | Dependency not ready |
| blocked | previous | Dependency becomes ready |
| any | gated | QA gate check in progress |
| gated | next | Gate passes |
| gated | previous | Gate fails |

## QA Gates

When code passes from coder → test_engineer → reviewer, gates are checked:

1. **Syntax Gate** - Code parses without errors
2. **Placeholder Gate** - No TODO/FIXME in production code
3. **SAST Gate** - No security vulnerabilities detected
4. **SBOM Gate** - Dependencies documented
5. **Build Gate** - Code compiles successfully
6. **Quality Gate** - Complexity, duplication, test ratio within budget

## Agent Authority by State

| State | Active Agent | File Access |
|-------|--------------|-------------|
| idle | spider | Full |
| exploring | explorer | Read-only (indexing) |
| planning | architect/spider | Full (creating plan) |
| coder_delegated | coder | Restricted (src/, tests/, generated/) |
| coding | coder | Restricted |
| test_engineer | test_engineer | Restricted (tests/, spec/, generated/) |
| reviewer | reviewer | Read-only + evidence |
| drifting | architect | Full (recovery) |
| gated | reviewer | Evidence collection |
| complete | spider | Full |

## Context Budget Tracking

During execution, context budget is monitored:
- `warn_threshold` (default 80%) - Warning issued
- `critical_threshold` (default 95%) - Compaction triggered
- `enforce_on_agent_switch` - Budget re-checked on agent handoff
