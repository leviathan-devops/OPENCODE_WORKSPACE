# KRAKEN V2.0 — FORENSIC AUDIT & CONTINUATION

**Date:** 2026-04-15  
**Status:** AUDIT COMPLETE - Ready for continuation  
**Project:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0`

---

## FORENSIC AUDIT SUMMARY

**Problem:** Kraken v2.0 produces theatrical slop because V2.0 hooks are **defined but NOT wired**.

### The 5 Critical Issues

| # | Issue | Impact |
|---|-------|--------|
| 1 | Hooks defined in `src/hooks/index.ts` but NOT imported in `src/index.ts` | V2.0 enforcement never runs |
| 2 | Hooks not registered in plugin factory return | `session.created` never fires |
| 3 | Brains are stub code (`loadT2Master()` just delays 100ms) | No real context loading |
| 4 | Output verification orphaned (`claimRetrieved()` never called) | Tasks claim success without proof |
| 5 | Two-Layer Guardian powerless (155 patterns defined but unused) | Theater patterns not enforced |

### Root Cause

```
src/hooks/index.ts  →  createEventHook(), createChatMessageHook(), etc. DEFINED ✅
src/index.ts       →  NOT IMPORTED ❌, NOT REGISTERED ❌
```

---

## CRITICAL FIX (P0)

### File: `src/index.ts`

**Current (WRONG):**
```typescript
import { clusterStateHook } from './hooks/cluster-state-hook.js';

return {
  'experimental.chat.system.transform': safeHook(...),
  'tool.execute.before': safeHook(...),
  'chat.message': clusterStateHook,
};
```

**Should be:**
```typescript
import { 
  createEventHook, 
  createChatMessageHook, 
  createToolGuardianHook, 
  createGateHook,
} from './hooks/index.js';

return {
  name: 'kraken-agent',
  tool: allTools,
  config: ...,
  'event': createEventHook(),
  'chat.message': createChatMessageHook(),
  'tool.execute.before': createToolGuardianHook(),
  'tool.execute.after': createGateHook(),
};
```

---

## READING ORDER

### 1. FORENSIC AUDIT (MANDATORY)

**Location:** `COMPACTION SURVIVAL/FORENSIC_AUDIT/KRAKEN_V2_FORENSIC_AUDIT.md`

Contains:
- Detailed analysis of all 5 critical issues
- Evidence from source code
- Reference context file locations
- Success criteria

### 2. BUILD SESSION PROMPT

**Location:** `COMPACTION SURVIVAL/FORENSIC_AUDIT/BUILD_SESSION.md`

Contains:
- Step-by-step P0 fix instructions
- Reference architecture files
- Build commands

### 3. V1.2 Architecture (Reference)

**Location:** `V1.2 Build/Working Context Library/`
- `01_ARCHITECTURE_OVERVIEW.md` - Triple-brain + Roundtable
- `06_V1.2_MULTI_BRAIN_INTEGRATION.md` - Brain wiring diagram

### 4. V2.0 Optimized (Reference)

**Location:** `V2.0 Optimized/Working Context Library/`
- `01_ARCHITECTURE_OVERVIEW.md` - V2.0 optimizations
- `06_TWO_LAYER_FIREWALL.md` - Tool + Message enforcement
- `07_MECHANICAL_OUTPUT_VERIFICATION.md` - fs.existsSync() checkpoints
- `10_GOLDEN_BEHAVIOR_V2.md` - Behavioral rules

### 5. V1.0 Working Context (Reference)

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/`
- `V2_CONTEXT_LIBRARY.md` - What v2.0 proper should be
- `Plugin Context/HOOK_ARCHITECTURE.md` - How hooks should work
- `Plugin Context/PLUGIN_SHIP_SOP.md` - How to properly ship

---

## SOURCE CODE

**Project:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/src/`

### Key Files

| File | Status | Issue |
|------|--------|-------|
| `src/index.ts` | WRONG | Hooks not imported/wired |
| `src/hooks/index.ts` | DEFINED | Ready but unused |
| `src/brains/system/two-layer-guardian.ts` | DEFINED | Patterns exist but hooks missing |
| `src/brains/system/compaction-manager.ts` | DEFINED | Never triggered |
| `src/brains/system/gate-manager.ts` | DEFINED | Never evaluated |
| `src/shared/output-verifier.ts` | DEFINED | Never called |
| `src/brains/planning/planning-brain.ts` | STUB | Just delays 100ms |
| `src/brains/council/roundtable-council.ts` | STUB | Just console.logs |

---

## CONTINUATION STEPS

1. **Read** `COMPACTION SURVIVAL/FORENSIC_AUDIT/KRAKEN_V2_FORENSIC_AUDIT.md`
2. **Fix** `src/index.ts` - Wire V2.0 hooks (see CRITICAL FIX above)
3. **Build** `npm run build` in kraken-agent-v2.0
4. **Deploy** `cp dist/index.js ~/.config/opencode/plugins/kraken-agent-v2.0/dist/`
5. **Test** Start session, verify "All brains initialized" in logs
6. **Continue** Implementing remaining P1/P2 fixes per audit

---

## BUILD COMMAND

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0
npm run build
# Deploy: cp dist/index.js ~/.config/opencode/plugins/kraken-agent-v2.0/dist/
```

---

## SUCCESS CRITERIA

After P0 fix:
- [ ] Hooks properly imported in index.ts
- [ ] V2.0 hooks registered in plugin factory
- [ ] session.created fires → "All brains initialized" in logs
- [ ] Tool call → Two-Layer Guardian pattern match runs

After full fix:
- [ ] Bundle size 199KB+ (not 52KB)
- [ ] Real Docker spawns via Python wrappers
- [ ] Output verification runs on task completion
- [ ] Brains coordinate via brain messenger

---

**Audit Complete:** 2026-04-15  
**Next Action:** Fix src/index.ts, build, deploy, test
