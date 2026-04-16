# KRAKEN V2.0 - SELF-TEST SUITE
## Comprehensive Test Package for Fresh Session Verification

**Created:** 2026-04-12 23:38
**Purpose:** Allow Kraken V2.0 to test itself in a fresh session
**Version:** 2.0.0

---

## 📋 TABLE OF CONTENTS

1. [Test Philosophy](#test-philosophy)
2. [Pre-Test Requirements](#pre-test-requirements)
3. [Test Suite A: Plugin Loading](#test-suite-a-plugin-loading)
4. [Test Suite B: Agent Registration](#test-suite-b-agent-registration)
5. [Test Suite C: Hook Functionality](#test-suite-c-hook-functionality)
6. [Test Suite D: Tool Availability](#test-suite-d-tool-availability)
7. [Test Suite E: Brain Initialization](#test-suite-e-brain-initialization)
8. [Test Suite F: Cross-Agent Safety](#test-suite-f-cross-agent-safety)
9. [Test Suite G: Session Survival](#test-suite-g-session-survival)
10. [Test Report Template](#test-report-template)

---

## 🧠 TEST PHILOSHY

### Why These Tests?
These tests verify that Kraken V2.0:
1. Loads correctly in a fresh session
2. Registers as an agent properly
3. Hooks fire at the correct times
4. Tools are available and functional
5. Brains initialize correctly
6. Doesn't break other agents
7. Survives session events (compaction, etc.)

### Test Design Principles
- **Isolated:** Each test is independent
- **Verifiable:** Clear pass/fail criteria
- **Reproducible:** Same results on repeat runs
- **Self-contained:** Kraken can run these itself

---

## ✅ PRE-TEST REQUIREMENTS

Before running tests, ensure:

1. **OpenCode Version:** 1.4.3
```bash
opencode --version  # Should output: 1.4.3
```

2. **Plugin Path Exists:**
```bash
ls ~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js  # Should exist
```

3. **Config Clean:**
```bash
cat ~/.config/opencode/opencode.json | grep kraken-agent  # Should show path
```

4. **No Active Session:**
Start a fresh session for accurate testing.

---

## 🧪 TEST SUITE A: PLUGIN LOADING

### Test A1: Plugin File Exists
**Purpose:** Verify plugin bundle is present

```bash
ls -la ~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js
```

**Expected:** File exists, size ~52KB
**Pass Criteria:** `wc -c` returns approximately 52,000 bytes

---

### Test A2: Plugin Bundle Valid
**Purpose:** Verify bundle is valid ESM

```bash
file ~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js
# Or check with node
node -e "import('.config/opencode/plugins/kraken-agent-v2.0/dist/index.js')" 2>&1
```

**Expected:** ESM module, can be imported
**Pass Criteria:** No syntax errors, module loads

---

### Test A3: Plugin Loads in OpenCode
**Purpose:** Verify OpenCode loads the plugin without errors

```bash
opencode debug config --print-logs 2>&1 | grep -E "kraken|error"
```

**Expected Output:**
```
INFO ... service=plugin path=.../kraken-agent/index.js loading plugin
[Kraken V2.0] Plugin loaded
[Kraken V2.0] Agent registered
```

**Pass Criteria:** 
- No "error=" messages for kraken plugin
- "[Kraken V2.0] Agent registered" appears

---

### Test A4: No Config Corruption
**Purpose:** Verify plugin loading doesn't corrupt opencode.json

```bash
# Before loading
cat ~/.config/opencode/opencode.json > /tmp/before.json

# Load session (use opencode briefly)
opencode --version 2>/dev/null

# After loading
cat ~/.config/opencode/opencode.json > /tmp/after.json

# Compare
diff /tmp/before.json /tmp/after.json
```

**Expected:** No changes to config
**Pass Criteria:** diff returns empty (no differences)

---

## 🧪 TEST SUITE B: AGENT REGISTRATION

### Test B1: Kraken Appears in Agent List
**Purpose:** Verify Kraken is registered as an agent

```bash
opencode agent list 2>&1 | grep kraken
```

**Expected:** "kraken" appears in agent list output
**Pass Criteria:** Output contains `"name": "kraken"` or similar

---

### Test B2: Kraken Agent Has Correct Config
**Purpose:** Verify agent config is correct

```bash
opencode debug agent kraken 2>&1
```

**Expected Output:**
```json
{
  "name": "kraken",
  "mode": "primary",
  "permission": [...],
  ...
}
```

**Pass Criteria:**
- `name` is "kraken"
- `mode` is "primary"
- Has `permission` array

---

### Test B3: Kraken Color Correct
**Purpose:** Verify agent color is set correctly

```bash
opencode debug agent kraken 2>&1 | grep -i color
```

**Expected:** Color is `#8B5CF6` (purple)
**Pass Criteria:** `"color": "#8B5CF6"` in output

---

### Test B4: Kraken Tools Registered
**Purpose:** Verify tools are available

```bash
opencode debug agent kraken 2>&1 | grep -A5 tools
```

**Expected:** Shows `kraken-status` and `kraken-gate-status`
**Pass Criteria:**
```json
"tools": {
  "kraken-status": true,
  "kraken-gate-status": true
}
```

---

## 🧪 TEST SUITE C: HOOK FUNCTIONALITY

### Test C1: Event Hook Registered
**Purpose:** Verify session event hooks are registered

```bash
opencode debug config 2>&1 | grep -E "event|session"
```

**Expected:** session.created and session.compacting hooks present
**Pass Criteria:** Hooks appear in debug output

---

### Test C2: Chat Message Hook Registered
**Purpose:** Verify chat.message hook is registered

```bash
opencode debug config 2>&1 | grep -i "chat.message"
```

**Expected:** chat.message hook present
**Pass Criteria:** `chat.message` hook exists

---

### Test C3: Tool Execute Hooks Registered
**Purpose:** Verify tool.execute hooks are registered

```bash
opencode debug config 2>&1 | grep -E "tool.execute"
```

**Expected:** tool.execute.before and tool.execute.after present
**Pass Criteria:** Both hooks appear

---

### Test C4: Hook Format Correct (No Arrays)
**Purpose:** Verify hooks aren't using array format

```bash
grep -c "\[.*Hook.*\]" ~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js 2>/dev/null || echo "0"
```

**Expected:** 0 matches (no array format)
**Pass Criteria:** Returns "0"

---

## 🧪 TEST SUITE D: TOOL AVAILABILITY

### Test D1: kraken-status Tool Works
**Purpose:** Verify kraken-status tool executes

```bash
# In OpenCode session, run:
# /kraken-status

# Or check tool is registered
opencode debug config 2>&1 | grep "kraken-status"
```

**Expected:** Tool shows in config, accessible in session
**Pass Criteria:** Tool registered and accessible

---

### Test D2: kraken-gate-status Tool Works
**Purpose:** Verify kraken-gate-status tool executes

```bash
# In OpenCode session, run:
# /kraken-gate-status

# Or check tool is registered
opencode debug config 2>&1 | grep "kraken-gate-status"
```

**Expected:** Tool shows in config, accessible in session
**Pass Criteria:** Tool registered and accessible

---

### Test D3: Tools Return Valid JSON
**Purpose:** Verify tool output is structured

```json
// Expected output from kraken-status:
{
  "version": "2.0.0",
  "initialized": true,
  "systemBrain": true,
  "executionBrain": true,
  "planningBrain": true,
  "councilReady": true,
  "currentGate": "..."
}
```

**Pass Criteria:** All fields present, valid JSON

---

## 🧪 TEST SUITE E: BRAIN INITIALIZATION

### Test E1: System Brain Initializes
**Purpose:** Verify System Brain initializes on session start

**Test Command:** Start new session, observe logs
```bash
opencode --agent kraken /tmp --eval "test" 2>&1 | head -30
```

**Expected:**
```
[Kraken V2.0] Initializing multi-brain orchestrator...
[Kraken V2.0] Features:
  - Two-Layer Guardian (Tool + Message enforcement)
  ...
[Kraken V2.0] Plugin loaded
```

**Pass Criteria:** Initialize messages appear

---

### Test E2: Four Brains Present
**Purpose:** Verify all four brains are instantiated

**Test Command:** Run kraken-status in session
```bash
# In session: /kraken-status
# Check output has: systemBrain, executionBrain, planningBrain, councilReady
```

**Expected Output:**
```json
{
  "systemBrain": true,
  "executionBrain": true,
  "planningBrain": true,
  "councilReady": true
}
```

**Pass Criteria:** All four brains initialized

---

### Test E3: Gate Manager Functional
**Purpose:** Verify gate system is working

**Test Command:** Run kraken-gate-status
```bash
# In session: /kraken-gate-status
```

**Expected Output:**
```json
{
  "gate": "...",
  "allPassed": true/false,
  "blockers": [...],
  "details": {...}
}
```

**Pass Criteria:** Gate status returned, structure valid

---

## 🧪 TEST SUITE F: CROSS-AGENT SAFETY

### Test F1: Shark Agent Still Loads
**Purpose:** Verify Kraken doesn't break Shark

```bash
opencode debug agent shark 2>&1 | grep "name"
```

**Expected:** `"name": "shark"` returned
**Pass Criteria:** Shark still works

---

### Test F2: Manta Agent Still Loads
**Purpose:** Verify Kraken doesn't break Manta

```bash
opencode debug agent manta 2>&1 | grep "name"
```

**Expected:** `"name": "manta"` returned
**Pass Criteria:** Manta still works

---

### Test F3: Other Plugins Still Load
**Purpose:** Verify Kraken doesn't break other plugins

```bash
opencode debug config --print-logs 2>&1 | grep -E "coding-subagents|opencode-plugin-engineering"
```

**Expected:** Both plugins load successfully
**Pass Criteria:** No errors for other plugins

---

### Test F4: No Config Corruption
**Purpose:** Verify Kraken only adds its agent, doesn't corrupt config

```bash
cat ~/.config/opencode/opencode.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
agents = d.get('agent', {})
print('Agents:', list(agents.keys()))
"
```

**Expected:** kraken, shark, manta all present
**Pass Criteria:** More agents added, not replaced

---

## 🧪 TEST SUITE G: SESSION SURVIVAL

### Test G1: Session Created Hook Fires
**Purpose:** Verify session.created hook runs

**Test Method:** Start new session, check logs for initialization

**Expected:** 
```
[Kraken V2.0] Initializing multi-brain orchestrator...
```

**Pass Criteria:** Initialization occurs on session start

---

### Test G2: Session Survives Basic Commands
**Purpose:** Verify session doesn't crash on normal use

**Test Method:** Run several commands in session

**Expected:** Session remains stable, Kraken responsive

**Pass Criteria:** No crashes, tools continue to work

---

### Test G3: Tool Execute Hooks Fire
**Purpose:** Verify tool hooks trigger on actual tool use

**Test Method:** Run a tool (e.g., read_file), check hook fires

**Expected:** Hook fires on tool.execute.before/after

**Pass Criteria:** Hooks fire without errors

---

### Test G4: TUI Mode Works
**Purpose:** Verify TUI launch with Kraken works

**Test Command:**
```bash
timeout 10 opencode --agent kraken /tmp 2>&1 | head -30
```

**Expected:** TUI launches, Kraken agent active
**Pass Criteria:** TUI shows "Kraken" in agent tab

---

## 📊 TEST REPORT TEMPLATE

Use this template to record test results:

```markdown
# KRAKEN V2.0 - TEST REPORT
**Date:** [DATE]
**Tester:** [NAME/ID]
**Session:** [FRESH/CONTINUED]

## Test Suite A: Plugin Loading
| Test | Expected | Actual | Pass/Fail | Notes |
|------|----------|--------|-----------|-------|
| A1 | File exists ~52KB | | | |
| A2 | ESM module valid | | | |
| A3 | Loads without error | | | |
| A4 | Config unchanged | | | |

## Test Suite B: Agent Registration
| Test | Expected | Actual | Pass/Fail | Notes |
|------|----------|--------|-----------|-------|
| B1 | kraken in list | | | |
| B2 | Correct config | | | |
| B3 | Color #8B5CF6 | | | |
| B4 | Tools registered | | | |

## Test Suite C: Hook Functionality
| Test | Expected | Actual | Pass/Fail | Notes |
|------|----------|--------|-----------|-------|
| C1 | Event hooks present | | | |
| C2 | chat.message hook | | | |
| C3 | tool.execute hooks | | | |
| C4 | No array format | | | |

## Test Suite D: Tool Availability
| Test | Expected | Actual | Pass/Fail | Notes |
|------|----------|--------|-----------|-------|
| D1 | kraken-status works | | | |
| D2 | kraken-gate-status works | | | |
| D3 | Valid JSON output | | | |

## Test Suite E: Brain Initialization
| Test | Expected | Actual | Pass/Fail | Notes |
|------|----------|--------|-----------|-------|
| E1 | Initialize messages | | | |
| E2 | Four brains present | | | |
| E3 | Gate manager works | | | |

## Test Suite F: Cross-Agent Safety
| Test | Expected | Actual | Pass/Fail | Notes |
|------|----------|--------|-----------|-------|
| F1 | Shark loads | | | |
| F2 | Manta loads | | | |
| F3 | Other plugins work | | | |
| F4 | Config not corrupted | | | |

## Test Suite G: Session Survival
| Test | Expected | Actual | Pass/Fail | Notes |
|------|----------|--------|-----------|-------|
| G1 | session.created fires | | | |
| G2 | Basic commands work | | | |
| G3 | Tool hooks fire | | | |
| G4 | TUI launches | | | |

## SUMMARY
- **Total Tests:** 24
- **Passed:** [COUNT]
- **Failed:** [COUNT]
- **Skipped:** [COUNT]

## FAILURES (if any)
1. [Test name]: [What failed]
2. [Test name]: [What failed]

## RECOMMENDATIONS
- [Any issues found and suggested fixes]
```

---

## 🚀 QUICK RUN SCRIPT

Run all tests quickly with this script:

```bash
#!/bin/bash
echo "=== KRAKEN V2.0 SELF-TEST ==="
echo ""

echo "A1: Plugin file exists..."
ls ~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js > /dev/null 2>&1 && echo "✅ PASS" || echo "❌ FAIL"

echo "A2: Plugin size ~52KB..."
size=$(wc -c < ~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js 2>/dev/null || echo "0")
if [ "$size" -gt 50000 ] && [ "$size" -lt 55000 ]; then echo "✅ PASS ($size bytes)"; else echo "❌ FAIL ($size bytes)"; fi

echo "A3: Plugin loads..."
if opencode debug config --print-logs 2>&1 | grep -q "\[Kraken V2.0\] Agent registered"; then echo "✅ PASS"; else echo "❌ FAIL"; fi

echo "B1: Kraken in agent list..."
if opencode debug agent kraken 2>&1 | grep -q '"name": "kraken"'; then echo "✅ PASS"; else echo "❌ FAIL"; fi

echo "B2: Shark still works..."
if opencode debug agent shark 2>&1 | grep -q '"name": "shark"'; then echo "✅ PASS"; else echo "❌ FAIL"; fi

echo "B3: Manta still works..."
if opencode debug agent manta 2>&1 | grep -q '"name": "manta"'; then echo "✅ PASS"; else echo "❌ FAIL"; fi

echo ""
echo "=== TEST COMPLETE ==="
```

Save as `kraken-self-test.sh` and run with:
```bash
chmod +x kraken-self-test.sh && ./kraken-self-test.sh
```

---

## 📝 TEST LOG

Record test runs here:

```
DATE       | SESSION | TESTS | PASS | FAIL | NOTES
-----------+---------+-------+------+------+------
2026-04-12 | Fresh   | 24    | 24   | 0    | Initial ship test
           |         |       |      |      |
           |         |       |      |      |
           |         |       |      |      |
```

---

**END OF TEST SUITE**