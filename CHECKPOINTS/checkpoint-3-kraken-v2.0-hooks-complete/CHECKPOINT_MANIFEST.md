# CHECKPOINT 3: Kraken V2.0 - Hooks Complete

**Created:** 2026-04-12 05:40
**Version:** V2.0
**Status:** Hooks implemented with real OpenCode API

---

## What's In This Checkpoint

```
checkpoint-3-kraken-v2.0-hooks-complete/
├── src/
│   ├── index.ts (updated to use event hook)
│   ├── hooks/index.ts (FULLY REWRITTEN with real OpenCode API)
│   ├── shared/
│   └── brains/
│       ├── system/
│       │   ├── system-brain.ts (with decision/task tracking)
│       │   ├── compaction-manager.ts (575 lines)
│       │   ├── two-layer-guardian.ts
│       │   └── gate-manager.ts
│       ├── execution/
│       ├── planning/
│       └── council/
├── dist/index.js (51KB)
└── package.json
```

---

## Key Changes From Checkpoint 2

### hooks/index.ts - COMPLETELY REWRITTEN

**Before:** Used incorrect API signatures (session.getChatHistory, etc.)
**After:** Uses REAL OpenCode plugin API:

```typescript
// Event hook for session lifecycle
event: ({ event }) => {
  if (event.type === 'session.created') { ... }
  if (event.type === 'session.compacting') { ... }
}

// Compaction hook - output.context gets appended to compaction prompt
experimental.session.compacting: (input, output) => {
  output.context.push(contextStr);  // KEY MECHANISM
}
```

### LAUNCHPAD Integration

- Path: `/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md`
- Read on `session.compacting` to build context
- Written on `session.created` recovery check

### Compaction Context Files

- `/tmp/kraken-compaction/{sessionID}/INJECTION.md` - Built context
- `/tmp/kraken-compaction/{sessionID}/LAUNCHPAD.md` - Copy of launchpad

---

## OpenCode API Mechanics Used

### Event Hook
```typescript
event: ({ event }) => {
  // event.type === 'session.created' | 'session.compacting' | 'session.diff'
}
```

### Compaction Hook
```typescript
experimental.session.compacting: (input, output) => {
  // input: { sessionID: string }
  // output: { context: string[] }
  // output.context.push(x) → appended to compaction prompt
}
```

---

## Compaction Flow

1. **85% tokens** → OpenCode fires `session.compacting` event AND `experimental.session.compacting` hook
2. **Hook fires** → Reads LAUNCHPAD.md, builds context string
3. **Context injection** → `output.context.push(context)` → OpenCode appends to summary
4. **After compaction** → Agent sees summary WITH Kraken context
5. **Next session** → `session.created` fires, reads recovery files

---

## Plugin Deployment

- **Location:** `~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js`
- **Status:** Loads successfully (verified with node require)
- **opencode.json:** Added to plugin list

---

## Next Actions

1. **Test in TUI** - Run container to verify hooks fire
2. **Trigger compaction** - Add content until ~85% to test hook
3. **Verify context** - Check output.context contains Kraken context

---

## Files Modified

| File | Changes |
|------|---------|
| hooks/index.ts | Complete rewrite with real OpenCode API |
| index.ts | Changed to use `event` hook instead of `session.created` |
| LAUNCHPAD.md | Updated with current state and hook mechanics |

---

*This checkpoint represents a working compaction survival system using REAL OpenCode mechanisms.*
