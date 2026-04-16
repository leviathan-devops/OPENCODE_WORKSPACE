# Spider Agent Quick Comparison

## Agent Roles

| Agent | Role | Type | Access Level |
|-------|------|------|--------------|
| spider | Orchestrator | Built-in | Full |
| architect | Planner/Delegator | Built-in | Full |
| coder | Implementer | Built-in | Restricted (src/, tests/, generated/) |
| reviewer | QA Reviewer | Built-in | Read-only + evidence |
| test_engineer | Test Writer | Built-in | Restricted (tests/, spec/) |
| explorer | Project Indexer | Built-in | Read-only |
| sme | Subject Matter Expert | Built-in | Read-only |
| critic | Drift Detector | Built-in | evidence/ only |
| docs | Documentation | Built-in | TBD |
| designer | Design Review | Built-in | TBD |

## Vanilla OpenCode Agents

| Agent | Access | Notes |
|-------|--------|-------|
| build | FULL | Vanilla - unrestricted |
| plan | FULL | Vanilla - unrestricted |
| general | FULL | Vanilla - unrestricted |
| architect | FULL | Vanilla - unrestricted |

## Built-in vs Vanilla

| Property | Spider Built-in | Vanilla OpenCode |
|----------|-----------------|------------------|
| File Access | Restricted by role | Full |
| Pipeline | Enforced phases | Single-pass |
| QA Gates | Mandatory | None |
| State | Persistent (.Spider/) | Ephemeral |
| Context Compaction | Automatic | Manual |
| Model Fallback | Configured | Default |

## Pipeline Agents

| Agent | Enters Pipeline | Exits Pipeline | Gates |
|-------|-----------------|----------------|-------|
| explorer | First | After indexing | None |
| coder | After plan | After coding | None |
| test_engineer | After coder | After tests | None |
| reviewer | After test_engineer | After review | All QA gates |

## QA Agents

| Agent | Trigger | Function |
|-------|---------|----------|
| reviewer | Post-test | Code quality review |
| critic | Any phase | Drift detection |

## Tool Availability by Agent

| Tool | spider | architect | coder | reviewer | test_engineer |
|------|--------|-----------|-------|----------|---------------|
| checkpoint | ✓ | ✗ | ✗ | ✗ | ✗ |
| check_gate_status | ✓ | ✗ | ✗ | ✓ | ✗ |
| completion_verify | ✓ | ✗ | ✗ | ✓ | ✗ |
| delegation | ✓ | ✓ | ✗ | ✗ | ✗ |
| apply_patch | ✗ | ✗ | ✓ | ✗ | ✗ |
| write | ✗ | ✗ | ✓ | ✗ | ✗ |
| read | ✓ | ✓ | ✓ | ✓ | ✓ |
| read_dir | ✓ | ✓ | ✓ | ✓ | ✓ |
| glob | ✓ | ✓ | ✓ | ✓ | ✓ |
| grep | ✓ | ✓ | ✓ | ✓ | ✓ |
| evidence_write | ✗ | ✗ | ✗ | ✓ | ✗ |
| knowledge_read | ✓ | ✓ | ✓ | ✓ | ✓ |
| knowledge_write | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Agent Interaction Patterns

### Standard Pipeline
```
explorer → architect → coder → test_engineer → reviewer → complete
```

### With Drift
```
... → reviewer → (drift!) → architect → coder → test_engineer → reviewer → complete
```

### With Sounding Board
```
architect → (stuck) → critic(sounding_board) → architect → ...
```

## Model Selection

| Agent | Primary Model | Fallback |
|-------|---------------|----------|
| spider | minimax/M2.7 | deepseek-chat |
| coder | glm-5 | minimax/M2.7 |
| reviewer | mimo-v2-omni-free | minimax/M2.7 |
| test_engineer | minimax/M2.7 | omnicoder-9b |
| explorer | nemotron-3-super | gemini-2.5-flash |
| sme | deepseek-chat | deepseek-chat |
| critic | mimo-v2-omni-free | minimax/M2.7 |
| docs | nemotron-3-super | minimax/M2.7 |
| designer | nemotron-3-super | minimax/M2.7 |
