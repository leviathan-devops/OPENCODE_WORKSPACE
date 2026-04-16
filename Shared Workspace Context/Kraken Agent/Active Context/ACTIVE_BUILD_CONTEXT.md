# KRAKEN V2.0 - ACTIVE BUILD CONTEXT
**Last Updated:** 2026-04-12 19:00
**Status:** ✅ TUI CONTAINER TESTING COMPLETE - READY FOR SHIP

---

## 📍 ACTIVE BUILD LOCATION

```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0-Build-Final/
```

---

## 🧪 TUI CONTAINER TEST RESULTS (2026-04-12)

### Test Summary
| Test | Result |
|------|--------|
| Plugin Loading | ✅ PASS |
| Agent Registration | ✅ PASS |
| Agent Debug | ✅ PASS |
| TUI Mode Launch | ✅ PASS |
| Shark/Manta Still Work | ✅ PASS |
| Hook Registration | ✅ PASS |

### Key Fixes Discovered
1. **Plugin Export Format**: Changed from object to async function
2. **Agent Registration**: Added `config: async` function with KRAKEN_AGENT_CONFIG

---

## 🔴 SHIP FAILURE SUMMARY (Colossal)

### What Happened
1. Kraken V2.0 deployed to production without TUI container testing
2. Hook array format was WRONG - OpenCode expects single functions, not arrays
3. Agent registration corrupted the config, breaking ALL agents (Shark, Manta gone)
4. Memory pressure from 2.76GB database + bad plugin = crash cascade
5. Session crashes → context loss on restart

### The 4 Critical Failures

| # | Failure | Impact |
|---|---------|--------|
| 1 | **No TUI Container Testing** | `opencode run` has broken hooks - only TUI mode works |
| 2 | **Wrong Hook Format** | `'hook.name': [fn1, fn2]` → should chain internally |
| 3 | **Experimental Hooks** | `session.ended` is NOT a valid event |
| 4 | **Config Corruption** | Agent registration broke all agents |

### Lesson Learned
> **If you did not test it in a TUI container, it is NOT tested.**

---

## ✅ FIXES APPLIED

### 1. Hook Format Fixed
```typescript
// BEFORE (WRONG)
'tool.execute.after': [createToolSummarizerHook(), createGateHook()]

// AFTER (CORRECT)
'tool.execute.after': async (input, output) => {
  await createToolSummarizerHook()(input, output);
  await createGateHook()(input, output);
}
```

### 2. Experimental Hooks Removed
- Removed `session.ended` (invalid event)
- Removed `experimental.session.compacting`

### 3. Valid Hook Events Only
- `session.created` ✅
- `session.compacting` ✅
- `chat.message` ✅
- `tool.execute.before` ✅
- `tool.execute.after` ✅

### 4. Agent Identity Wall Pattern
- `chat.message` initializes agent identity (has `agent` field)
- `session.created` CANNOT init identity (no `agent` field)
- All other hooks check identity wall first

---

## 📦 CURRENT BUILD STATE

### Files (from checkpoint-5-kraken-v2.0-fixed-20260412_220742)

| File | Size | Status |
|------|------|--------|
| `dist/index.js` | 51,312 bytes | ✅ Latest fixed version |
| `src/hooks/index.ts` | 333 lines | ✅ In sync |
| `src/index.ts` | 119 lines | ✅ In sync |
| `package.json` | 594 bytes | ✅ In sync |

### Documentation
- `SHIP_FAILURE_FORENSIC.md` - Full autopsy of the crash
- `MANDATORY_PRE_SHIP_CHECKLIST.md` - Must-read before shipping
- `TUI_CONTAINER_TESTING_WORKFLOW.md` - Step-by-step TUI testing
- `GUARDRAILS.md` - Behavior guardrails
- `CROSS_PLUGIN_FIREWALL.md` - Plugin isolation
- `RECOVERY_PROTOCOLS.md` - If something goes wrong

---

## 🎯 NEXT STEP: TUI CONTAINER TESTING

### Available Docker Image
```
opencode-test:1.4.3 (1.74GB) - Custom image matching local OpenCode 1.4.3
```

### Test Workflow

```bash
# 1. Start container
docker run --rm -d \
  --name kraken-v2-tui-test \
  -v "/tmp/kraken-test-config":/root/.config/opencode \
  opencode-test:1.4.3 \
  sleep infinity

# 2. Copy plugin to container
docker cp "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0-Build-Final/dist/" \
  kraken-v2-tui-test:/root/.config/opencode/plugins/kraken-agent-v2.0/dist/

# 3. Launch TUI
docker exec -it kraken-v2-tui-test \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent kraken

# 4. Verify in TUI:
#    - kraken appears in agent tab
#    - /kraken-status works
#    - Other agents (Manta, Shark) still work
#    - Hooks fire correctly
```

### Test Verification Checklist
- [ ] Kraken appears in agent tab toggle
- [ ] `/kraken-status` returns version 2.0.0
- [ ] Manta and Shark agents still available
- [ ] `opencode run` still fails (expected - hooks broken in run mode)
- [ ] TUI mode fires all hooks correctly

---

## 🧠 KRAKEN V2.0 ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        KRAKEN V2.0                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐ │
│  │   System    │  │  Execution  │  │  Planning   │  │Council│ │
│  │   Brain     │  │   Brain     │  │   Brain     │  │        │ │
│  │  (Gate+     │  │ (Task+      │  │ (Plan+      │  │ 4-Brain│
│  │  Compact)   │  │  Override)   │  │  Verify)    │  │Council │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: Tool Guardian (tool.execute.before)                  │
│  - Blocks dangerous tools                                       │
│  - Identity wall check                                         │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: Message Guardian (chat.message)                       │
│  - Pattern enforcement                                         │
│  - Agent identity initialization                               │
├─────────────────────────────────────────────────────────────────┤
│  HOOKS: event (session.created/compacting) + tool.execute.after │
│  - Gate evaluation                                             │
│  - Tool summarization                                          │
│  - Compaction recovery                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 CHECKPOINT HISTORY

| Checkpoint | Date | Notes |
|------------|------|-------|
| checkpoint-1-shark-v4.8.3 | Earlier | Shark v4.8.3 build |
| checkpoint-2-kraken-v2.0 | Earlier | Initial Kraken V2 |
| checkpoint-2-kraken-v2.0-FINAL | Earlier | Pre-hook-fix |
| checkpoint-3-kraken-v2.0-hooks-complete | Earlier | Hooks implemented |
| checkpoint-3-kraken-v2.0-with-token-fix | Earlier | Token fix |
| checkpoint-4-kraken-v2.0-complete | Apr 12 18:41 | Pre-ship-failure |
| checkpoint-5-kraken-v2.0-fixed | Apr 12 22:16 | **POST-FAILURE FIX** |

---

## 🔑 KEY FILES

| Purpose | Path |
|---------|------|
| **Active Build** | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0-Build-Final/` |
| **Plugin Bundle** | `V2.0-Build-Final/dist/index.js` (51KB) |
| **Hook Source** | `V2.0-Build-Final/src/hooks/index.ts` |
| **Test Script** | `V2.0-Build-Final/test-tui.sh` |
| **Dockerfile** | `V2.0-Build-Final/container/Dockerfile` |
| **Launchpad** | `/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md` |

---

## ⚠️ MANDATORY PRE-SHIP CHECKLIST

1. ✅ Code review complete
2. ✅ Hook format verified (no arrays)
3. ✅ Valid hook events only
4. ⏳ **TUI Container Testing** ← YOU ARE HERE
5. ⏳ Agent tab verification
6. ⏳ Other agents still work
7. ⏳ Ship gate evaluation

---

## 🚀 READY TO PROCEED

All artifacts consolidated. Build is in sync with checkpoint-5 (latest fixed version).
**Next action: Run TUI container testing before attempting ship.**