# KRAKEN V2.0 SHIP FAILURE ANALYSIS

**Date:** 2026-04-12
**Ship Result:** DISASTER - Vanilla OpenCode broken, Manta/Sark broken

---

## FAILURE SUMMARY

The Kraken V2.0 ship caused:
1. Vanilla OpenCode tools stopped working
2. Manta agent disappeared from tab toggle
3. Shark agent disappeared from tab toggle
4. Memory pressure/crashing

---

## ROOT CAUSES

### 1. CRITICAL: Hook Array Format

**What We Did:**
```typescript
'tool.execute.after': [createToolSummarizerHook(), createGateHook()]
```

**Problem:** OpenCode hooks expect a SINGLE function, NOT an array. The SDK documentation shows hooks as single hook functions.

**Evidence:** The hook system calls `safeHook(hookFunction)(input, output)` - it doesn't iterate over arrays.

**Fix:** Chain hooks internally, not as an array:
```typescript
'tool.execute.after': async (input, output) => {
  await createToolSummarizerHook()(input, output);
  await createGateHook()(input, output);
}
```

### 2. CRITICAL: `session.ended` Hook

**What We Did:**
```typescript
if (event.type === 'session.ended') { ... }
```

**Problem:** `session.ended` is NOT a valid hook event type. Valid events are:
- `session.created`
- `session.compacting`

The invalid event handler may have caused undefined behavior.

**Fix:** Remove `session.ended` handling, use alternative cleanup mechanism.

### 3. CRITICAL: `experimental.session.compacting` Hook

**What We Did:**
```typescript
'experimental.session.compacting': createCompactionHook()
```

**Problem:** This is an EXPERIMENTAL hook - may not be fully supported. If it throws, it could crash the session.

**Fix:** Check if hook exists before using, or implement compaction via other means.

### 4. CRITICAL: Agent Registration via `config` Callback

**What We Did:**
```typescript
config: async (opencodeConfig) => {
  Object.assign(opencodeConfig.agent, agents);
}
```

**Problem:** If `opencodeConfig.agent` is undefined or structured unexpectedly, `Object.assign` could corrupt the entire config object, breaking ALL agents.

**Fix:** Defensive coding:
```typescript
config: async (opencodeConfig) => {
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = {};
  }
  Object.assign(opencodeConfig.agent, agents);
}
```

### 5. Memory: Database Bloat

**Problem:** 2.76GB database + 7GB memory usage from manager/worker architecture. Shipping Kraken V2.0 with any memory issues compounds this.

**Fix:** V2.1 needs memory guardian. V2.0 should have been lighter.

---

## WHAT WAS TESTED (vs WHAT WAS NOT)

### Was NOT Tested (Should Have Been):
- [ ] TUI container test with matching OpenCode version
- [ ] Other plugins still work after Kraken loads
- [ ] Memory usage after loading Kraken
- [ ] Tool execution still works for non-kraken agents
- [ ] Agent tab toggle for Manta/Shark still works

### Was Tested (Insufficiently):
- [x] Bundle size (54KB)
- [x] Bundle contains function names (grep)
- [x] Hook array format (wrong assumption)

---

## THE MISTAKE CHAIN

```
1. Built Kraken V2.0 with hooks array format
2. Never tested in TUI container
3. Updated opencode.json to ONLY have Kraken V2.0
4. Deployed to local ~/.config/opencode/plugins/
5. Restarted OpenCode
6. OpenCode loaded Kraken V2.0
7. Kraken V2.0 registered hooks with WRONG FORMAT
8. Hook system may have crashed or misfired
9. Agent registration via config corrupted other agents
10. Manta and Shark disappeared from tab toggle
11. Tools stopped working
12. Session crashed
13. Restart showed empty history (memory pressure)
```

---

## LESSONS FOR FUTURE SHIPS

### Pre-Ship Checklist (MANDATORY)

- [ ] **TUI Container Test** - Must test in real TUI, not just bundle grep
- [ ] **Version Match** - Container must match local OpenCode version
- [ ] **Other Plugins Test** - Verify Manta/Shark still work after new plugin
- [ ] **Memory Check** - Monitor memory before/after plugin load
- [ ] **Single Hook Format** - Hooks are SINGLE functions, not arrays
- [ ] **No Experimental Hooks** - Don't use `experimental.*` hooks unless documented
- [ ] **Agent Isolation** - New plugin's config callback must not affect other agents

### Hook Format Rules

```typescript
// WRONG - array not supported
'tool.execute.after': [hook1, hook2]

// CORRECT - chain internally
'tool.execute.after': async (input, output) => {
  await hook1(input, output);
  await hook2(input, output);
}
```

### Valid Hook Events

| Event | Valid | Notes |
|-------|-------|-------|
| session.created | ✅ | Standard |
| session.compacting | ⚠️ | Experimental, may not fire |
| session.ended | ❌ | NOT A HOOK EVENT |
| chat.message | ✅ | Standard |
| tool.execute.before | ✅ | Standard |
| tool.execute.after | ✅ | Standard |

---

## RECOVERY STEPS

1. Restore v1.1 from backup
2. Verify Manta/Shark return to tab toggle
3. Verify tools work again
4. Delete Kraken V2.0 plugin from opencode.json
5. Wait for memory to stabilize
6. Review failure analysis
7. Fix Kraken V2.0 with single-hook format
8. Test in container BEFORE shipping
9. Test with other plugins loaded

---

## V2.0 MUST BE REBUILT WITH:

1. Single hook functions (no arrays)
2. No experimental hooks
3. No session.ended handling
4. Defensive agent registration
5. TUI container test with ALL plugins
6. Memory monitoring
7. V1.1 still works test

---

**END OF FAILURE ANALYSIS**
