# SHIP FAILURE FORENSIC REPORT - KRAKEN V2.0

**Date:** 2026-04-12
**Severity:** CATASTROPHIC
**Damage:** Vanilla OpenCode broken, Manta/Sark agents gone, memory crisis

---

## WHAT HAPPENED

1. Kraken V2.0 deployed to production without TUI container testing
2. Hook array format was WRONG - OpenCode expects single functions
3. Experimental hooks used that may crash the session
4. Agent registration corrupted the config, breaking ALL agents
5. Memory pressure from 2.76GB database + bad plugin = crash cascade

---

## THE MISTAKE CHAIN

```
Built Kraken V2.0
    ↓
Never tested in TUI container ← CRITICAL FAILURE #1
    ↓
Updated opencode.json to ONLY Kraken V2.0 ← CRITICAL FAILURE #2
    ↓
Deployed to ~/.config/opencode/plugins/
    ↓
OpenCode loaded Kraken V2.0
    ↓
Hooks with WRONG FORMAT loaded ← CRITICAL FAILURE #3
    ↓
Agent registration via config corrupted config ← CRITICAL FAILURE #4
    ↓
Manta disappears from tab toggle
Shark disappears from tab toggle
Tools stop working
    ↓
Session crashes
Memory pressure compounds
    ↓
Context loss on restart
```

---

## FAILURE #1: NO TUI CONTAINER TESTING

### What We Did
- Ran bundle verification (grep for function names)
- Called it "tested"

### What We Should Have Done
- Build custom Docker image matching local OpenCode version (1.4.3)
- Mount plugin into container
- Launch TUI: `docker exec -it container opencode --agent kraken`
- Actually USE the agent in TUI
- Verify Manta/Shark still work with Kraken loaded

### Why This Matters
`opencode run` has BROKEN hooks. Only TUI mode has full hook support.

---

## FAILURE #2: WRONG HOOK FORMAT

### What We Did
```typescript
'tool.execute.after': [createToolSummarizerHook(), createGateHook()]
```

### Why It's Wrong
OpenCode's hook system calls `safeHook(hookFunction)(input, output)`. It doesn't iterate arrays.

### Correct Pattern
```typescript
'tool.execute.after': async (input, output) => {
  await createToolSummarizerHook()(input, output);
  await createGateHook()(input, output);
}
```

---

## FAILURE #3: EXPERIMENTAL HOOKS

### What We Used
- `experimental.session.compacting`
- `session.ended` (NOT EVEN A VALID EVENT)

### Why It's Dangerous
Experimental hooks can crash the session if they throw. Invalid events cause undefined behavior.

### Valid Hook Events Only
- `session.created` ✅
- `session.compacting` ⚠️ (experimental, use carefully)
- `chat.message` ✅
- `tool.execute.before` ✅
- `tool.execute.after` ✅

---

## FAILURE #4: AGENT REGISTRATION CORRUPTION

### What We Did
```typescript
config: async (opencodeConfig) => {
  Object.assign(opencodeConfig.agent, agents);
}
```

### Why It's Dangerous
If `opencodeConfig.agent` is undefined, `Object.assign` could corrupt the entire config object, breaking ALL agents including Manta and Shark.

### Correct Pattern
```typescript
config: async (opencodeConfig) => {
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = {};
  }
  Object.assign(opencodeConfig.agent, agents);
}
```

---

## FAILURE #5: NO CROSS-PLUGIN TESTING

### What We Did
- Only loaded Kraken V2.0
- Never tested with Manta/Shark

### Why It's Critical
A plugin can break other plugins through:
- Hook conflicts
- Config corruption
- Memory pressure
- Shared state pollution

### Correct Test Sequence
1. Load Kraken V2.0 ALONE → verify works
2. Load Kraken V2.0 + Manta → verify both work
3. Load Kraken V2.0 + Manta + Shark → verify all work
4. Verify tools work for EACH agent type

---

## FAILURE #6: NO MEMORY CHECK

### What We Missed
- Database was 2.76GB
- Memory at 7GB+ before plugin load
- Plugin could push over edge

### Correct Process
1. Check memory before plugin load
2. Load plugin
3. Check memory after load
4. If >80% used, DO NOT SHIP

---

## RECOVERY VERIFICATION

After restoring v1.1:
- [ ] Manta appears in tab toggle
- [ ] Shark appears in tab toggle
- [ ] Tools work normally
- [ ] Memory stable
- [ ] No crashes after 5 minutes

---

## PRE-SHIP CHECKLIST

### Phase 1: Build
- [ ] Bundle size reasonable (50-60KB)
- [ ] All exports present
- [ ] No experimental hooks
- [ ] Single-function hook format

### Phase 2: Container Test (MANDATORY)
- [ ] Custom Docker image with matching OpenCode version
- [ ] Mount plugin into container
- [ ] Launch TUI mode
- [ ] Select agent from tab toggle
- [ ] Run test commands
- [ ] Verify tools work
- [ ] Check memory

### Phase 3: Cross-Plugin Test (MANDATORY)
- [ ] Load new plugin alone
- [ ] Load with Manta
- [ ] Load with Shark
- [ ] All agents work
- [ ] Tools work for each

### Phase 4: Production
- [ ] Backup current config
- [ ] Deploy plugin
- [ ] Restart OpenCode
- [ ] Verify all agents present
- [ ] Monitor memory

---

**END OF FORENSIC REPORT**
