# HERMES AGENT PLUGIN v2.3.2 — TEST PLAN
## Self-Contained Context Library for Full Architecture Validation

**Test Package Version:** 1.0
**Date:** 2026-04-06
**Plugin:** v2.3.2-build
**Location:** `.../Hermes Agent Plugin/v2.3.2-build/TEST_PACKAGE/`

---

## PURPOSE

This package provides mechanically-validated, comprehensive tests for the Hermes Agent Plugin v2.3.2. It is designed to:
1. Pressure-test every capability of the plugin
2. Identify exactly where it breaks or derails
3. Verify alignment with the v2.3 spec
4. Generate a data package for DevOps Manager review

**The output of running these tests is a JSON data package — send it to DevOps Manager for review.**

---

## HOW TO USE THIS PACKAGE

1. **Pre-flight:** Verify OpenCode is running with v2.3.2 plugin loaded
2. **Run each test** by entering the command in OpenCode or terminal
3. **Capture the actual output** in `TEST_RESULTS.json` using the format below
4. **Fill the results template** — every test has an expected/actual comparison
5. **Send `TEST_RESULTS.json`** to DevOps Manager for analysis

**Output format for each test:**
```json
{
  "test_id": "TOOL-001",
  "test_name": "lint tool — valid project",
  "command": "call lint target=/tmp/hermes-test-project/src/api/routes.ts",
  "expected": "Non-empty string output with lint findings or 'no issues'",
  "actual": "<paste actual output>",
  "status": "PASS | FAIL | ERROR",
  "notes": "<any observations>"
}
```

---

## PART 0: ENVIRONMENT VERIFICATION

### E-001 — OpenCode Running
```bash
opencode --version 2>&1 || echo "OpenCode not accessible"
```

### E-002 — Plugin Loaded
```bash
opencode run "call get_supervisor_recommendations"
# Expected: JSON/tool response from Hermes plugin
# FAIL if: "Unknown tool" or command not found
```

### E-003 — Hermes Tab Visible
**Manual step:** Look at the agent tab in OpenCode UI.
- Is "hermes" visible in the agent selector?
- Does it have the orange color (#D35400)?
- Screenshot the tab if possible

### E-004 — /Hermes Command
```bash
opencode run "/Hermes status"
# Expected: Status text output from Hermes
# FAIL if: Command not found or vanilla response
```

---

## PART 1: AGENT REGISTRATION (19 SUBAGENTS)

### AGENT-001 — hermes Agent (Primary)
```bash
opencode run "call get_supervisor_recommendations"
# Expected: Supervisor tool output (non-empty)
# Verify: Output is NOT "Unknown tool"
```

### AGENT-002 — /Hermes CLI Commands
```bash
opencode run "/Hermes status"
opencode run "/Hermes agents"
opencode run "/Hermes memory"
opencode run "/Hermes help"
# Expected: Each returns text (not an error)
# FAIL if: "command not found" or no response
```

### AGENT-003 through AGENT-021 — Subagent Tool Access

For each subagent, test that the agent is registered by checking if any of its tools work:

```bash
# Test analyst-type tools exist
opencode run "call extract_code_blocks target=/tmp/test.ts"
# Expected: Non-empty output or valid response

opencode run "call detect_domains target=/tmp/test.ts"
# Expected: Non-empty output
```

```bash
# Test grill tool (security testing agent)
opencode run "call grill target=/tmp/test.ts"
# Expected: Attack Results or "no issues found"
```

```bash
# Test symbols tool
opencode run "call symbols target=/tmp/test.ts"
# Expected: Symbol list or "no symbols"
```

```bash
# Test complexity_hotspots tool
opencode run "call complexity_hotspots target=/tmp/test.ts"
# Expected: Complexity report
```

---

## PART 2: CLI COMMAND INTERCEPTION (/Hermes)

### CLI-001 — /Hermes status
```bash
opencode run "/Hermes status"
# Expected: Status output mentioning session, agents, memory
# FAIL if: Vanilla agent response or "command not found"
```

### CLI-002 — /Hermes agents
```bash
opencode run "/Hermes agents"
# Expected: List of Hermes sub-agents
# FAIL if: Empty or error
```

### CLI-003 — /Hermes memory
```bash
opencode run "/Hermes memory"
# Expected: Memory system status
# FAIL if: Error or empty
```

### CLI-004 — /Hermes help
```bash
opencode run "/Hermes help"
# Expected: Help text listing available commands
# FAIL if: Error or empty
```

### CLI-005 — Case Insensitivity
```bash
opencode run "/hermes status"
opencode run "/HERMES STATUS"
# Both should work or gracefully handle case
```

### CLI-006 — Unknown Subcommand
```bash
opencode run "/Hermes nonsense_command_xyz"
# Expected: Error message about unknown command (not silence)
```

---

## PART 3: SPILLover Defense (CRITICAL)

### SPILL-001 — Vanilla Agent Must NOT Get /Hermes Intercept
**Manual test in OpenCode:**
1. Switch to a vanilla agent (e.g., "plan" or "build")
2. Type `/Hermes status`
3. Verify the vanilla agent does NOT receive Hermes response
4. The vanilla agent should either ignore the command or handle it normally

### SPILL-002 — hermes-command Hook Only Fires for Hermes Agents
```bash
opencode run "call get_supervisor_recommendations"
# Should work (Hermes agent)

# Manual: Switch to non-hermes agent, try same
# Expected: get_supervisor_recommendations NOT accessible (not a vanilla tool)
```

### SPILL-003 — self-review Hook Only Transforms Hermes Agents
**Manual:**
1. As Hermes agent, say "looks good" — should get self-review warning
2. As vanilla agent, say "looks good" — should NOT get self-review warning

### SPILL-004 — All Hooks Have isHermesAgent Guard
```bash
grep -l "isHermesAgent" src/hooks/*.ts | wc -l
# Expected: 29 (all hooks)
```

---

## PART 4: TOOL TESTS (29 Tools)

### TOOL-001 — lint
```bash
opencode run "call lint target=/tmp"
# Expected: Non-empty string (lint output or "no issues")
# Verify: Actually runs on /tmp or a valid target
```

### TOOL-002 — diff
```bash
opencode run "call diff target=/tmp"
# Expected: Diff output or "not a git repo" or similar
# Should not crash
```

### TOOL-003 — build_check
```bash
opencode run "call build_check target=/tmp"
# Expected: Non-empty string
```

### TOOL-004 — syntax_check
```bash
opencode run "call syntax_check target=/tmp"
# Expected: Non-empty string
```

### TOOL-005 — test_runner
```bash
opencode run "call test_runner target=/tmp"
# Expected: Non-empty string (test results)
```

### TOOL-006 — placeholder_scan
```bash
opencode run "call placeholder_scan target=/tmp"
# Expected: Non-empty string (scan results)
```

### TOOL-007 — sast_scan
```bash
opencode run "call sast_scan target=/tmp"
# Expected: Non-empty string (security findings)
```

### TOOL-008 — secret_scan
```bash
opencode run "call secret_scan target=/tmp"
# Expected: Non-empty string (secret findings or clean)
```

### TOOL-009 — complexity_hotspots
```bash
opencode run "call complexity_hotspots target=/tmp"
# Expected: Non-empty string (complexity report)
```

### TOOL-010 — detect_domains
```bash
opencode run "call detect_domains target=/tmp"
# Expected: Non-empty string (domain analysis)
```

### TOOL-011 — extract_code_blocks
```bash
opencode run "call extract_code_blocks target=/tmp/test.ts"
# Expected: Code blocks extracted
```

### TOOL-012 — imports
```bash
opencode run "call imports target=/tmp/test.ts"
# Expected: Import list
```

### TOOL-013 — symbols
```bash
opencode run "call symbols target=/tmp/test.ts"
# Expected: Symbol list
```

### TOOL-014 — grill (Security Testing)
```bash
opencode run "call grill target=/tmp/test.ts"
# Expected: Security test output
```

### TOOL-015 — verify
```bash
opencode run "call verify"
# Expected: Verification output
```

### TOOL-016 — health
```bash
opencode run "call health"
# Expected: Health check output
```

### TOOL-017 — evidence_check
```bash
opencode run "call evidence_check claim=\"test\" target=/tmp"
# Expected: Evidence assessment
```

### TOOL-018 — hermes_remember
```bash
opencode run "call hermes_remember topic=test value=\"test memory value\""
# Expected: Confirmation of storage
```

### TOOL-019 — hermes_recall
```bash
opencode run "call hermes_recall topic=test"
# Expected: Recall of stored memory
```

### TOOL-020 — hermes_context
```bash
opencode run "call hermes_context topic=test"
# Expected: Contextually relevant memories
```

### TOOL-021 — list_sessions
```bash
opencode run "call list_sessions"
# Expected: Session list
```

### TOOL-022 — load_session
```bash
opencode run "call load_session session_id=\"test\""
# Expected: Session load response (success or error)
```

### TOOL-023 — fork_session
```bash
opencode run "call fork_session session_id=\"test\""
# Expected: Fork response
```

### TOOL-024 — create_snapshot
```bash
opencode run "call create_snapshot label=\"test-snapshot\""
# Expected: Snapshot creation confirmation
```

### TOOL-025 — checkpoint
```bash
opencode run "call checkpoint"
# Expected: Checkpoint confirmation
```

### TOOL-026 — phase_complete
```bash
opencode run "call phase_complete phase=1"
# Expected: Phase advancement confirmation
```

### TOOL-027 — save_plan
```bash
opencode run "call save_plan plan=\"test plan content\""
# Expected: Plan save confirmation
```

### TOOL-028 — get_supervisor_recommendations
```bash
opencode run "call get_supervisor_recommendations"
# Expected: Supervisor recommendations output
```

---

## PART 5: SECURITY / PATH CONTAINMENT

### SEC-001 — Path Traversal: grill
```bash
opencode run "call grill target=/tmp/../../../etc/passwd"
# Expected: "Access denied" or path containment error
# FAIL if: Actual file contents returned
```

### SEC-002 — Path Traversal: symbols
```bash
opencode run "call symbols target=/tmp/../../../etc/passwd"
# Expected: Access denied or empty/error
# FAIL if: File contents returned
```

### SEC-003 — Path Traversal: complexity_hotspots
```bash
opencode run "call complexity_hotspots target=/tmp/../../../etc/passwd"
# Expected: Access denied or error
# FAIL if: File contents returned
```

### SEC-004 — Path Traversal: extract_code_blocks
```bash
opencode run "call extract_code_blocks target=/tmp/../../../etc/passwd"
# Expected: Access denied or error
# FAIL if: File contents returned
```

### SEC-005 — Path Traversal: imports
```bash
opencode run "call imports target=/tmp/../../../etc/passwd"
# Expected: Access denied or error
# FAIL if: File contents returned
```

### SEC-006 — Secret Scan: Real Secret Detection
Create a file with a fake AWS key and scan it:
```bash
echo "AWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE" > /tmp/fake_secret.ts
opencode run "call secret_scan target=/tmp/fake_secret.ts"
# Expected: Secret detected
# FAIL if: "no secrets found"
rm /tmp/fake_secret.ts
```

### SEC-007 — SAST: SQL Injection Detection
Create a file with SQL injection vulnerability and scan:
```bash
echo "const query = 'SELECT * FROM users WHERE id = ' + userInput;" > /tmp/sql_vuln.ts
opencode run "call sast_scan target=/tmp/sql_vuln.ts"
# Expected: SQL injection flagged
rm /tmp/sql_vuln.ts
```

---

## PART 6: MEMORY SYSTEM

### MEM-001 — hermes_remember stores data
```bash
opencode run "call hermes_remember topic=audit-test value=\"memory test at $(date)\""
# Expected: Storage confirmation
```

### MEM-002 — hermes_recall retrieves data
```bash
opencode run "call hermes_recall topic=audit-test"
# Expected: Previously stored value returned
```

### MEM-003 — hermes_context finds related memories
```bash
opencode run "call hermes_context topic=test"
# Expected: Contextually relevant memories
```

### MEM-004 — Memory persists across sessions
**Manual:** Store a memory, restart OpenCode, recall it.
- Expected: Memory survives restart

### MEM-005 — Memory file is valid JSON
```bash
cat ~/hermes-workspace/memory/*.json 2>/dev/null | python3 -m json.tool > /dev/null
# Expected: Valid JSON (no parse errors)
# FAIL if: JSON parse error
```

### MEM-006 — Concurrent memory writes don't corrupt
Run two memory operations in parallel:
```bash
opencode run "call hermes_remember topic=concurrent-1 value=\"value1\"" &
opencode run "call hermes_remember topic=concurrent-2 value=\"value2\"" &
wait
opencode run "call hermes_recall topic=concurrent-1"
opencode run "call hermes_recall topic=concurrent-2"
# Expected: Both values correct (no corruption)
```

---

## PART 7: HOOKS (29 Hooks)

### HOOK-001 — tool.execute.before fires
```bash
opencode run "call lint target=/tmp"
# Hook should fire before lint executes
# Check logs if accessible
```

### HOOK-002 — tool.execute.after fires
```bash
opencode run "call lint target=/tmp"
# Hook should fire after lint executes
```

### HOOK-003 — session.compacting fires on context overflow
**Manual:** Generate large context (many tool calls), verify compaction triggers.
- Check for compaction log messages

### HOOK-004 — chat.messages.transform fires
**Manual:** As Hermes agent, include "looks good" or "approved" in a message.
- Expected: Self-review warning injected

### HOOK-005 — chat.system.transform fires
**Manual:** System message should be transformed
- Verify system prompt modifications

### HOOK-006 — command.execute.before fires for /Hermes
```bash
opencode run "/Hermes status"
# Hook should intercept and process
```

---

## PART 8: SUBAGENT DELEGATION

### SUB-001 — Delegate to analyst
```bash
opencode run "@analyst Analyze this: print('hello world')"
# Expected: Analyst response
```

### SUB-002 — Delegate to builder
```bash
opencode run "@builder Write a hello world function"
# Expected: Builder response with code
```

### SUB-003 — Delegate to tdd
```bash
opencode run "@tdd Write a test for hello world"
# Expected: TDD response with test
```

### SUB-004 — Delegate to reviewer
```bash
opencode run "@reviewer Review this code: def foo(): pass"
# Expected: Review response
```

### SUB-005 — Delegate to grill (security)
```bash
opencode run "@grill Attack surface of: user_input = request.args.get('id')"
# Expected: Security analysis
```

### SUB-006 — Cross-agent delegation chain
```bash
opencode run "@analyst @builder @tdd Full stack hello world"
# Expected: Multi-agent coordination
```

### SUB-007 — Delegation with context preservation
```bash
opencode run "@builder Write a function" 
# Follow with:
opencode run "@reviewer Review the code @builder just wrote"
# Expected: Context preserved between agents
```

---

## PART 9: QUALITY ENFORCEMENT

### QUAL-001 — TDD Enforcer blocks non-TDD workflow
**Manual:** Ask Hermes to write code without tests.
- Expected: TDD enforcer blocks the request

### QUAL-002 — Brainstorm gate blocks premature coding
**Manual:** Ask Hermes to write code with "just start coding".
- Expected: Brainstorm gate requires design first

### QUAL-003 — Plan validator rejects placeholder plans
```bash
opencode run "@planner Create a plan with TODO: implement X"
# Expected: Plan validator rejects (TBD/TODO found)
```

### QUAL-004 — Scope guard prevents drift
**Manual:** During a task, ask to add unrelated features.
- Expected: Scope guard blocks expansion

### QUAL-005 — Delegation gate blocks inappropriate delegation
**Manual:** Try to delegate to a non-existent agent.
- Expected: Delegation gate blocks

### QUAL-006 — Complexity routing routes by complexity
**Manual:** Run a simple task vs a complex multi-module task.
- Expected: Different routing based on complexity

---

## PART 10: STRESS / FAILURE MODES

### STRESS-001 — 100+ tool calls in one session
**Manual:** Run 100+ tool calls in sequence.
- Expected: No degradation
- Monitor: Response time, context size

### STRESS-002 — Very large file (>10MB)
```bash
dd if=/dev/zero of=/tmp/huge_file.ts bs=1M count=11
opencode run "call symbols target=/tmp/huge_file.ts"
# Expected: Graceful error or timeout (not crash)
rm /tmp/huge_file.ts
```

### STRESS-003 — Rapid delegation (5+ agents in parallel)
```bash
opencode run "@analyst test @builder test @tdd test @reviewer test @grill test"
# Expected: All complete without resource conflicts
```

### STRESS-004 — Malformed inputs don't crash tools
```bash
opencode run "call lint target="
opencode run "call hermes_remember topic= value=\"test\""
opencode run "call symbols target=/nonexistent/path/file.ts"
# Expected: Graceful error responses (not crashes)
```

### STRESS-005 — Hook guards prevent cascade failures
**Manual:** Make one hook throw an error.
- Expected: Other hooks continue (graceful degradation)

### STRESS-006 — Concurrent tool calls don't clobber
```bash
opencode run "call lint target=/tmp &"
opencode run "call symbols target=/tmp &"
opencode run "call build_check target=/tmp &"
wait
# Expected: All complete with correct individual results
```

### STRESS-007 — Path with special characters
```bash
opencode run "call symbols target=/tmp/file with spaces.ts"
# Expected: Handle gracefully (not crash)
```

### STRESS-008 — Unknown agent names don't crash
```bash
opencode run "@nonexistent_agent do something"
# Expected: Graceful error (not crash)
```

---

## PART 11: SPEC ALIGNMENT

### SPEC-001 — All 29 tools present (as per v2.3 spec)
```bash
opencode run "call lint target=/tmp"
opencode run "call diff target=/tmp"
opencode run "call build_check target=/tmp"
opencode run "call syntax_check target=/tmp"
opencode run "call test_runner target=/tmp"
opencode run "call placeholder_scan target=/tmp"
opencode run "call sast_scan target=/tmp"
opencode run "call secret_scan target=/tmp"
opencode run "call complexity_hotspots target=/tmp"
opencode run "call detect_domains target=/tmp"
opencode run "call extract_code_blocks target=/tmp"
opencode run "call imports target=/tmp"
opencode run "call symbols target=/tmp"
opencode run "call grill target=/tmp"
opencode run "call verify"
opencode run "call health"
opencode run "call evidence_check claim=\"x\" target=/tmp"
opencode run "call hermes_remember topic=test value=\"x\""
opencode run "call hermes_recall topic=test"
opencode run "call hermes_context topic=test"
opencode run "call list_sessions"
opencode run "call load_session session_id=\"test\""
opencode run "call fork_session session_id=\"test\""
opencode run "call create_snapshot label=\"test\""
opencode run "call checkpoint"
opencode run "call phase_complete phase=1"
opencode run "call save_plan plan=\"test\""
opencode run "call get_supervisor_recommendations"
# All 29 tools should return non-error responses
```

### SPEC-002 — All 29 hooks registered
```bash
grep -c "export function create" src/hooks/*.ts
# Expected: 29 hooks
```

### SPEC-003 — 19 Hermes subagents registered
```bash
grep -c "name:" src/index.ts | head
# Expected: 19 agent entries
```

### SPEC-004 — isHermesAgent Set has 19 agents
Check agent-identity.ts:
```bash
grep -A20 "HERMES_AGENTS = new Set" src/config/agent-identity.ts
# Expected: 19 agent names listed
```

### SPEC-005 — DevOps context path via env var
```bash
HERMES_DEVOPS_CONTEXT_DIR=/tmp/test opencode run "call get_supervisor_recommendations"
# Expected: Works (falls back to env var path)
```

---

## RESULTS OUTPUT FORMAT

When all tests are complete, compile results into this JSON structure:

```json
{
  "test_run": {
    "date": "2026-04-06",
    "plugin_version": "v2.3.2-build",
    "opencode_version": "<from E-001>",
    "tester": "<name>"
  },
  "summary": {
    "total": <N>,
    "passed": <N>,
    "failed": <N>,
    "errors": <N>,
    "pass_rate": "<percentage>"
  },
  "test_results": [
    { /* per-test-result objects as defined above */ }
  ],
  "critical_findings": [
    {
      "test_id": "SPILL-001",
      "severity": "CRITICAL",
      "description": "<what broke>",
      "evidence": "<actual output>",
      "impact": "<why this matters>"
    }
  ],
  "spec_misalignments": [
    {
      "spec_item": "<what spec says>",
      "actual_behavior": "<what plugin does>",
      "test_id": "<where verified>"
    }
  ],
  "failure_modes": [
    {
      "scenario": "<what you did>",
      "result": "<what happened>",
      "recoverable": true/false
    }
  ]
}
```

---

## FILL THIS IN AND SEND BACK

After running all tests, fill in `TEST_RESULTS.json` and send it to DevOps Manager for review.

**This is the deliverable that will be analyzed.**
