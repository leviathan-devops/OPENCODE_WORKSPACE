# Manta Agent V4.8 — Build Specification

## Purpose

Fix two critical architectural failures in V1.1:

1. **PLAN→BUILD gate never advances** — `coordinator.onBuildComplete()` is the only trigger, but it's a stub in CLI mode
2. **Dual-brain split not mechanically enforced** — Plan Brain thinks, Build Brain does, but nothing forces this sequencing in CLI mode

## Problem Statement

### Problem A: Gate Chain Halted at PLAN

**Root cause:** `checkGateAdvance()` in gate-hook.ts only handles:
- `BUILD → TEST` (when files are written)
- `TEST → VERIFY` (when tests pass)

**PLAN → BUILD is missing entirely.** It relies on `coordinator.onBuildComplete()` being called, which requires:
- The coordinator to receive a "build complete" signal
- That signal to fire from a hook that actually runs in CLI mode

In CLI mode (`opencode run`):
- No `session.created` event fires (daemon-only)
- The coordinator initializes but never transitions
- `onBuildComplete()` is never called
- Gate stays at PLAN forever

**Evidence from Space Invaders trace:**
- 6 evidence records — all `gate: plan`
- Both SPEC.md and space-invaders.html written while in PLAN gate
- BUILD→TEST never fired

### Problem B: Dual-Brain Split Is Not Enforced

**The intent:** Plan Brain thinks before Build Brain does. This is a CoT (Chain of Thought) enforcement mechanism wired into the agent harness OS.

**The reality:**
- Both T1 prompts are injected into system context
- The model can ignore them or blend them
- No mechanical enforcement of "thinking phase must complete before execution phase"
- The coordinator is a stub in CLI mode

## Solution Architecture

### Fix A: Auto-advance PLAN→BUILD

**Principle:** SPEC.md completion = transition to BUILD. This is determinable from evidence.

**Implementation:** Add to `checkGateAdvance()`:

```typescript
// PLAN→BUILD: SPEC.md or plan document detected
if (!hasError && currentGate === 'plan') {
  const evidence = buildEvidenceRecord(tool, args, result);
  if (evidence) {
    const hasSpec = evidence.files.some(f => 
      /SPEC\.md|spec|plan/i.test(f) || 
      evidence.workEvidence.includes('SPEC')
    );
    if (hasSpec || tool === 'write' || tool === 'write_file') {
      return 'build';
    }
  }
}
```

**Alternative (event-driven):** Make coordinator `onBuildComplete()` actually callable in CLI mode by wiring it to SPEC.md evidence detection in gate-hook, not relying on session events.

### Fix B: Enforce Dual-Brain Mechanical Split

**Principle:** Plan Brain must emit a structured `SPEC.md` before Build Brain can write implementation files.

**Implementation options:**

**Option 1: Gate-aware file blocking**
- In PLAN gate: only `write_file` allowed for SPEC.md and plan documents
- If Build Brain tool calls detected in PLAN gate, inject warning context
- Transition to BUILD gate triggers a system message: "PLAN COMPLETE — Build Brain now active"

**Option 2: Structured state emission**
- Plan Brain T1 prompt instructs: "When SPEC.md is written, emit `[PLAN COMPLETE]` as a structured marker"
- Gate hook detects this marker and advances to BUILD
- Build Brain T1 prompt injected only after BUILD transition

**Option 3: Evidence-based sequential enforcement**
- PLAN gate: collect evidence, emit "thinking complete" context
- BUILD gate: only allow implementation files (`.html`, `.ts`, `.js`, etc.)
- If SPEC.md not written before implementation files → inject error context

### Recommended Fix: Option 1 + Option 3 hybrid

```typescript
// gate-hook.ts — PLAN gate enforcement
if (currentGate === 'plan') {
  const evidence = buildEvidenceRecord(tool, args, result);
  
  // Allow SPEC.md or plan documents
  const allowedInPlan = evidence?.files.some(f => 
    /SPEC\.md|spec\.md|plan\.md|design/i.test(f)
  );
  
  // Block implementation files in PLAN gate
  const blockedInPlan = evidence?.files.some(f => 
    /\.(html|ts|js|py|css)$/i.test(f) && !/SPEC/i.test(f)
  );
  
  if (blockedInPlan) {
    // Emit warning: thinking must precede execution
    console.error('[Manta] WARNING: Implementation file written before SPEC. Plan Brain must complete first.');
    return null; // Don't advance
  }
  
  if (allowedInPlan) {
    return 'build'; // SPEC.md written = advance to BUILD
  }
}
```

## V4.8 Code Changes Required

### 1. gate-hook.ts — Add PLAN→BUILD auto-advance

**Current (broken):**
```typescript
function checkGateAdvance(tool, args, result, currentGate): GateName | null {
  // BUILD gate advances when files are written
  if (!hasError && currentGate === 'build') {
    if (['write_file', ...].includes(tool)) {
      return 'test';
    }
  }
  // PLAN→BUILD: MISSING
  return null;
}
```

**Fix:**
```typescript
function checkGateAdvance(tool, args, result, currentGate): GateName | null {
  const resultStr = result ? JSON.stringify(result) : '';
  const hasError = resultStr.includes('"error"') || resultStr.includes('"status":"error"');
  const evidence = buildEvidenceRecord(tool, args, result);
  
  // PLAN→BUILD: SPEC.md or plan document detected
  if (!hasError && currentGate === 'plan') {
    const hasPlanDoc = evidence?.files.some(f => 
      /SPEC\.md|spec\.md|plan\.md|design\.md/i.test(f)
    ) || evidence?.workEvidence.includes('SPEC');
    
    if (hasPlanDoc) {
      return 'build';
    }
    
    // Block implementation files before planning complete
    const hasImplFile = evidence?.files.some(f => 
      /\.(html|ts|js|py|css|jsx|tsx)$/i.test(f)
    );
    if (hasImplFile) {
      console.error('[Manta] BLOCKED: Implementation file written before SPEC. Plan first.');
      return null;
    }
  }
  
  // BUILD→TEST: files written
  if (!hasError && currentGate === 'build') {
    if (['write_file', 'mcp_write_file', 'write', 'mcp_write', 'patch', 'mcp_patch'].includes(tool)) {
      return 'test';
    }
  }
  
  // TEST→VERIFY: tests pass (keep existing logic)
  if (!hasError && currentGate === 'test') {
    if (/test.*(pass|success|ok)/i.test(resultStr) || /passed.*tests?/i.test(resultStr)) {
      return 'verify';
    }
  }
  
  return null;
}
```

### 2. system-transform-hook.ts — Inject brain phase context

**Add explicit phase messaging:**

```typescript
const phaseContext = `
[MANTA PHASE]
Current Brain: ${coordinator.getCurrentBrain().toUpperCase()}
Phase: ${currentGate === 'plan' ? 'THINKING — Plan before execution' : 'EXECUTING — Build before testing'}
Gate: ${currentGate.toUpperCase()}

PHASE RULES:
- PLAN phase: Think first. Write SPEC.md before any implementation.
- BUILD phase: Execute SPEC.md exactly. No design decisions here.
- If blocked: ReThink before ReExecuting — return to PLAN if uncertain.
`.trim();
```

### 3. coordinator.ts — Make it functional in CLI mode

**Current (stub):**
```typescript
getCurrentBrain() { return 'plan'; }
onBuildComplete() { /* no-op */ }
```

**Fix:**
```typescript
getCurrentBrain(): 'plan' | 'build' {
  const state = this.gateManager?.getCurrentGate();
  return state === 'build' ? 'build' : 'plan';
}

onBuildComplete(): void {
  // Called when SPEC.md is written — advance to BUILD
  // In CLI mode, this is called by the gate hook on SPEC.md evidence
  console.log('[MantaCoordinator] Build phase complete, switching to Execute');
  this.stateStore.set('plan-state', 'phaseComplete', true);
}
```

But since coordinator is optional (passed to hooks), wire it through gate-hook:

```typescript
// In gate-hook, when SPEC.md detected and currentGate === 'plan':
if (coordinator) {
  coordinator.onBuildComplete();
}
```

### 4. evidence.ts — No change needed (already works)

Evidence collector correctly creates `.manta/` directory and writes evidence.

### 5. Session hook — Remove dependency on `session.created`

**The session hook's job is to initialize state on daemon start. In CLI mode:**

```typescript
// Check if .manta exists — if not, initialize (CLI fallback)
const mantaDir = path.join(process.cwd(), '.manta');
if (!fs.existsSync(mantaDir)) {
  gateManager.restore({...});
  coordinator?.initialize();
}
```

## V4.8 File Changes Summary

| File | Change | Priority |
|------|--------|----------|
| `src/hooks/v4.1/gate-hook.ts` | Add PLAN→BUILD auto-advance, block impl files in PLAN | CRITICAL |
| `src/hooks/v4.1/system-transform-hook.ts` | Add PHASE context with explicit rules | HIGH |
| `src/manta/coordinator.ts` | Implement functional `onBuildComplete()` | HIGH |
| `src/hooks/v4.1/session-hook.ts` | CLI fallback initialization | MEDIUM |

## Expected V4.8 Behavior

### Space Invaders Test (should show gate progression):

```
[PLAN gate active]
← Write SPEC.md          → Evidence #1 (gate: plan)
                          → Auto-advance: PLAN→BUILD
                          
[BUILD gate active]
← Write space-invaders.html  → Evidence #2 (gate: build)
                                → Auto-advance: BUILD→TEST

[TEST gate active]
← Playwright verification      → Evidence #3 (gate: test)
                                → Auto-advance: TEST→VERIFY (if tests pass)

[VERIFY gate active]
... (continues through gate chain)
```

### Evidence Records Should Show:

```
.manta/evidence/plan/  {timestamp}/evidence.json   ← SPEC.md
.manta/evidence/build/{timestamp}/evidence.json  ← game.html
.manta/evidence/test/ {timestamp}/evidence.json   ← verification
```

### Dual-Brain Enforcement:

```
PLAN phase: "Think first. Write SPEC.md before any implementation."
  ↓ SPEC.md written
BUILD phase: "Execute SPEC.md exactly. No design decisions here."
  ↓ Implementation complete
TEST phase: "Verify the build matches SPEC.md"
```

## Acceptance Criteria

1. **SPEC.md written → PLAN→BUILD transition fires** — evidence shows BUILD gate
2. **Implementation file in PLAN gate → warning emitted, no advance**
3. **All 6 gates reachable** — PLAN→BUILD→TEST→VERIFY→AUDIT→DELIVERY
4. **Dual-brain split mechanically enforced** — no impl files before SPEC.md
5. **Zero regressions** — existing evidence collection still works
6. **CLI mode functional** — no daemon/session dependency

## Testing Plan

### Test 1: Gate Advancement
```bash
opencode run --agent manta "write a simple hello world in index.html"
# Expected: .manta/evidence/plan/*/evidence.json AND .manta/evidence/build/*/evidence.json
```

### Test 2: Blocked Impl Before Spec
```bash
opencode run --agent manta "write index.html with hello world"  # No SPEC.md mention
# Expected: Warning in output about implementation before spec
```

### Test 3: Full Gate Chain
```bash
opencode run --agent manta "build me a calculator in HTML"
# Expected: Evidence in plan/, build/, test/, verify/ gates
```

---

*Spec written: 2026-04-07*  
*Version: V4.8*  
*Status: READY FOR IMPLEMENTATION*
