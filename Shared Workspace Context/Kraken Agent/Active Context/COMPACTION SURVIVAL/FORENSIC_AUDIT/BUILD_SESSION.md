# KRAKEN V2.0 — BUILD SESSION PROMPT

**Checkpoint:** Fresh start from forensic audit  
**Bundle:** Must rebuild after hooks wired  
**Status:** CRITICAL - Hooks not wired

---

## FORENSIC AUDIT COMPLETE

**Document:** `KRAKEN_V2_FORENSIC_AUDIT.md` in this folder

**Key Finding:** V2.0 hooks defined in `src/hooks/index.ts` are NOT imported or wired in `src/index.ts`

---

## CRITICAL FIX (P0)

### File: `src/index.ts`

**Current imports (WRONG):**
```typescript
import { clusterStateHook } from './hooks/cluster-state-hook.js';
import { safeHook, type HookContext } from './v4.1/index.js';
```

**Should be:**
```typescript
import { 
  createEventHook, 
  createChatMessageHook, 
  createToolGuardianHook, 
  createGateHook,
} from './hooks/index.js';
import { safeHook, type HookContext } from './v4.1/index.js';
```

**Current return object (WRONG):**
```typescript
return {
  name: ...,
  tool: allTools,
  config: ...,
  'experimental.chat.system.transform': safeHook(...),
  'tool.execute.before': safeHook(...),
  'chat.message': clusterStateHook,
};
```

**Should be:**
```typescript
return {
  name: ...,
  tool: allTools,
  config: ...,
  'event': createEventHook(),
  'chat.message': createChatMessageHook(),
  'tool.execute.before': createToolGuardianHook(),
  'tool.execute.after': createGateHook(),
};
```

---

## FILES TO READ FIRST

1. **FORENSIC AUDIT:** `KRAKEN_V2_FORENSIC_AUDIT.md` (this folder)

2. **V1.0 Working Specs:**
   - `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/V2_CONTEXT_LIBRARY.md`
   - `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/Plugin Context/HOOK_ARCHITECTURE.md`
   - `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/Plugin Context/PLUGIN_SHIP_SOP.md`

3. **V1.2 Architecture:**
   - `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V1.2 Build/Working Context Library/01_ARCHITECTURE_OVERVIEW.md`
   - `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V1.2 Build/Working Context Library/06_V1.2_MULTI_BRAIN_INTEGRATION.md`

4. **V2.0 Optimized:**
   - `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0 Optimized/Working Context Library/01_ARCHITECTURE_OVERVIEW.md`
   - `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0 Optimized/Working Context Library/06_TWO_LAYER_FIREWALL.md`
   - `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0 Optimized/Working Context Library/07_MECHANICAL_OUTPUT_VERIFICATION.md`

---

## SOURCE CODE

`/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/src/`

**Key files:**
- `src/index.ts` - Plugin factory (NEEDS FIX: wire hooks)
- `src/hooks/index.ts` - V2.0 hooks (DEFINED but not wired)
- `src/brains/system/two-layer-guardian.ts` - Two-Layer Guardian (DEFINED)
- `src/shared/output-verifier.ts` - Output verification (DEFINED but orphaned)

---

## REMAINING WORK

| Priority | Task | Status |
|----------|------|--------|
| P0 | Wire V2.0 hooks in index.ts | NOT DONE |
| P1 | Implement real brain coordination | Stub code |
| P1 | Wire output verification to task completion | Orphaned |
| P2 | Implement T2 Master loading | Stub code |
| P2 | Real Docker spawn in cluster tools | Needs verification |

---

## BUILD COMMAND

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0
npm run build
# Deploy: cp dist/index.js ~/.config/opencode/plugins/kraken-agent-v2.0/dist/
# Verify: ls -la ~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js
```

---

## SUCCESS CRITERIA

- [ ] Hooks properly imported in index.ts
- [ ] V2.0 hooks registered in plugin factory return
- [ ] Bundle size 199KB+ (not 52KB)
- [ ] session.created → "All brains initialized" in logs
- [ ] Tool call → Two-Layer Guardian fires

---

## START

1. Read KRAKEN_V2_FORENSIC_AUDIT.md
2. Fix src/index.ts imports and hook registration
3. npm run build
4. Deploy
5. Test session.created fires
