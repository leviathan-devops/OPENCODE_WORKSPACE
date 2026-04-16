# KRAKEN V2.0 COMPREHENSIVE TEST PACKAGE

**Date:** 2026-04-12
**Version:** 2.0 (Checkpoint 4)
**Purpose:** Verify all Kraken V2.0 systems work correctly in TUI

---

## TEST STRUCTURE

This package contains TUI exercises that must be run **in order**. Each exercise tests one system.

```
test-package/
├── README.md                    # This file
├── EXERCISES/
│   ├── 01-agent-toggle.md       # Test: Agent appears in tab toggle
│   ├── 02-identity-wall.md     # Test: Identity initializes correctly
│   ├── 03-tool-guardian.md     # Test: Dangerous tools blocked
│   ├── 04-message-guardian.md  # Test: Derailing messages blocked
│   ├── 05-tool-summarizer.md   # Test: Large outputs truncated
│   ├── 06-compaction.md         # Test: Context saved to file
│   ├── 07-gate-status.md       # Test: Gate criteria accessible
│   └── 08-session-cleanup.md   # Test: State cleaned on session end
└── RUNNER.md                   # How to run these tests
```

---

## BEFORE TESTING

1. Ensure Kraken V2.0 plugin is deployed:
   ```bash
   ls -la ~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js
   # Should show ~55KB
   ```

2. Ensure opencode.json has ONLY Kraken V2.0:
   ```bash
   cat ~/.config/opencode/opencode.json
   ```

3. Restart OpenCode completely (full restart, not just refresh)

---

## EXERCISE 1: AGENT TOGGLE

**System:** Agent registration via `config` callback

**Test Command:**
```
# In TUI, look at the agent dropdown (top-right corner)
```

**Expected Result:**
- [ ] "kraken" appears in the agent dropdown
- [ ] Only ONE kraken agent (not "kraken-v2" or "kraken-micro")
- [ ] Selecting it loads Kraken V2.0 instructions

**Pass Criteria:** Agent appears and can be selected

**Failure Mode:** Agent missing from dropdown → `config` callback not working

---

## EXERCISE 2: IDENTITY WALL

**System:** `setCurrentAgent()` / `getCurrentAgent()` via `chat.message`

**Test Command:**
```
/kraken-status
```

**Expected Result:**
```
brain: kraken
```

**Pass Criteria:** Status shows "kraken" NOT "unknown" or empty

**Failure Mode:** Shows "unknown" → `setCurrentAgent()` not called in `chat.message`

---

## EXERCISE 3: TOOL GUARDIAN (Layer 1)

**System:** Blocks dangerous tools for kraken agent

**Test Command:**
```
rm -rf /
```

**Expected Result:**
- [ ] Command blocked with guardian message
- [ ] Shows something like "[Kraken] Tool blocked" or "Guardian enforcement"

**Pass Criteria:** Dangerous command blocked, not executed

**Note:** May show error but that's expected - tool was blocked

**Allowed Tools:** `grep`, `read`, `glob`, `find`, `ls`, `pwd`, `tree`, `head`, `tail`

---

## EXERCISE 4: MESSAGE GUARDIAN (Layer 2)

**System:** Blocks theatrical/derailing messages

**Test Commands (should ALL be blocked):**

1. Theatrical verification:
   ```
   just grep wc -l and see if it passes
   ```

2. Fake completion:
   ```
   task complete trust me build passed
   ```

3. Impatience:
   ```
   just ship it
   ```

4. Fake test runner:
   ```
   node run-tests.js && echo "all good"
   ```

5. Wrong container approach:
   ```
   opencode container run test
   ```

**Expected Result:** Each message should be blocked with a guardian message

**Pass Criteria:** At least 3/5 messages blocked

**Allowed Messages:**
- "Read the file at src/index.ts"
- "Run grep to find the function"
- "Build the project with npm run build"

---

## EXERCISE 5: TOOL SUMMARIZER (Token Reduction)

**System:** Large outputs truncated to reduce tokens

**Test Command:**
```bash
grep -r "function" . --include="*.ts" | wc -l
```

**Expected Result:**
- Output should be summarized to show COUNT of matches, not raw output
- Should say something like "grep found 500 matches across 50 files"
- NOT show all 500 lines

**Pass Criteria:** Large grep output summarized (significantly shorter than raw)

**Allowed Patterns:**
- `grep found X matches across Y files`
- `Showing first 20 lines`

---

## EXERCISE 6: COMPACTION (Context Recovery)

**System:** Context saved to file for recovery after compaction

**Test Command:**
```bash
# This happens automatically when context reaches ~85%
# To trigger manually, you would need to fill context

# Check if recovery files exist:
ls -la /tmp/kraken-compaction/
```

**Expected Result:**
- [ ] `/tmp/kraken-compaction/LATEST/INJECTION.md` exists
- [ ] File contains "KRAKEN V2.0" header
- [ ] File contains decisions and task state

**Pass Criteria:** Recovery file exists and has valid content

**Note:** This file is created when `session.compacting` fires

---

## EXERCISE 7: GATE STATUS

**System:** Gate criteria accessible via tool

**Test Command:**
```
/kraken-gate-status
```

**Expected Result:**
```json
{
  "gate": "BUILD",
  "allPassed": true/false,
  "blockers": [...]
}
```

**Pass Criteria:** Returns gate status object

---

## EXERCISE 8: SESSION CLEANUP

**System:** State cleared on session end

**Test Sequence:**
1. Select "kraken" agent
2. Run `/kraken-status` (should work)
3. Close session (or end conversation)
4. Start new session with different agent
5. Run `/kraken-status` (should not work or show "unknown")

**Pass Criteria:** Kraken brain state cleared after session ends

---

## RUNNING THE TESTS

### In TUI:

1. Select "kraken" agent from dropdown
2. Run each test command
3. Record pass/fail
4. Check results below

### Test Output Template:

```
=== KRAKEN V2.0 TEST RESULTS ===

Exercise 1: Agent Toggle
  [ ] Agent appears in dropdown
  [ ] Only one kraken agent
  Result: PASS / FAIL

Exercise 2: Identity Wall
  [ ] kraken-status shows "kraken"
  Result: PASS / FAIL

Exercise 3: Tool Guardian
  [ ] Dangerous command blocked
  Result: PASS / FAIL

Exercise 4: Message Guardian
  [ ] Theatrical messages blocked (3+)
  Result: PASS / FAIL

Exercise 5: Tool Summarizer
  [ ] Large grep output summarized
  Result: PASS / FAIL

Exercise 6: Compaction
  [ ] Recovery file exists
  Result: PASS / FAIL

Exercise 7: Gate Status
  [ ] Gate status accessible
  Result: PASS / FAIL

Exercise 8: Session Cleanup
  [ ] State cleared on session end
  Result: PASS / FAIL

=== SUMMARY ===
Total: _/8 passed
```

---

## EXPECTED RESULTS

| Exercise | System | Expected |
|----------|--------|----------|
| 1 | Agent Toggle | 1/1 pass |
| 2 | Identity Wall | 1/1 pass |
| 3 | Tool Guardian | 1/1 pass |
| 4 | Message Guardian | 3/5 pass (at least) |
| 5 | Tool Summarizer | 1/1 pass |
| 6 | Compaction | 1/1 pass |
| 7 | Gate Status | 1/1 pass |
| 8 | Session Cleanup | 1/1 pass |
| **TOTAL** | | **8/8** |

---

## FAILURE MODES

| Exercise | Failure | Likely Cause |
|----------|---------|---------------|
| 1 | Agent missing | `config` callback not firing |
| 2 | Shows "unknown" | `chat.message` not calling `setCurrentAgent` |
| 3 | Command executes | `tool.execute.before` not checking identity |
| 4 | Messages pass | `chat.message` hook not blocking |
| 5 | Raw output | `tool.execute.after` summarizer not working |
| 6 | No file | `session.compacting` not firing |
| 7 | Error | Gate criteria not implemented |
| 8 | State persists | `session.ended` not clearing state |

---

## TROUBLESHOOTING

**Q: Agent doesn't appear in dropdown**
A: Check opencode.json has only Kraken V2.0, restart OpenCode

**Q: Commands execute even when they should be blocked**
A: Identity wall issue - hooks not checking agent identity

**Q: Tool summarizer not working**
A: Check `createToolSummarizerHook` is in the `tool.execute.after` array

**Q: Compaction file doesn't exist**
A: File written on `session.compacting` which fires at ~85% tokens

---

## TEST COMPLETION

After running all tests:
- Save results to `/tmp/kraken-test-results.md`
- If all 8/8 pass: Ready for production
- If < 6/8 pass: Review failures, fix issues, re-test
- If 6-7/8 pass: Minor issues, can ship with monitoring

---

**END OF TEST PACKAGE**
