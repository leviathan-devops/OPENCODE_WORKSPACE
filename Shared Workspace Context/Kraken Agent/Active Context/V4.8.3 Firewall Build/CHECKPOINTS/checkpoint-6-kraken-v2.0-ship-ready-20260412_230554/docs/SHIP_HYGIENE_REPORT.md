# SHIP HYGIENE REPORT — Kraken V2.0

**Date:** 2026-04-12 (Updated)
**Plugin:** kraken-agent-v2.0
**Status:** CORRECTIONS APPLIED

---

## CRITICAL CORRECTIONS

### ⚠️ HOOK ARRAYS ARE NOT ALLOWED

**OLD (INCORRECT) INFO:**
```typescript
'tool.execute.after': [createToolSummarizerHook(), createGateHook()]
```

**NEW (CORRECT) INFO:**
```typescript
'tool.execute.after': async (input, output) => {
  await createToolSummarizerHook()(input, output);
  await createGateHook()(input, output);
}
```

**Why:** OpenCode calls `safeHook(hookFunction)(input, output)` - it does NOT iterate arrays.

### ⚠️ `session.ended` IS NOT A VALID HOOK EVENT

**OLD (INCORRECT) INFO:**
```typescript
'session.ended': createSessionCleanupHook()
```

**Problem:** `session.ended` is NOT a valid event. Using it causes undefined behavior.

**CORRECT Approach:** 
- Use `session.created` to initialize state
- Use session-isolated state stores (Map by sessionId)
- Let garbage collection handle cleanup

### ⚠️ Tool Summarization Was Missing

**Problem:** Large tool outputs (50KB+) were consuming all tokens

**Fix:** Added summarization directly in `tool.execute.after` hook:
```typescript
if (outputStr.length > 5000) {
  output.result = summarize(output, 5000);
}
```

---

## CURRENT HOOK ARCHITECTURE (CORRECT)

```
event:createSession      → Initialize brains (session.created only)
event:session.compacting → Write recovery file ONLY (no output.context)
chat.message             → Message Guardian with identity wall
tool.execute.before      → Tool Guardian (Layer 1)
tool.execute.after       → Gate Hook + Tool Summarization (combined)
```

**NOTE:** All hooks are SINGLE FUNCTIONS, not arrays.

---

## TOKEN OPTIMIZATION

| Tool Output Size | Before | After |
|-----------------|--------|-------|
| 50KB+ (grep) | 50KB full | ~500 chars summarized |
| 10KB (ls) | 10KB full | ~200 chars |
| 25KB (read) | 25KB full | ~2KB summarized |

---

## COMPACTION SURVIVAL (CORRECT PATTERN)

### WRONG (Causes 100K Token Bloat):
```typescript
// DO NOT DO THIS
output.context.push(contextStr);  // ❌ WRONG
```

### CORRECT (Writes to File):
```typescript
// Write to recovery file
const contextDir = '/tmp/kraken-compaction/${sessionId}';
fs.mkdirSync(contextDir, { recursive: true });
fs.writeFileSync(path.join(contextDir, 'INJECTION.md'), contextStr);

// DO NOT touch output.context
```

---

## SESSION HISTORY LOSS ROOT CAUSE

NOT a save/restore bug - it's the memory death spiral:
1. OOM from multi-GB database + GC thrashing
2. Multiple opencode instances compound memory
3. Sessions crash, context lost

**Solution Architecture:**
- Tool summarization (reduce output sizes)
- Compaction to FILE (not context)
- Session-isolated state stores
- Database vacuum maintenance

---

## PRE-SHIP CHECKLIST

- [ ] Hooks are SINGLE FUNCTIONS (not arrays)
- [ ] NO experimental hooks (session.ended, etc.)
- [ ] Agent registration uses Object.assign (defensive)
- [ ] Identity wall on all chat.message hooks
- [ ] Tool summarization on tool.execute.after
- [ ] Compaction writes to FILE only (no output.context)
- [ ] Tested in TUI container (not opencode run)
- [ ] Checkpoint created before ship
- [ ] v1.x preserved (zero overwrites)
- [ ] Cross-plugin test: Manta + Shark still work
- [ ] Memory check: DB size < 500MB

---

## REFERENCE: CORRECT HOOK PATTERNS

### Single Function Chain (NOT array):
```typescript
'tool.execute.after': async (input, output) => {
  await toolSummarizer(input, output);
  await gateHook(input, output);
}
```

### Identity Wall on chat.message:
```typescript
'chat.message': async (input, output) => {
  const { agent } = input as { agent?: string };
  if (agent !== 'kraken') return;  // Identity wall
  // Process...
}
```

### Compaction to File Only:
```typescript
if (event.type === 'session.compacting') {
  fs.writeFileSync('/tmp/kraken-compaction/INJECTION.md', context);
  // NO output.context.push()
}
```

---

## VALID HOOK EVENTS

Only these are valid:
- `session.created` ✅
- `session.compacting` ⚠️ (use carefully, write to FILE)
- `chat.message` ✅
- `tool.execute.before` ✅
- `tool.execute.after` ✅

NOT valid:
- `session.ended` ❌ (NOT a real event)
- `experimental.*` ❌ (unless explicitly documented)

---

**Last Updated:** 2026-04-12
**Corrected By:** Session crash recovery
