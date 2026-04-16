# Deployment — Agent Identity Structure

## Deployment Overview

This document covers deploying the identity system as part of the kraken-agent plugin.

---

## Prerequisites

1. **OpenCode** installed and running
2. **Kraken Agent** plugin source code
3. **Identity files** created for each role
4. **Build tools** (Node.js, npm/pnpm)

---

## Directory Structure

```
kraken-agent/
├── identity/                    # Identity files
│   ├── KRAKEN.json             # Model routing config
│   ├── orchestrator/
│   │   ├── SOUL.md
│   │   ├── IDENTITY.md
│   │   ├── EXECUTION.md
│   │   ├── SPIDER.md
│   │   └── TOOLS.md
│   ├── planning/
│   │   └── ...
│   ├── execution/
│   │   └── ...
│   └── system/
│       └── ...
├── src/
│   ├── identity/
│   │   ├── loader.ts
│   │   ├── injector.ts
│   │   ├── cache.ts
│   │   └── types.ts
│   └── index.ts                # Main plugin entry
├── tests/
│   └── identity/
│       └── ...
└── package.json
```

---

## Build Process

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Type Check

```bash
npm run typecheck
```

### Step 3: Lint

```bash
npm run lint
```

### Step 4: Run Tests

```bash
npm test
```

### Step 5: Build

```bash
npm run build
```

---

## Identity File Deployment

### Creating Identity Files

```bash
# Create identity directory structure
mkdir -p identity/orchestrator
mkdir -p identity/planning
mkdir -p identity/execution
mkdir -p identity/system

# Create orchestrator identity
cat > identity/orchestrator/SOUL.md << 'EOF'
# SOUL.md — Kraken Orchestrator

You ARE the Kraken orchestrator. You are not a chatbot. You are an execution engine.

## Core Directives
1. EXECUTE, don't simulate...
2. VERIFY everything...
3. DELEGATE to agents...
4. LEARN from mistakes...
5. OWN your output...

## The Mantra
Execute, don't simulate. Delegate, don't hoard. Verify, don't assume.
EOF
```

---

## Plugin Registration

### Hook Registration

```typescript
// src/index.ts
import { IdentityLoader, IdentityInjector } from './identity';

export const krakenPlugin: Plugin = {
  name: 'kraken-agent',
  version: '1.2.0',

  hooks: {
    async 'session.started'(session) {
      const loader = new IdentityLoader();
      const injector = new IdentityInjector(loader);

      // Determine active role from session
      const role = session.user?.selectedRole || 'orchestrator';

      // Load and inject identity
      await injector.inject(session, role);
    },

    async 'tab.toggle'(session) {
      // Reinforce identity on tab switch
      const injector = new IdentityInjector();
      await injector.reinject(session);
    },

    async 'compaction.before'(session) {
      // Snapshot identity for recovery
      await snapshotIdentity(session);
    },

    async 'compaction.after'(session) {
      // Restore identity after compaction
      await restoreIdentity(session);
    }
  }
};
```

---

## Configuration

### KRAKEN.json

```json
{
  "agents": {
    "orchestrator": "0-opencode-zen/qwen3.6-plus-free",
    "planning": "0-opencode-zen/qwen3.6-plus-free",
    "execution": "0-opencode-zen/qwen3.6-plus-free",
    "system": "0-opencode-zen/qwen3.6-plus-free"
  },
  "clusters": {
    "alpha": "steamroll",
    "beta": "precision",
    "gamma": "testing"
  },
  "max_delegation_depth": 3,
  "identity": {
    "directory": "identity/",
    "default_role": "orchestrator",
    "reinforcement_interval_hours": 4
  }
}
```

---

## Environments

### Development

```bash
# Watch mode for auto-reload
npm run dev

# Use local identity files
IDENTITY_DIR=./identity npm run dev
```

### Staging

```bash
# Build for staging
npm run build

# Deploy to staging environment
scp -r dist user@staging:/path/to/kraken-agent/

# Identity files deploy automatically with source
```

### Production

```bash
# Production build
npm run build:production

# Deploy with verification
npm run deploy:production
```

---

## Verification

### Verify Identity Loaded

```bash
# Check plugin loaded
opencode status

# Check identity injection (in logs)
grep "Identity injected" logs/opencode.log
```

### Manual Verification

1. Start new session with Kraken orchestrator
2. Check system prompt contains "You ARE the Kraken orchestrator"
3. Give task requiring 3+ files
4. Verify agent spawns sub-agents via `spawn_shark_agent`

---

## Rollback

### If Identity System Fails

1. **Disable identity injection** in `src/index.ts`:
```typescript
// Comment out identity hook
hooks: {
  // async 'session.started'(session) {
  //   await injector.inject(session, role);
  // },
}
```

2. **Deploy fallback version**

3. **Debug using** `07_ERROR_HANDLING.md`

---

## Monitoring

### Key Metrics to Watch

| Metric | Normal | Alert |
|--------|--------|-------|
| Identity injection success rate | >99% | <95% |
| Fallback usage rate | <1% | >5% |
| Identity injection time | <500ms | >2000ms |
| Compaction recovery success | >99% | <95% |

### Log Events

```
[IDENTITY] Loading identity for role: orchestrator
[IDENTITY] Identity loaded successfully
[IDENTITY] Injecting into session context
[IDENTITY] Injection complete
[IDENTITY] Compaction snapshot created
[IDENTITY] Recovery from snapshot successful
[IDENTITY] Reinforcing identity (tab toggle)
[IDENTITY] ERROR: File not found identity/orchestrator/SOUL.md
[IDENTITY] Falling back to minimal identity
```