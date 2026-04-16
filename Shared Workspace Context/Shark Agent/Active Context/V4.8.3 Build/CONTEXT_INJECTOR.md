# CONTEXT INJECTOR - Shark Agent v4.8.3 Build Continuity

**Use after session compaction to restore build state.**

---

## AUTO-INJECTION (No Manual Action Needed)

The build context is now **automatically injected** on every compaction and session start:

1. **compacting-hook.ts** → Writes `.shark/build-context.md` during compaction
2. **system-transform-hook.ts** → Reads `.shark/build-context.md` on first system transform
3. **session-hook.ts** → Triggers context injection on session.created

**No manual action required.** Just continue using the agent.

---

## MANUAL RESTORE (If Needed)

If for some reason you need to manually restore context, here's the current state:

### Current Status

**Build Status:** NOT SHIP READY
**L5 Message Blocking:** ✅ WORKING (11/11 tests pass)
**L1-L4 Tool Blocking:** ❌ BROKEN (getCurrentAgent() returns undefined)

### The Bug

In `src/hooks/v4.1/guardian-hook.ts:469-471`:
```typescript
if (!getCurrentAgent()) {
  return;  // ← ALL L1-L4 checks bypassed when this returns undefined
}
```

`getCurrentAgent()` returns `undefined` even though `chat.message` hook has already called `setCurrentAgent('shark')`.

### Auto-Injection Flow

```
Compaction fires → compacting-hook.ts writes .shark/build-context.md
       ↓
Session starts → system-transform-hook.ts reads and injects into system prompt
       ↓
Build context available to agent immediately
```

---

## QUICK REFERENCE

### What's Working
- L5 message-level blocking (11/11 tests)
- Pattern counts (15/15 arrays, 156 patterns)
- Build (0.60 MB, 102 modules)
- Memory (no nested agents)
- Auto-injection of build context

### What's Broken
- L1-L4 tool-level blocking (guardian-hook.ts:469)

### Key Files
- `src/hooks/v4.1/compacting-hook.ts` - Writes context on compaction
- `src/hooks/v4.1/system-transform-hook.ts` - Reads context on session start
- `src/hooks/v4.1/guardian-hook.ts` - L1-L4 broken (line 469)

---

## TESTING

### Test L5 (Working)
```bash
echo "skip container test" | timeout 120 docker exec -i CONTAINER /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark --model opencode/big-pickle 2>&1 | grep 'ANTI-DERAILMENT'
```

### Test L1 (Broken)
```bash
echo "run grep pattern | wc -l" | timeout 120 docker exec -i CONTAINER /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark --model opencode/big-pickle 2>&1 | grep 'ANTI-SLOP'
```

### Build Commands
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin
bun run test-patterns.ts  # Verify 15/15
```

---

## SUCCESS CRITERIA

- [ ] L1 blocks theatrical commands
- [ ] L2 blocks fake test runners
- [ ] L5 still blocks behavioral derailment
- [ ] 15/15 pattern arrays verified
- [ ] Build succeeds (0.60 MB)
- [ ] Auto-injection works after compaction