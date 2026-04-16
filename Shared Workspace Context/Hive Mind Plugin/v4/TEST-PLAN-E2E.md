# Hive Mind Plugin v4 — E2E Testing & Verification Plan

**Date:** 2026-04-03  
**Agent:** Build Agent  
**Status:** READY TO EXECUTE  
**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/TEST-PLAN-E2E.md`

---

## Overview

This plan details how to verify the Hive Mind Plugin v4 works end-to-end in a live OpenCode session. The agent will start OpenCode in its own terminal, test each tool and hook, and verify the complete memory flow.

---

## Prerequisites

### Services Must Be Running
```bash
systemctl status openviking.service        # Should be active
systemctl status llama-embedding.service   # Should be active
```

### Plugin Location
```
/ home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts
```

### Config Check
```bash
grep -A2 '"plugin"' ~/.config/opencode/opencode.json
```
Should show the hive-mind-plugin.ts path (not commented out)

---

## Test Phases

### Phase 1: Startup & Terminal Cleanliness

**Goal:** Verify plugin loads without UI pollution

1. Start OpenCode:
   ```bash
   opencode
   ```

2. In a SEPARATE terminal, monitor for UI pollution:
   ```bash
   # Check if any HiveMind output is going to terminal (should be empty)
   # Plugin logs only go to file now: /home/leviathan/.local/share/opencode/hive-mind/hive-mind-plugin.log
   tail -f /home/leviathan/.local/share/opencode/hive-mind/hive-mind-plugin.log | grep -i "hivemind"
   ```

3. **PASS criteria:** No HiveMind output in OpenCode terminal

4. **FAIL criteria:** DEBUG/INFO logs appearing in OpenCode terminal

---

### Phase 2: Plugin Initialization

**Goal:** Verify plugin loads and starts health monitoring

1. In a SEPARATE terminal:
   ```bash
   tail -20 /home/leviathan/.local/share/opencode/hive-mind/hive-mind-plugin.log
   ```

2. Look for:
   - `"HiveMind Plugin loading..."`
   - `"HiveMind Plugin loaded — context sandboxing active"`
   - `"Starting OpenViking health check loop"`
   - `"Starting hook execution canary monitoring"`

3. **PASS criteria:** All startup messages present in log file

4. **FAIL criteria:** Missing messages or errors in startup

---

### Phase 3: Tool Availability

**Goal:** Verify all 5 tools are registered and callable

In OpenCode terminal, ask:
```
Call hive_status and tell me what it returns
```

Expected response should include:
- `plugin: HiveMind`
- `version: 2.0.0-fixed`
- `openViking.connected: true/false`
- `localFallback.enabled: true`
- `canary.uptime: ...`

Then test:
```
Call hive_context with query "test"
```
Expected: Returns something (even if "No results")

---

### Phase 4: Hook Execution Verification

**Goal:** Verify hooks are actually firing (THE CRITICAL TEST)

1. After doing some work in OpenCode (reading files, etc.):
   ```
   Call hive_status again and check canary.totalHookCalls
   ```

2. **PASS criteria:** `totalHookCalls > 0`

3. **FAIL criteria:** `totalHookCalls: 0` after multiple interactions

4. **If hooks don't fire:**
   - Check if OpenCode version supports `experimental.chat.messages.transform`
   - The hooks may simply not be called by this OpenCode version
   - This is a known limitation documented in SHIP.md

---

### Phase 5: Manual Memory Storage (hive_remember)

**Goal:** Verify upload flow works

In OpenCode:
```
Call hive_remember with:
- key: "test-memory"
- content: "This is a test memory created during E2E testing. It contains enough text to pass the gold standard threshold of 2000 characters. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris."
- session_id: (leave empty or use current session ID)
```

**PASS criteria:** Returns "Successfully committed" or similar success message

**FAIL criteria:** Returns error or fallback message

---

### Phase 6: Memory Retrieval (hive_context)

**Goal:** Verify search and fetch work

In OpenCode:
```
Call hive_context with query "test memory E2E testing"
```

**PASS criteria:** Returns the memory stored in Phase 5

**FAIL criteria:** Returns "No relevant context found"

---

### Phase 7: Disable Functionality

**Goal:** Verify plugin can be disabled and actually stops

1. In OpenCode, try to disable:
   ```
   Disable the hive mind plugin
   ```

2. Then check in log file:
   ```
   tail -10 /home/leviathan/.local/share/opencode/hive-mind/hive-mind-plugin.log
   ```

3. Look for:
   - `"HiveMind Plugin is DISABLED in config - not starting"` (if config-based)
   - Or verify no new log entries after disable

4. **Verify plugin stopped:**
   - `totalHookCalls` should stop incrementing
   - No more health checks logged

5. **CRITICAL TEST:** Start a new OpenCode session and verify plugin does NOT load

---

### Phase 8: OpenViking Outage Resilience

**Goal:** Verify local fallback when OpenViking is down

1. With plugin working, kill OpenViking:
   ```bash
   sudo systemctl stop openviking.service
   ```

2. In OpenCode, try to store a memory:
   ```
   Call hive_remember with key "outage-test" and content "Testing fallback"
   ```

3. **PASS criteria:** Succeeds (writes to local fallback)

4. Restart OpenViking:
   ```bash
   sudo systemctl start openviking.service
   ```

5. Verify it comes back healthy

---

## Test Commands Quick Reference

### In Terminal 1 (OpenCode)
```bash
opencode
# Then interact with the agent
```

### In Terminal 2 (Log Monitor)
```bash
# Real-time log monitoring
tail -f /home/leviathan/.local/share/opencode/hive-mind/hive-mind-plugin.log

# Search for specific patterns
grep -i "hook\|error\|warn" /home/leviathan/.local/share/opencode/hive-mind/hive-mind-plugin.log | tail -20
```

### In Terminal 3 (Service Management)
```bash
# Check services
systemctl status openviking.service
systemctl status llama-embedding.service

# Restart if needed
sudo systemctl restart openviking.service
sudo systemctl restart llama-embedding.service

# Disable plugin (if needed for testing)
# Edit ~/.config/opencode/opencode.json and comment out the plugin line
```

---

## Expected Test Results

| Phase | Test | Expected Result |
|-------|------|----------------|
| 1 | Terminal Cleanliness | No UI pollution |
| 2 | Plugin Init | Startup messages in log |
| 3 | Tools Available | All 5 tools respond |
| 4 | Hooks Fire | totalHookCalls > 0 |
| 5 | hive_remember | Memory stored |
| 6 | hive_context | Memory retrieved |
| 7 | Disable | Plugin stops |
| 8 | Outage | Fallback works |

---

## Known Limitations

1. **Hooks may not fire** if OpenCode 1.3.9 doesn't support `experimental.chat.messages.transform`
2. **Session linking** (`memlink_parent`) stores links but doesn't use them for retrieval

---

## Success Criteria

**ALL phases must PASS for production deployment.**

If any phase fails:
1. Document the failure
2. Check log file for error details
3. Report to developer with:
   - Phase that failed
   - Expected vs actual behavior
   - Relevant log excerpts

---

## Files for Reference

- **Plugin:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts`
- **Ship Report:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/SHIP.md`
- **Integration Tests:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/tests/integration/run-integration-tests.sh`
