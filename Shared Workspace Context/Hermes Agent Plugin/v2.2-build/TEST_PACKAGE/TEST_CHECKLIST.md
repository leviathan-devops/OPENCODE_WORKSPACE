# Manual Test Checklist — Hermes v2.1 Integration

**Tester:** _________________________  
**Date:** _________________________  
**OpenCode Version:** _________________________  
**Hermes Commit:** _________________________

---

## Pre-flight Checks

Before beginning testing, verify all pre-conditions are met:

| Check | Description | Verified |
|-------|-------------|----------|
| PF-01 | OpenCode is running and accessible | ☐ |
| PF-02 | Hermes plugin is installed | ☐ |
| PF-03 | `/Hermes` command responds | ☐ |
| PF-04 | `hermes_recall` tool accessible | ☐ |
| PF-05 | `checkpoint` tool accessible | ☐ |
| PF-06 | Test project at `/tmp/hermes-test-project` | ☐ |
| PF-07 | Test project has all required files | ☐ |
| PF-08 | Laptop/terminal has network access | ☐ |

### Test Project Verification

```bash
ls -la /tmp/hermes-test-project/
# Expected: README.md, TODO.md, KNOWN_BUGS.md, src/, tests/, docs/
```

**Project Status:** _________________________

---

## Section 1: Agent Registration

### Test 1.1: Tab Toggle Visibility
**Procedure:**
1. Look at the agent tab toggle in OpenCode
2. Check if "hermes" appears in the list
3. Check if "spider" appears in the list

| Agent | Expected | Actual | Status |
|-------|----------|--------|--------|
| hermes | Visible | ___________ | PASS / FAIL |
| spider | Visible | ___________ | PASS / FAIL |

**Screenshot:** _______________

---

### Test 1.2: /Hermes Command
**Procedure:**
1. Type `/Hermes status` in the chat
2. Observe response

| Field | Expected | Actual |
|-------|----------|--------|
| Response received | Yes | ___________ |
| Shows active agents | Yes | ___________ |
| Shows version info | Yes | ___________ |

**Actual Response:**
```
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
```

---

### Test 1.3: Agent List
**Procedure:**
1. Type `/Hermes agents list`
2. Count the number of sub-agents listed

| Expected | Actual | Status |
|----------|--------|--------|
| 19 sub-agents | ___________ | PASS / FAIL |

**Screenshot:** _______________

---

## Section 2: Memory System

### Test 2.1: hermes_recall (Empty)
**Procedure:**
1. Start a fresh session
2. Type `hermes_recall` or use the tool
3. Observe result

| Field | Expected | Actual |
|-------|----------|--------|
| Returns empty/null | Yes | ___________ |
| No errors | Yes | ___________ |

---

### Test 2.2: hermes_remember (Save)
**Procedure:**
1. Type `hermes_remember test_key = "test value"`
2. Verify response

| Field | Expected | Actual |
|-------|----------|--------|
| Save confirmed | Yes | ___________ |
| No errors | Yes | ___________ |

---

### Test 2.3: hermes_recall (Retrieve)
**Procedure:**
1. Type `hermes_recall test_key`
2. Verify the saved value is returned

| Field | Expected | Actual |
|-------|----------|--------|
| Returns "test value" | Yes | ___________ |
| Correct format | Yes | ___________ |

---

### Test 2.4: External File Read
**Procedure:**
1. In a terminal, read the memory file directly
2. Command: `cat /home/leviathan/OPENCODE_WORKSPACE/.../hermes-workspace/memory/*.json`

| Field | Expected | Actual |
|-------|----------|--------|
| File exists | Yes | ___________ |
| Valid JSON | Yes | ___________ |
| Contains saved data | Yes | ___________ |

**File Location:** _______________
**File Contents:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## Section 3: Checkpoint System

### Test 3.1: Create Checkpoint
**Procedure:**
1. Use `checkpoint` tool with a test plan
2. Observe response

| Field | Expected | Actual |
|-------|----------|--------|
| Checkpoint created | Yes | ___________ |
| Returns checkpoint ID | Yes | ___________ |
| No errors | Yes | ___________ |

**Checkpoint ID:** _______________

---

### Test 3.2: Checkpoint File Location
**Procedure:**
1. Check the hermes-workspace directory
2. Command: `ls -la */workspace/*/checkpoints/`

| Field | Expected | Actual |
|-------|----------|--------|
| File exists | Yes | ___________ |
| Valid JSON | Yes | ___________ |
| Contains plan state | Yes | ___________ |

**File Path:** _______________
**File Contents:**
```
_____________________________________________________________
_____________________________________________________________
```

---

### Test 3.3: phase_complete
**Procedure:**
1. Use `phase_complete` tool
2. Verify phase advances

| Field | Expected | Actual |
|-------|----------|--------|
| Phase advanced | Yes | ___________ |
| New phase visible | Yes | ___________ |

---

## Section 4: Context Management

### Test 4.1: save_plan
**Procedure:**
1. Use `save_plan` with a test plan
2. Verify the plan is saved

| Field | Expected | Actual |
|-------|----------|--------|
| Plan saved | Yes | ___________ |
| Correct structure | Yes | ___________ |

---

### Test 4.2: extract_code_blocks (TypeScript)
**Procedure:**
1. Load `/tmp/hermes-test-project/src/api/routes.ts`
2. Use `extract_code_blocks` tool
3. Verify all code blocks extracted

| Field | Expected | Actual |
|-------|----------|--------|
| Blocks extracted | 6+ blocks | ___________ |
| Correct boundaries | Yes | ___________ |

---

### Test 4.3: extract_code_blocks (Python)
**Procedure:**
1. Load `/tmp/hermes-test-project/src/core/processor.py`
2. Use `extract_code_blocks` tool
3. Verify all code blocks extracted

| Field | Expected | Actual |
|-------|----------|--------|
| Blocks extracted | 5+ blocks | ___________ |
| Correct boundaries | Yes | ___________ |

---

### Test 4.4: imports Tool
**Procedure:**
1. Load `/tmp/hermes-test-project/src/api/routes.ts`
2. Use `imports` tool
3. Verify import graph

| Field | Expected | Actual |
|-------|----------|--------|
| Imports found | 4+ | ___________ |
| Correct resolution | Yes | ___________ |

---

### Test 4.5: symbols Tool
**Procedure:**
1. Load `/tmp/hermes-test-project/src/core/processor.py`
2. Use `symbols` tool
3. Verify symbol list

| Field | Expected | Actual |
|-------|----------|--------|
| Symbols found | 10+ | ___________ |
| Correct types | Yes | ___________ |

---

## Section 5: Hooks

For each hook, the procedure is:
1. Trigger the hook condition
2. Check if hook fires
3. Verify hook output/log

### Hook Test Template

| Hook | Trigger Action | Hook Fired? | Output Correct? | Status |
|------|----------------|------------|-----------------|--------|
| on_edit | Edit a file | YES / NO | YES / NO | PASS / FAIL |
| on_agent_start | Start any agent | YES / NO | YES / NO | PASS / FAIL |
| on_agent_end | Agent completes | YES / NO | YES / NO | PASS / FAIL |
| on_tool_call | Use a tool | YES / NO | YES / NO | PASS / FAIL |
| on_message | Send message | YES / NO | YES / NO | PASS / FAIL |
| on_planning | Create plan | YES / NO | YES / NO | PASS / FAIL |
| checkpoint_save | Save checkpoint | YES / NO | YES / NO | PASS / FAIL |
| checkpoint_load | Load checkpoint | YES / NO | YES / NO | PASS / FAIL |
| build_check | Run build | YES / NO | YES / NO | PASS / FAIL |
| syntax_check | Syntax error | YES / NO | YES / NO | PASS / FAIL |
| lint | Run lint | YES / NO | YES / NO | PASS / FAIL |
| test_runner | Run tests | YES / NO | YES / NO | PASS / FAIL |
| diff | View diff | YES / NO | YES / NO | PASS / FAIL |
| health | Health check | YES / NO | YES / NO | PASS / FAIL |

---

## Section 6: Delegation

### Test 6.1: Delegate to Analyst
**Procedure:**
1. Use delegation to send a task to the analyst agent
2. Observe routing and execution

| Field | Expected | Actual |
|-------|----------|--------|
| Task routed | Yes | ___________ |
| Analyst responded | Yes | ___________ |
| Correct analysis | Yes | ___________ |

---

### Test 6.2: Delegate to Builder
**Procedure:**
1. Use delegation to send a task to the builder agent
2. Observe routing and execution

| Field | Expected | Actual |
|-------|----------|--------|
| Task routed | Yes | ___________ |
| Builder responded | Yes | ___________ |
| Code produced | Yes | ___________ |

---

### Test 6.3: Cross-Agent Communication
**Procedure:**
1. Have one agent send a message to another
2. Verify message delivery

| Field | Expected | Actual |
|-------|----------|--------|
| Message sent | Yes | ___________ |
| Message received | Yes | ___________ |
| Content preserved | Yes | ___________ |

---

## Section 7: Quality Assurance

### Test 7.1: hallucination Detection
**Procedure:**
1. Make a claim about a non-existent file
2. Use `grill` tool to check
3. Verify false claim detected

| Field | Expected | Actual |
|-------|----------|--------|
| False claim caught | Yes | ___________ |
| Correct identification | Yes | ___________ |

---

### Test 7.2: lint
**Procedure:**
1. Run `lint` on `/tmp/hermes-test-project/src/api/routes.ts`
2. Observe reported issues

| Field | Expected | Actual |
|-------|----------|--------|
| Issues found | 2+ | ___________ |
| Correct issues | Yes | ___________ |

**Issues Found:**
```
_____________________________________________________________
_____________________________________________________________
```

---

### Test 7.3: sast_scan
**Procedure:**
1. Run `sast_scan` on the test project
2. Verify SQL injection detected

| Field | Expected | Actual |
|-------|----------|--------|
| SQL injection flagged | Yes | ___________ |
| Location correct | Yes | ___________ |

**Findings:**
```
_____________________________________________________________
_____________________________________________________________
```

---

### Test 7.4: secret_scan
**Procedure:**
1. Run `secret_scan` on the test project
2. Verify no secrets found (or false positives)

| Field | Expected | Actual |
|-------|----------|--------|
| Scan completed | Yes | ___________ |
| Correct results | Yes | ___________ |

---

### Test 7.5: complexity_hotspots
**Procedure:**
1. Run `complexity_hotspots` on the test project
2. Verify O(n²) function flagged

| Field | Expected | Actual |
|-------|----------|--------|
| Hotspots identified | Yes | ___________ |
| O(n²) flagged | Yes | ___________ |

---

## Section 8: Stress Tests

### Test 8.1: Large Context
**Procedure:**
1. Load 50+ files into context
2. Verify no degradation

| Field | Expected | Actual |
|-------|----------|--------|
| All files loaded | Yes | ___________ |
| No crashes | Yes | ___________ |
| Performance acceptable | Yes | ___________ |

---

### Test 8.2: Multi-Agent Parallel
**Procedure:**
1. Start 5+ agents in parallel
2. Verify no conflicts

| Field | Expected | Actual |
|-------|----------|--------|
| All started | Yes | ___________ |
| No conflicts | Yes | ___________ |
| Outputs preserved | Yes | ___________ |

---

## Section 9: External Readability

### Test 9.1: Checkpoint JSON Parse
**Procedure:**
1. Read checkpoint file with external tool
2. Parse as JSON
3. Verify structure

| Field | Expected | Actual |
|-------|----------|--------|
| Parse succeeds | Yes | ___________ |
| Correct schema | Yes | ___________ |

---

### Test 9.2: Memory File Parse
**Procedure:**
1. Read memory file with external tool
2. Parse as JSON
3. Verify structure

| Field | Expected | Actual |
|-------|----------|--------|
| Parse succeeds | Yes | ___________ |
| Correct schema | Yes | ___________ |

---

## Summary

### Tests Passed: _______ / _______

### Tests Failed: _______ / _______

### Tests Skipped: _______ / _______

### Critical Issues Found:

| Issue ID | Description | Severity |
|----------|-------------|----------|
| 1 | _________________________ | ________ |
| 2 | _________________________ | ________ |
| 3 | _________________________ | ________ |

---

## Signatures

**Tester:** _________________________ Date: _________

**Reviewer:** _________________________ Date: _________

---

**END OF CHECKLIST**
