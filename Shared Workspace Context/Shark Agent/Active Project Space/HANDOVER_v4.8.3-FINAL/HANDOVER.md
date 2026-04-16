# Shark Agent v4.8.3 - Full Handover Package

**Generated:** 2026-04-13  
**Status:** READY FOR CONTINUATION  
**Location:** `HANDOVER_v4.8.3-FINAL/`

---

## EXECUTIVE SUMMARY

Shark Agent v4.8.3 with L1-L5 Anti-Slop Firewall is feature complete and ready for final deployment. Critical fixes have been applied to resolve user message blocking issue.

### What's Working
- L1-L5 firewall blocking on agent output
- User messages pass through (UC1 fix applied)
- Pattern gap fixes from pressure testing
- Container testing infrastructure

### Critical Issue Being Investigated  
- Need to mechanically verify ALL firewalls fire correctly in container
- Some tests may be showing simulated success vs actual blocking

---

## THE UC1 FIX (CRITICAL)

**Problem:** User messages were being blocked by the firewall.

**Root Cause:** `chat-message-hook.ts` checked BOTH user input AND agent output.

**Fix Applied:** Changed line 486 to ONLY check agent output:

```typescript
// File: src/hooks/v4.1/chat-message-hook.ts

// BEFORE (WRONG - blocks user messages)
const text = extractTextFromMessage(input) + ' ' + extractTextFromParts(output?.message?.parts) + ' ' + extractTextFromParts(output?.parts);

// AFTER (CORRECT - only checks agent output)
const agentText = extractTextFromParts(output?.message?.parts) + ' ' + extractTextFromParts(output?.parts);
```

---

## BUILD AND DEPLOY COMMANDS

```bash
# Build
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin

# Deploy to container
cp dist/index.js /tmp/shark-container/plugins/shark-agent-v4.8.3/

# Deploy to local (if needed)
cp dist/index.js ~/.config/opencode/plugins/shark-agent-v4.8.3/
```

---

## CONTAINER TESTING (CRITICAL - MUST USE)

**ALL testing must happen in container. Local device has NO effect on plugin behavior.**

```bash
# Deploy first
cp /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js /tmp/shark-container/plugins/shark-agent-v4.8.3/

# Run tests in container
docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "TEST_COMMAND" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti\|error"
```

### Test These Commands (MECHANICAL VERIFICATION REQUIRED)

**User messages - should NEVER block:**
```bash
docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "ship package" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "give me a build package" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "ls -la /tmp" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"
```

**Agent output - should ALWAYS block:**
```bash
docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "npm test" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "npm run test" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "skip container test" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "ls | wc -l" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "echo test | wc" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "ship now" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "deploy now" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "host already works so skip" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "it mostly works trust me" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"
```

**Legitimate commands - should work:**
```bash
docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "ls -la /" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "whoami" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"

docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "pwd" --agent shark --model opencode/big-pickle 2>&1 | grep -i "anti"
```

---

## PATTERN TESTS

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun run test-patterns.ts
```

Expected: 15/15 PASSED

---

## KEY FILES

| File | Purpose |
|------|---------|
| `src/hooks/v4.1/chat-message-hook.ts` | Main firewall hook (UC1 fix here) |
| `src/hooks/v4.1/agent-state.ts` | Session-based state management |
| `dist/index.js` | Built plugin bundle |
| `docs/FIREWALL_ENGINEERING_ANCHORS.md` | Firewall architecture docs |

---

## ANTI-SLOP FIREWALL LAYERS

| Layer | Name | Blocks |
|-------|------|--------|
| L1 | Theatrical | `ls \| wc`, `grep \| wc`, `cat \| wc` |
| L2 | Fake Test Runners | `npm test`, `npm run test`, `pytest`, etc. |
| L3 | Dangerous Tools | `rm -rf`, `mkfs`, `dd`, etc. |
| L4 | Scope Creep | Task hijacking patterns |
| L5 | Anti-Derailment | Host fallback, impatience, confusion pretense |

---

## PATTERN GAP FIXES (HOTFIX1)

Applied fixes for patterns that were too permissive:

1. `npm run test` - Changed to `/npm\s+(run\s+)?test/i`
2. `echo test | wc` - Added `/echo.*\|.*wc/i`
3. `host already works` - Added `/host.*already.*works/i`
4. `mostly works` - Removed leading space requirement
5. `ship now` - Changed to `/ship\s+(it|now)\b/i`

---

## OPENCODE.JSON CONFIG

**DO NOT EDIT** - Current config is for Kraken stability.

For v4.8.3 standalone deployment:
```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js"
  ],
  "permission": {
    "*": {"*": "allow"}
  }
}
```

---

## KNOWN ISSUES / TODO

1. **Mechanical Verification Needed** - Run full pressure test in container
2. **User Message Test** - Verify "ship package" does NOT block
3. **Agent Output Test** - Verify all bad patterns DO block
4. **Derailment Test** - Verify "skip container test" blocks
5. **Final Ship Package** - Generate after verification

---

## FIREWALL ANCHOR ARCHITECTURE

The firewall fires at anchor points:

1. **`chat.message`** - Checks agent output (ONLY after UC1 fix)
2. **`command.execute.before`** - Pre-execution (TUI only, NOT `opencode run`)
3. **`tool.execute.before`** - Tool-level blocking

**Key insight:** `opencode run` goes through `chat.message`, NOT `command.execute.before`

---

## CHECKPOINTS

- `FINAL_UC1_FIX/` - UC1 fix checkpoint
- `HANDOVER_v4.8.3-FINAL/` - This handover package

---

## DEPLOYMENT WORKFLOW

1. Build: `bun build src/index.ts --outdir dist...`
2. Deploy: `cp dist/index.js /tmp/shark-container/plugins/shark-agent-v4.8.3/`
3. Test: `docker run ... opencode-test:1.4.3 run "TEST" ... | grep anti`
4. Verify: All user messages should NOT block
5. Verify: All bad agent patterns SHOULD block
6. Package: Create final ship package

---

## CONTEXT FOR NEXT SESSION

- Shark Agent v4.8.3 is feature complete
- UC1 fix (user message blocking) has been applied
- Need to mechanically verify ALL firewall behaviors in container
- Do NOT trust local testing - container is the source of truth
- If any test fails, fix and retest in container only
