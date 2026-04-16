# Hermes Agent v2.1 — Integration Test Plan

**Document Version:** 1.0  
**Date:** April 4, 2026  
**Test Package Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.1-build/TEST_PACKAGE/`

---

## Test Environment

| Component | Version/Info |
|-----------|--------------|
| OpenCode | [FILL IN: Run `/version` to get] |
| Hermes Plugin | v2.1-build |
| Test Project | physiolab (synthetic multi-module) |
| Test Project Commit | [After cloning, run `git rev-parse HEAD`] |
| Node.js | [Run `node --version`] |
| Python | [Run `python3 --version`] |
| Test Host | [Run `hostname`] |

---

## Test Project Summary

The test project `physiolab` is a synthetic multi-module project with:

- **Languages:** TypeScript (Node.js), Python, React (TSX)
- **Modules:** api/, core/, utils/, web/
- **Bugs Planted:** 8 intentional bugs (see KNOWN_BUGS.md)
- **TODOs:** 15+ incomplete features (see TODO.md)
- **Security Issues:** SQL injection, missing auth, potential memory leak
- **Complexity Hotspots:** O(n²) signal filter algorithm

---

## Phase 1: Core Architecture Tests

### 1.1 Agent Registration

| Test ID | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| AR-001 | Hermès agent appears in OpenCode tab toggle | "hermès" visible in agent selector | ___ |
| AR-002 | Spider agent visible alongside Hermès | Both agents listed | ___ |
| AR-003 | All 19 sub-agents registered | Full agent list accessible | ___ |
| AR-004 | /Hermès command registered | Command returns status info | ___ |
| AR-005 | /hermes (lowercase) command | Alias works or returns error | ___ |
| AR-006 | /spider command registered | Spider status displayed | ___ |

### 1.2 Memory System

| Test ID | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| MS-001 | `hermes_recall` with no prior context | Returns empty or initialization | ___ |
| MS-002 | `hermes_remember` saves context | Context persisted to disk | ___ |
| MS-003 | Verify memory file readable externally | File at expected path, valid JSON | ___ |
| MS-004 | Memory persists across restart | New session sees previous context | ___ |
| MS-005 | Memory not corrupted | No truncation, no garbage data | ___ |
| MS-006 | Memory handles 1MB+ context | Large context saved/loaded correctly | ___ |
| MS-007 | Concurrent memory writes | No race condition corruption | ___ |

### 1.3 Checkpoint System

| Test ID | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| CS-001 | `checkpoint` tool saves plan state | Valid JSON file created | ___ |
| CS-002 | `phase_complete` advances phases | Phase indicator incremented | ___ |
| CS-003 | Checkpoint files in hermes-workspace | Files at expected directory | ___ |
| CS-004 | Checkpoint files valid JSON | No parse errors | ___ |
| CS-005 | Checkpoint survives restart | State restored after restart | ___ |
| CS-006 | Multiple checkpoints tracked | History/versioning works | ___ |
| CS-007 | Checkpoint includes timestamp | Each save tagged with time | ___ |

### 1.4 Context Management

| Test ID | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| CM-001 | `save_plan` creates plan structure | Correct JSON schema | ___ |
| CM-002 | `extract_code_blocks` on TypeScript | Correct block boundaries | ___ |
| CM-003 | `extract_code_blocks` on Python | Correct block boundaries | ___ |
| CM-004 | `extract_code_blocks` on mixed file | All blocks extracted | ___ |
| CM-005 | `imports` tool resolves dependencies | Import graph accurate | ___ |
| CM-006 | `symbols` tool finds definitions | All symbols located | ___ |
| CM-007 | Context window within budget | No overflow errors | ___ |
| CM-008 | Multi-file context aggregation | Combined context coherent | ___ |

### 1.5 Hooks (14 Hooks)

| Test ID | Hook | Trigger Action | Expected Behavior | Status |
|---------|------|----------------|-------------------|--------|
| HK-001 | `on_edit` | Edit a file | Hook fires on save | ___ |
| HK-002 | `on_agent_start` | Start any agent | Hook fires with agent info | ___ |
| HK-003 | `on_agent_end` | Agent completes | Hook fires with result | ___ |
| HK-004 | `on_tool_call` | Use any tool | Hook logs tool invocation | ___ |
| HK-005 | `on_message` | Send message | Hook fires on message | ___ |
| HK-006 | `on_planning` | Create plan | Hook fires on plan creation | ___ |
| HK-007 | `checkpoint_save` | Save checkpoint | Hook fires on checkpoint | ___ |
| HK-008 | `checkpoint_load` | Load checkpoint | Hook fires on restore | ___ |
| HK-009 | `build_check` | Run build | Hook fires pre/post build | ___ |
| HK-010 | `syntax_check` | Detect syntax error | Hook fires on error | ___ |
| HK-011 | `lint` | Run linter | Hook fires on lint issues | ___ |
| HK-012 | `test_runner` | Run tests | Hook fires pre/post tests | ___ |
| HK-013 | `diff` | View file diff | Hook fires on diff | ___ |
| HK-014 | `health` | Health check | Hook fires on health ping | ___ |

### 1.6 Delegation

| Test ID | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| DL-001 | Delegate to analyst agent | Task routed correctly | ___ |
| DL-002 | Delegate to builder agent | Task routed correctly | ___ |
| DL-003 | Delegate to planner agent | Task routed correctly | ___ |
| DL-004 | Delegate to tdd agent | Task routed correctly | ___ |
| DL-005 | Delegate to reviewer agent | Task routed correctly | ___ |
| DL-006 | Cross-agent communication | Messages passed correctly | ___ |
| DL-007 | Agent-to-agent delegation | One agent can call another | ___ |
| DL-008 | Delegation with context | Context preserved through delegation | ___ |

---

## Phase 2: Quality Assurance

### 2.1 Hallucination Detection

| Test ID | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| HD-001 | `hermes_recall` catches non-existent file refs | False reference identified | ___ |
| HD-002 | `grill` tool identifies impossible claims | Impossible claims flagged | ___ |
| HD-003 | `evidence_check` verifies claims | Claims verified against source | ___ |
| HD-004 | File existence check | Missing files detected | ___ |
| HD-005 | API contract verification | Response matches spec | ___ |

### 2.2 Code Quality

| Test ID | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| CQ-001 | `lint` finds issues in physiolab | Real issues reported | ___ |
| CQ-002 | `sast_scan` finds security issues | SQL injection flagged | ___ |
| CQ-003 | `secret_scan` finds credentials | Hardcoded secrets detected | ___ |
| CQ-004 | `complexity_hotspots` identifies O(n²) | Signal filter flagged | ___ |
| CQ-005 | TypeScript type errors | Type mismatches caught | ___ |
| CQ-006 | Python type hints | Missing type annotations flagged | ___ |

### 2.3 Drift Detection

| Test ID | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| DD-001 | `drift-verifier` detects divergence | Code/spec diff reported | ___ |
| DD-002 | Document comparison | Spec vs implementation diff | ___ |
| DD-003 | README vs implementation | Missing features flagged | ___ |

---

## Phase 3: Stress Tests

### 3.1 Context Volume

| Test ID | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| SV-001 | 50+ files of context | All files processed | ___ |
| SV-002 | 100+ tool calls | Session not degraded | ___ |
| SV-003 | 1MB+ context memory | Memory system handles load | ___ |
| SV-004 | Large file (>10MB) | File handled without crash | ___ |

### 3.2 Multi-Agent Coordination

| Test ID | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| MA-001 | 5+ agents in parallel | No resource conflicts | ___ |
| MA-002 | Agent output isolation | Outputs don't clobber | ___ |
| MA-003 | Concurrent checkpoint saves | No corruption | ___ |
| MA-004 | Parallel file edits | All changes saved | ___ |

---

## Phase 4: External Readability

| Test ID | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| ER-001 | Checkpoint JSON readable | External tools can parse | ___ |
| ER-002 | Memory files readable | Files are valid JSON | ___ |
| ER-003 | Plan files parseable | Plan structure valid | ___ |
| ER-004 | Log files accessible | Human-readable format | ___ |

---

## Execution Log Template

```markdown
## Test Run: [TIMESTAMP]

### Pre-conditions
- OpenCode: [version]
- Hermès: [commit hash]
- Test project: physiolab @ [commit]

### Environment Details
```
[System info from uname -a]
[Memory info from free]
[Disk info from df -h]
```

### Phase 1 Results

| Test ID | Test | Expected | Actual | Status | Notes |
|---------|------|----------|--------|--------|-------|
| AR-001 | ... | ... | ... | PASS/FAIL | ... |
...

### Phase 2 Results
[Same format]

### Phase 3 Results
[Same format]

### Phase 4 Results
[Same format]

### Timing Data
| Phase | Start Time | End Time | Duration |
|-------|------------|----------|----------|
| Phase 1 | HH:MM:SS | HH:MM:SS | Xm Ys |
...

### Screenshots Required
- [ ] Screenshot 1: Agent tab toggle
- [ ] Screenshot 2: /Hermès status output
- [ ] Screenshot 3: Memory file contents
- [ ] Screenshot 4: Checkpoint file contents
- [ ] Screenshot 5: Hook invocation logs
- [ ] Screenshot 6: Error conditions

### Signature
Tester: _________________ Date: _________
Reviewer: _________________ Date: _________
```

---

## Expected Issues / Known Bugs

| Issue | Description | Severity | Workaround |
|-------|-------------|----------|------------|
| IJ-001 | [To be filled during testing] | Critical/High/Medium/Low | N/A |
| IJ-002 | ... | ... | ... |

---

## Test Project Files Reference

```
/tmp/hermes-test-project/
├── README.md                    # Main project documentation
├── TODO.md                      # Incomplete features list
├── KNOWN_BUGS.md                # Intentional bugs for testing
├── package.json                 # Node.js dependencies
├── requirements.txt             # Python dependencies
├── docs/
│   └── ARCHITECTURE.md          # System architecture doc
├── src/
│   ├── api/
│   │   ├── routes.ts            # BUG-002, BUG-003, BUG-006
│   │   └── handlers.ts          # BUG-007, BUG-008
│   ├── core/
│   │   └── processor.py        # BUG-001, BUG-005
│   ├── utils/
│   │   ├── validators.ts       # TODO: needs tests
│   │   └── db.py                # BUG-003 (SQL injection)
│   └── web/
│       └── components/
│           └── Dashboard.tsx    # BUG-004
└── tests/
    └── test_processor.py       # Unit tests
```

---

## Appendix A: Sub-Agents (19 total)

1. analyst
2. architect
3. builder
4. code_review
5. debugger
6. documentation
7. infrastructure
8. planner
9. qa
10. reviewer
11. security
12. tdd
13. devops
14. data
15. ml
16. frontend
17. backend
18. fullstack
19. integrator

---

## Appendix B: Hooks (14 total)

1. on_edit
2. on_agent_start
3. on_agent_end
4. on_tool_call
5. on_message
6. on_planning
7. checkpoint_save
8. checkpoint_load
9. build_check
10. syntax_check
11. lint
12. test_runner
13. diff
14. health

---

## Appendix C: Tools

1. hermes_recall
2. hermes_remember
3. checkpoint
4. phase_complete
5. save_plan
6. extract_code_blocks
7. imports
8. symbols
9. grill
10. evidence_check
11. lint
12. sast_scan
13. secret_scan
14. complexity_hotspots
15. drift-verifier

---

**END OF TEST PLAN**
