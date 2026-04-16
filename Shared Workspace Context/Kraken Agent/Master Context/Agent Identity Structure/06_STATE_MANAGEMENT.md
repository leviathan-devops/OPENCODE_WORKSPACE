# State Management — Agent Identity Structure

## Session State Structure

```typescript
// Complete session state with identity
interface SessionState {
  // Session metadata
  sessionId: string;
  createdAt: string;
  lastActivityAt: string;

  // Identity state (the focus of this document)
  identity: IdentityState;

  // Role state
  roles: RoleState;

  // Delegation state
  delegations: DelegationState;

  // Compaction state
  compaction: CompactionState;
}

// Identity-specific state
interface IdentityState {
  // Current active identity
  activeRole: string | null;

  // Loaded identity bundles (cached)
  bundles: Map<string, IdentityBundle>;

  // Injection state
  injected: boolean;
  injectedAt: string | null;
  lastReinforcementAt: string | null;
  reinforcementCount: number;

  // Source
  sourceDir: string | null;
}

// Role state
interface RoleState {
  // Available roles in this session
  available: string[];

  // Role history (for compaction)
  history: RoleTransition[];
}

interface RoleTransition {
  from: string | null;
  to: string;
  timestamp: string;
  reason: string;
}
```

---

## State Transitions

### Identity State Machine

```
┌──────────────┐
│    NONE      │  Initial state, no identity loaded
└──────┬───────┘
       │ loadIdentity()
       ▼
┌──────────────┐
│   LOADING    │  Reading identity files
└──────┬───────┘
       │ success
       ▼
┌──────────────┐
│   READY      │  Identity loaded, ready to inject
└──────┬───────┘
       │ injectIntoContext()
       ▼
┌──────────────┐
│  INJECTED    │  Identity in agent context
└──────┬───────┘
       │
       │ periodic reinforcement OR tab toggle
       ▼
┌──────────────┐
│ REINFORCING  │  Re-injecting to prevent decay
└──────┬───────┘
       │
       │ compaction triggered
       ▼
┌──────────────┐
│  PERSISTING  │  Saving to compaction snapshot
└──────┬───────┘
       │
       │ session recovers
       ▼
┌──────────────┐
│  RESTORED    │  Identity restored from snapshot
└──────────────┘
```

---

## Compaction State

```typescript
interface CompactionState {
  // Compaction history
  count: number;
  lastCompactionAt: string | null;
  lastSuccessfulCompactionAt: string | null;

  // Identity snapshot for recovery
  snapshot: CompactionSnapshot | null;

  // Recovery tracking
  recoveredFromSnapshot: boolean;
  snapshotTimestamp: string | null;

  // What to do with identity during compaction
  strategy: 'snapshot' | 'reinject' | 'ignore';
}
```

---

## Compaction Snapshot Format

```typescript
interface CompactionSnapshot {
  // Version for compatibility
  version: string;

  // When snapshot was created
  timestamp: string;

  // Session identifier
  sessionId: string;

  // Identity data (serialized)
  identity: {
    role: string;
    soul: string;      // Full markdown content
    identity: string;
    execution?: string;
    spider: string;
    tools?: string;
  };

  // State for recovery decisions
  state: {
    injected: boolean;
    reinforcementCount: number;
    lastReinforcementAt: string | null;
  };

  // Checksum for integrity
  checksum: string;
}
```

---

## State Persistence

### Where State Lives

| State Component | Storage Location | Lifetime |
|----------------|-----------------|----------|
| Identity bundles (memory) | Process memory | Session |
| Identity bundles (cache) | IdentityCache instance | Session |
| Compaction snapshot | `Compaction Survival/` | Persisted |
| Role history | Session state | Session |

### Persistence During Compaction

```typescript
// On compaction trigger
async function handleCompaction(session: Session): Promise<void> {
  // 1. Serialize current identity state
  const snapshot = serializeIdentityState(session.identity);

  // 2. Write to compaction survival directory
  const path = `Compaction Survival/${session.sessionId}/identity_snapshot.json`;
  await writeFile(path, JSON.stringify(snapshot, null, 2));

  // 3. Update session state
  session.state.compaction.lastCompactionAt = new Date().toISOString();
  session.state.compaction.snapshot = snapshot;
}

// On session recovery
async function recoverSession(sessionId: string): Promise<void> {
  // 1. Read snapshot
  const path = `Compaction Survival/${sessionId}/identity_snapshot.json`;
  const snapshot = JSON.parse(await readFile(path));

  // 2. Validate checksum
  if (!validateChecksum(snapshot)) {
    throw new Error('Identity snapshot corrupted');
  }

  // 3. Restore state
  session.identity = deserializeIdentityState(snapshot);
  session.state.compaction.recoveredFromSnapshot = true;
}
```

---

## State Recovery Flow

```
SESSION CRASHES
       │
       ▼
SESSION RESTARTS
       │
       ▼
CHECK Compaction Survival/
       │
       ▼
┌──────────────────┐
│ Snapshot exists? │
└────────┬─────────┘
         │
    YES  │  NO
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌────────────┐
│RESTORED│  │ FRESH START│
│ State  │  │ No identity│
│ recovered│            │
└────────┘  └────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│ Reinject identity into fresh context │
└──────────────────────────────────────┘
```

---

## Cache Management

### Identity Cache Operations

```typescript
class IdentityCache {
  private cache: Map<string, IdentityBundle> = new Map();

  // Cache identity bundle
  set(role: string, bundle: IdentityBundle): void {
    this.cache.set(role, {
      ...bundle,
      metadata: {
        ...bundle.metadata,
        cachedAt: new Date().toISOString()
      }
    });
  }

  // Get cached identity
  get(role: string): IdentityBundle | null {
    return this.cache.get(role) || null;
  }

  // Check if role is cached
  has(role: string): boolean {
    return this.cache.has(role);
  }

  // Clear cache on role change
  invalidate(role: string): void {
    this.cache.delete(role);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): CacheStats {
    return {
      entries: this.cache.size,
      roles: Array.from(this.cache.keys()),
      totalMemory: this.estimateMemoryUsage()
    };
  }
}
```

---

## State Validation

### Identity State Validation

```typescript
function validateIdentityState(state: IdentityState): ValidationResult {
  const errors: string[] = [];

  // Must have active role
  if (!state.activeRole) {
    errors.push('No active role set');
  }

  // If injected, must have injection timestamp
  if (state.injected && !state.injectedAt) {
    errors.push('Identity marked as injected but no timestamp');
  }

  // Bundle must exist for active role
  if (state.activeRole && !state.bundles.has(state.activeRole)) {
    errors.push(`No bundle cached for role: ${state.activeRole}`);
  }

  // Check for state decay
  if (state.injected && state.lastReinforcementAt) {
    const hoursSinceReinforcement =
      (Date.now() - new Date(state.lastReinforcementAt).getTime()) / 3600000;

    if (hoursSinceReinforcement > 4) {
      errors.push(`Identity not reinforced in ${hoursSinceReinforcement.toFixed(1)} hours`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```