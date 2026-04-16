# Spider Agent Tool Categories

## Orchestration Tools (spider only)

| Tool | Purpose |
|------|---------|
| `checkpoint` | Save current state as a named checkpoint |
| `check_gate_status` | Query QA gate pass/fail status |
| `completion_verify` | Verify task completion criteria |

## Delegation Tools (spider, architect)

| Tool | Purpose |
|------|---------|
| `delegate_to_coder` | Assign task to coder agent |
| `delegate_to_reviewer` | Assign review to reviewer |
| `delegate_to_test_engineer` | Assign testing to test_engineer |
| `delegate_to_explorer` | Assign exploration to explorer |
| `request_sounding_board` | Consult critic as sounding board |

## File Tools (restricted by agent)

| Tool | Coder | Reviewer | Test Engineer |
|------|-------|----------|---------------|
| `read` | ✓ | ✓ | ✓ |
| `read_dir` | ✓ | ✓ | ✓ |
| `glob` | ✓ | ✓ | ✓ |
| `grep` | ✓ | ✓ | ✓ |
| `write` | ✓ | ✗ | ✗ |
| `apply_patch` | ✓ | ✗ | ✗ |
| `edit` | ✓ | ✗ | ✗ |
| `delete` | ✓ | ✗ | ✗ |

## Evidence Tools (reviewer, critic)

| Tool | Purpose |
|------|---------|
| `evidence_write` | Write gate evidence bundle |
| `evidence_read` | Read existing evidence |
| `evidence_list` | List evidence bundles |

## Knowledge Tools

| Tool | Purpose |
|------|---------|
| `knowledge_read` | Query hive mind knowledge |
| `knowledge_write` | Add to hive mind (architect only) |
| `knowledge_migrate` | Update knowledge format |
| `knowledge_quarantine` | Isolate bad knowledge |

## State Tools

| Tool | Purpose |
|------|---------|
| `state_read` | Read .Spider/state.json |
| `state_write` | Update state (spider only) |
| `plan_read` | Read plan.json |
| `plan_write` | Update plan (architect only) |

## Analysis Tools

| Tool | Purpose |
|------|---------|
| `dark_matter_detect` | Find hidden file couplings |
| `complexity_analyze` | Calculate cyclomatic complexity |
| `duplication_scan` | Find code duplication |
| `dependency_graph` | Generate import graph |

## Lint/Gate Tools

| Tool | Gate | Purpose |
|------|------|---------|
| `run_linter` | syntax_check | Run biome/eslint/ruff/etc |
| `run_sast` | sast_scan | Security static analysis |
| `run_sbom` | sbom_generate | Generate SBOM |
| `run_build` | build_check | Verify compilation |

---

## Tool Access by File Zone

| Zone | spider | architect | coder | reviewer | explorer | sme | critic | test_engineer |
|------|--------|-----------|-------|----------|----------|-----|--------|---------------|
| `.Spider/` | ✓ | ✓ | ✗ | ✓ (evidence/) | ✗ | ✗ | ✓ (evidence/) | ✗ |
| `src/` | ✓ | ✓ | ✓ | R | ✗ | R | ✗ | ✗ |
| `lib/` | ✓ | ✓ | ✓ | R | ✗ | R | ✗ | ✗ |
| `tests/` | ✓ | ✓ | ✓ | R | ✗ | R | ✗ | ✓ |
| `generated/` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| `docs/` | ✓ | ✓ | ✓ | R | ✗ | R | ✗ | ✗ |
| `spec/` | ✓ | ✓ | ✓ | R | ✗ | R | ✗ | ✓ |
| `.*` | ✓ | ✓ | R | R | R | R | ✗ | ✗ |

✓ = full access, R = read-only, ✗ = no access

---

## Restricted Paths (all agents)

| Path | Reason |
|------|--------|
| `.Spider/state.json` | Reviewer blocked exact |
| `node_modules/` | External dependency |
| `.git/` | VCS internals |
| `dist/` (if not generated/) | Build output |
| `*.bak` | Backup files |
| `*.backup` | Backup files |

## Agent Tool Map (from constants.ts)

```typescript
AGENT_TOOL_MAP = {
  spider: [checkpoint, check_gate_status, completion_verify, ...],
  architect: [delegate_*, request_sounding_board, knowledge_*, ...],
  coder: [apply_patch, write, edit, read, grep, glob, ...],
  reviewer: [evidence_*, check_gate_status, completion_verify, ...],
  test_engineer: [write (tests/), glob, grep, run_linter, ...],
  explorer: [glob, grep, read_dir, ...],
  sme: [read, grep, ...],
  critic: [evidence_*, ...],
  docs: [write, edit, read, ...],
  designer: [read, glob, ...]
}
```
