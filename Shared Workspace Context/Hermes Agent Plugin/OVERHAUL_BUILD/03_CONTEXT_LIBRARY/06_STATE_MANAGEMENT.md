# State Management — What Persists

## State Types

| State Type | Storage | Lifetime | Example |
|-----------|---------|----------|---------|
| **Phase state** | `.hermes/phase.json` | Survives hot-reload | Current phase |
| **Session snapshots** | `.hermes/sessions/*.json` | Until explicitly deleted | Full session context |
| **Memory (2nd-brain)** | `~/.hermes/memory/*.json` | Permanent until purged | Keyed learnings |
| **Checkpoints** | `.hermes/checkpoints/*.json` | Until explicitly deleted | Git stash + state |
| **Hook state** | In-memory module variables | Resets on hot-reload | `_currentPhase` |
| **Delegation ledger** | In-memory + session state | Resets on session end | Pending approvals |

---

## Phase Persistence

**File:** `.hermes/phase.json`

```typescript
interface PhasePersistentState {
  currentPhase: PhaseName;
  previousPhase: PhaseName | null;
  lastTransitionTimestamp: number;
  sessionID: string;
}

// Load on plugin init:
function loadPhaseFromDisk(directory: string): PhasePersistentState {
  const path = join(directory, ".hermes", "phase.json");
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, "utf-8"));
  }
  return { currentPhase: "idle", previousPhase: null, lastTransitionTimestamp: 0, sessionID: "" };
}

// Save on every transition:
function savePhaseToDisk(directory: string, state: PhasePersistentState): void {
  const path = join(directory, ".hermes", "phase.json");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2));
}
```

**Critical:** Module-level `_currentPhase` variable resets on hot-reload. ALWAYS read from disk on hook init.

```typescript
let _currentPhase: string = PHASES.IDLE; // Module variable — resets on hot-reload!

export function getCurrentPhase(): string {
  return _currentPhase; // May be stale after hot-reload
}

// CORRECT pattern — read from disk:
export function getCurrentPhase(): string {
  const diskState = loadPhaseFromDisk(process.cwd());
  return diskState.currentPhase;
}
```

---

## Session State

**File:** `.hermes/sessions/[sessionID].json`

```typescript
interface SessionPersistentState {
  sessionID: string;
  phase: PhasePersistentState;
  createdAt: number;
  lastActivityAt: number;
  memory: {
    keys: string[];
    lastCompactAt: number;
  };
  checkpoints: Array<{
    id: string;
    message: string;
    createdAt: number;
  }>;
  delegationChain: DelegationRecord[];
}
```

**Storage pattern:**
```
~/.hermes/
├── phase.json              ← Current phase state
├── memory/
│   ├── index.json          ← Memory key index
│   └── [hash].json        ← Individual memory entries
├── sessions/
│   ├── [sessionID].json   ← Session state
│   └── [sessionID].json   ← Session state
└── checkpoints/
    └── [checkpointID].json ← Checkpoint data
```

---

## Delegation Ledger State

**In-memory (resets on session end):**
```typescript
interface DelegationRecord {
  id: string;
  fromAgent: string;
  toAgent: string;
  task: string;
  status: "pending" | "in_progress" | "done" | "blocked";
  createdAt: number;
  completedAt?: number;
  result?: string;
}
```

**Ledger persists as part of session state:**
```typescript
interface SessionState {
  delegationChain: DelegationRecord[];
  // ...
}
```

---

## Memory (2nd-Brain) State

**Storage:** `~/.hermes/memory/` (in user's home directory, not project workspace)

```typescript
interface MemoryEntry {
  key: string;           // User-provided key
  content: string;       // Content to remember
  tags: string[];        // For categorization
  sessionID: string;     // Which session created this
  createdAt: number;     // Timestamp
  accessedAt: number;    // Last accessed
  relevance?: number;    // Search relevance score
}

interface MemoryIndex {
  entries: Array<{
    key: string;
    hash: string;
    tags: string[];
    createdAt: number;
  }>;
}
```

**Operations:**
- `hermes_remember` → writes new entry to `~/.hermes/memory/[hash].json`, updates index
- `hermes_recall` → searches entries, returns ranked by relevance
- `hermes_context` → injects relevant memories into next turn

---

## Hook State (In-Memory Only)

**Module-level variables that reset on hot-reload:**

```typescript
// brainstorm-gate.ts
let _currentPhase: string = PHASES.IDLE; // ⚠️ Resets on hot-reload

// debugging-spiral.ts
const _failureLog: Map<string, number> = new Map(); // ⚠️ Resets on hot-reload

// compaction.ts
let _lastCompactAt: number = 0; // ⚠️ Resets on hot-reload
```

**Solution:** Always pair module-level variable with disk-backed state:
```typescript
// CORRECT pattern:
let _currentPhase: string = PHASES.IDLE;

export function getCurrentPhase(): string {
  // Fall back to disk state if memory is stale
  const diskState = loadPhaseFromDisk(process.cwd());
  if (diskState.lastTransitionTimestamp > lastMemoryUpdate) {
    return diskState.currentPhase;
  }
  return _currentPhase;
}
```

---

## Agent Mode State

| Mode | Description | Agents |
|------|-------------|--------|
| `primary` | Orchestrator, appears in agent toggle | `hermes` |
| `subagent` | Dispatched by orchestrator, not in toggle | All others |

**State is static** — set at registration, never changes during session.

---

## What Does NOT Persist

| State | Why It Doesn't Persist |
|-------|----------------------|
| Per-turn conversation context | Loaded fresh from session snapshot each turn |
| Hook guard internal state (failure counts, etc.) | In-memory only, reset on hot-reload |
| Pending delegation statuses | Reset to "pending" on session restart |
| 4-marker intent protocol state | In-memory only, reset on session end |

These are by design — they represent ephemeral conversation state that should reset on new sessions.
