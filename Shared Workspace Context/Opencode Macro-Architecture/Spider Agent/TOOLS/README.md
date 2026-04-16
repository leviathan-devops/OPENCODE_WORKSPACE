# Spider Agent Tools (38 Custom Tools)

**Note**: This directory contains per-tool documentation. See individual tool files below.

---

## Tool Index

### Coordination Tools (10 tools)

| Tool | Purpose | File |
|------|---------|------|
| `save_plan` | Persist execution plan to disk | `save_plan.md` |
| `checkpoint` | Git-based checkpoint save/restore | `checkpoint.md` |
| `update_task_status` | Update task status in plan | `update_task_status.md` |
| `phase_complete` | Mark phase done, generate retro | `phase_complete.md` |
| `declare_scope` | Declare file scope for coder | `declare_scope.md` |
| `evidence_check` | Verify evidence for completed tasks | `evidence_check.md` |
| `write_retro` | Document lessons learned | `write_retro.md` |
| `write_drift_evidence` | Persist drift verification | *(pending)* |
| `retrieve_summary` | Get phase/task summary | *(pending)* |
| `declare_done` | Mark task complete | *(pending)* |

### QA Tools (9 tools)

| Tool | Purpose | File |
|------|---------|------|
| `lint` | Run linters (10+ languages) | `lint.md` |
| `test_runner` | Run tests (auto-detect framework) | `test_runner.md` |
| `build_check` | Verify build succeeds | `build_check.md` |
| `syntax_check` | Fast syntax validation | `syntax_check.md` |
| `secretscan` | Scan for leaked secrets | `secretscan.md` |
| `sast_scan` | Static security analysis | `sast_scan.md` |
| `pkg_audit` | Dependency vulnerability scan | *(pending)* |
| `placeholder_scan` | Detect placeholder code | *(pending)* |
| `doc_scan` | Documentation coverage check | *(pending)* |

### Analysis Tools (9 tools)

| Tool | Purpose | File |
|------|---------|------|
| `complexity_hotspots` | Find high complexity areas | `complexity_hotspots.md` |
| `detect_domains` | Identify domain boundaries | `detect_domains.md` |
| `co_change_analyzer` | Find historically coupled files | `co_change_analyzer.md` |
| `diff` | Git diff with contract detection | *(pending)* |
| `imports` | Analyze import relationships | *(pending)* |
| `symbols` | Extract code symbols | *(pending)* |
| `extract_code_blocks` | Extract code from files | *(pending)* |
| `gitingest` | Git-based code ingestion | *(pending)* |
| `schema_drift` | Detect schema changes | *(pending)* |

### Knowledge Tools (3 tools)

| Tool | Purpose | File |
|------|---------|------|
| `knowledgeAdd` | Add to knowledge store | `knowledgeAdd.md` |
| `knowledgeRecall` | Query knowledge store | `knowledgeRecall.md` |
| `knowledgeRemove` | Remove from knowledge | *(pending)* |

### Swarm/Status Tools (7 tools)

| Tool | Purpose | File |
|------|---------|------|
| `swarm_status` | Show current swarm state | *(pending)* |
| `swarm_plan` | Display plan | *(pending)* |
| `swarm_agents` | List all agents | *(pending)* |
| `swarm_ev` | Show evidence | *(pending)* |
| `swarm_knowledge` | Query knowledge base | *(pending)* |
| `completion_verify` | Verify task completion | *(pending)* |
| `check_gate_status` | Check QA gate status | *(pending)* |

---

## Tool Categories

### createSwarmTool Wrapper

All Spider Agent tools use `createSwarmTool()` which provides:
- Consistent argument parsing with Zod schema
- Safe args extraction (guards against malicious getters)
- Directory parameter injection
- JSON string serialization of results

### Hook Integration

| Tool | Before Hook | After Hook |
|------|-------------|------------|
| `architect` | `delegation-gate` | — |
| `coder` | `delegation-gate`, `scope-guard` | `slop-detector` |
| write/edit tools | `scope-guard` | `slop-detector` |

---

## Global Tool Order (for QA reference)

1. `syntax_check` — TIER 0 (fastest)
2. `lint` — TIER 0
3. `build_check` — TIER 1
4. `test_runner` — TIER 1
5. `secretscan` — TIER 2
6. `sast_scan` — TIER 2
7. `evidence_check` — TIER 3
