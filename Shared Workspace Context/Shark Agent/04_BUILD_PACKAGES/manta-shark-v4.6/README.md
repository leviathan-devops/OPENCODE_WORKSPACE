# Manta & Shark Agent Plugins v4.6 — Build Package

Self-contained build package containing both plugins, source code, reports, and documentation.

## Contents

```
manta-shark-v4.6/
├── src/
│   ├── manta/           # Manta Agent source (dual-brain sequential)
│   └── shark/           # Shark Agent source (triple-brain parallel)
├── dist/
│   ├── manta-index.js   # Pre-built manta plugin
│   └── shark-index.js   # Pre-built shark plugin
├── reports/
│   └── MANTA_SHARK_AGENT_BUILD_REPORT.md
├── logs/
│   ├── CROSS-PLUGIN-ARCHITECTURE-AUDIT.md
│   ├── hermes-context-spillover-fix.md
│   └── shark-manta-plugin-conflict-audit.md
└── context/
    └── v4.1/           # Boilerplate reference (agent-aware hooks pattern)
```

## Quick Start

### Pre-built Plugins (Recommended)

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugins": [
    "...other plugins...",
    "file:///path/to/manta-shark-v4.6/dist/manta-index.js",
    "file:///path/to/manta-shark-v4.6/dist/shark-index.js"
  ]
}
```

### Build from Source

```bash
# Build manta
cd src/manta && bun run build

# Build shark  
cd src/shark && bun run build
```

## What Each Plugin Does

### Manta Agent (Dual-Brain Sequential)
- **Brain switching:** Plan Brain ↔ Build Brain (mechanical coordinator)
- **Gates:** plan → build → test → verify → audit → delivery
- **Hooks:** 5 hooks with agent identity filtering
- **Tools:** manta-status, manta-gate, manta-evidence, checkpoint

### Shark Agent (Triple-Brain Parallel)
- **Coordination:** PeerDispatch for triple-brain coordination
- **Gates:** plan → build → test → verify → audit → delivery
- **Hooks:** 5 hooks with agent identity filtering
- **Tools:** shark-status, shark-gate, shark-evidence, checkpoint

## Bug Fix (v4.6)

**Cross-Plugin Spillover** — Fixed agent identity checks to prevent hooks from firing for non-target agents.

Before:
- `[MantaCoordinator] Initialized` appearing in spider agent sessions
- `[SharkPeerDispatch]` messages in vanilla agent sessions
- Enforcement context injected into wrong agents

After:
- Hooks only fire for their intended agents
- Vanilla agents (plan, build, general, explorer) are unaffected
- Full isolation verified via 17 runtime tests

## Verification

See `reports/MANTA_SHARK_AGENT_BUILD_REPORT.md` for full test results:
- Build: SUCCESS (168 modules bundled)
- Runtime: 17/17 tests PASSED
- Spillover: FIXED

## Files Modified to Fix

1. `src/manta/shared/agent-identity.ts` — CREATED
2. `src/shark/shared/agent-identity.ts` — CREATED
3. `src/manta/hooks/v4.1/session-hook.ts` — Fixed import path
4. `src/manta/hooks/v4.1/system-transform-hook.ts` — Fixed import path
5. `src/shark/hooks/v4.1/session-hook.ts` — Fixed import path
6. `src/shark/hooks/v4.1/system-transform-hook.ts` — Fixed import path

## Agent Identity Pattern

Each hook now starts with:

```typescript
if (!isMantaAgent(event.agent)) {
  return;  // Skip for non-manta agents
}
```

This prevents spillover to spider, hermes, and vanilla agents.
