# KNOWLEDGE: Phase State Machine — Design & Persistence

**File:** `src/hooks/brainstorm-gate.ts`, `src/config/constants.ts`  
**Version:** v3-overhaul  
**Last Updated:** 2026-04-14  

---

## State Machine Definition

```
         ┌──────────────────────────────────────────┐
         │                                          │
         ▼                                          │
    ┌──────┐    save_plan    ┌──────┐   build     ┌──────┐
    │ idle │ ──────────────▶ │plan  │ ─────────▶ │build │
    └──────┘                └──────┘             └──────┘
         │                     ▲                       │
         │ phase_complete      │                       │
         │ ("analyze")         │                       ▼
         ▼                     │                  ┌──────┐
    ┌────────┐          ┌────────┐             │debug │
    │analyze │◀─────────│ review │              └──────┘
    └────────┘          └────────┘
                              │
                              │ phase_complete
                              ▼
                         ┌────────┐
                         │complete│ (terminal)
                         └────────┘
```

---

## Phase Transitions Map

From `src/config/constants.ts`:

```typescript
export const PHASE_TRANSITIONS: Record<string, string[]> = {
  idle: ["analyze"],
  analyze: ["plan", "idle"],
  plan: ["build", "idle"],
  build: ["review", "debug", "idle"],
  review: ["complete", "build", "debug", "idle"],
  debug: ["build", "review", "complete", "idle"],
  complete: [], // terminal — cannot transition out
};
```

---

## Critical: Hot-Reload Survival

**Module-level state resets on plugin hot-reload.** The `_currentPhase` variable in `brainstorm-gate.ts` resets to `IDLE` on every hot-reload unless backed by disk.

**Solution:** Disk-backed state with `loadPhaseFromDisk()` / `savePhaseToDisk()`.

```typescript
// From src/hooks/brainstorm-gate.ts

const PHASE_DIR = join(process.cwd(), ".hermes");
const PHASE_FILE = join(PHASE_DIR, "phase.json");

let _currentPhase: string = PHASES.IDLE;  // ⚠️ Resets on hot-reload!
let _phaseLoaded = false;                  // ⚠️ Resets on hot-reload!

function loadPhaseFromDisk(): string {
  try {
    if (existsSync(PHASE_FILE)) {
      const data = JSON.parse(readFileSync(PHASE_FILE, "utf-8"));
      return data.phase ?? PHASES.IDLE;
    }
  } catch { /* ignore */ }
  return PHASES.IDLE;
}

export function getCurrentPhase(): string {
  if (!_phaseLoaded) {
    _currentPhase = loadPhaseFromDisk();  // ← Recover from disk
    _phaseLoaded = true;
  }
  return _currentPhase;
}
```

---

## Phase File Format

**File:** `.hermes/phase.json`

```json
{
  "phase": "build",
  "updatedAt": "2026-04-14T12:00:00.000Z"
}
```

---

## Brainstorm Gate Phase Check

The brainstorm gate ONLY fires in early phases:

```typescript
if (phase !== PHASES.IDLE && phase !== PHASES.ANALYZE && phase !== PHASES.PLAN) {
  return;  // ← Gate is INACTIVE in BUILD, REVIEW, DEBUG, COMPLETE
}
```

Once phase advances past PLAN, the brainstorm gate becomes inactive — actual coding is allowed.

---

## Hook Firing Order

Phase state is checked by:
1. `brainstorm-gate.ts` — checks phase for gate activation
2. `phase-monitor.ts` — tracks phase transitions after `phase_complete` tool

**Note:** `phase-monitor` fires AFTER `phase_complete` executes (tool.execute.after), while `brainstorm-gate` fires on every message transform.

---

## Tools That Modify Phase

| Tool | Function | File |
|------|----------|------|
| `phase_complete` | Advances state machine | `src/tools/phase-complete.ts` |

---

## Verification

```bash
# Phase should persist across hot-reload
# 1. Set phase to "plan" via phase_complete tool
# 2. Verify .hermes/phase.json was written
# 3. "Hot reload" (plugin refresh)
# 4. Verify phase is still "plan" (not reset to "idle")
```
