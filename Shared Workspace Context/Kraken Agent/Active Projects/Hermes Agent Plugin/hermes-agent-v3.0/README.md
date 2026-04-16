# Hermes Agent v3.0 — Installation Package

**Version:** 3.0  
**Build ID:** hermes-v3-overhaul  
**Built:** 2026-04-14  
**Status:** ✅ SHIP READY — ALL GATES CLEARED  
**Plugin Size:** 550KB (dist/index.js)

---

## Quick Install

### Prerequisites

- **OpenCode** 1.4.x or higher
- **Bun** 1.x (for building from source)
- **Node.js** 18+ (for running tests)

### Step 1: Create Plugin Directory

```bash
mkdir -p ~/.config/opencode/plugins/hermes-agent-v3.0
```

### Step 2: Copy Plugin

```bash
cp hermes-agent-v3.0/dist/index.js ~/.config/opencode/plugins/hermes-agent-v3.0/
```

### Step 3: Register in opencode.json

```bash
# First, backup your existing config
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup

# Add hermes-agent to plugins array
# The plugin uses "plugins" (plural) not "plugin" (singular)
```

Edit `~/.config/opencode/opencode.json` to add the plugin:

```json
{
  "plugins": [
    "file:///home/USER/.config/opencode/plugins/hermes-agent-v3.0/index.js"
  ]
}
```

**⚠️ IMPORTANT:** If you have other plugins (Spider Agent, etc.), see "Hook Order" section below before installing.

### Step 4: Verify Installation

```bash
./verify-install.sh
```

---

## Architecture Overview

**Hermes Agent** is Leviathan's persistent 2nd-brain orchestrator for OpenCode.

### Key Features

| Feature | Description |
|---------|-------------|
| **19 Agents** | hub-and-spoke delegation (hermes→analyst→builder→reviewer) |
| **29 Hooks** | lifecycle gates enforcing brainstorm→plan→build→review→debug→complete |
| **13 Tools** | hermes_remember, hermes_recall, phase_complete, save_plan, etc. |
| **6-Phase Workflow** | Brainstorm → Plan → Build → Review → Debug → Complete |
| **2nd-Brain Memory** | Cross-session recall via ~/.hermes/memory/ |
| **Agent Identity Guards** | All Hermes hooks only fire for Hermes agents (not Spider/Kraken) |

### Phase Workflow

```
Brainstorm → Plan → Build → Review → Debug → Complete
    ↓          ↓       ↓       ↓        ↓         ↓
 questions  TDD+spec  tests   guard   spiral    done
```

---

## Hook Order (Critical for Multi-Plugin Setups)

**⚠️ READ THIS BEFORE INSTALLING WITH OTHER PLUGINS**

Hook execution order in `opencode.json` matters. Hermes Agent uses these hook types:

| Hook Type | Examples | Should Run |
|-----------|----------|------------|
| Global guardrails | anti-slop, scope-guard | BEFORE Hermes |
| Hermes-specific | brainstorm-gate, tdd-enforcer | ONLY for Hermes |
| Knowledge injectors | knowledge-injector, memory | AFTER guardrails |

**If you have Spider Agent**, ensure hermes-agent loads AFTER spider-agent:

```json
{
  "plugins": [
    "file:///path/to/spider-agent/index.js",
    "file:///path/to/hermes-agent-v3.0/index.js"
  ]
}
```

---

## Verification

### Pre-Flight Check

```bash
# Run the verification script
./verify-install.sh

# Or manually verify:
opencode --version          # Should show 1.4.x+
opencode --list-agents      # Should show "hermes"
```

### E2E Test Suite

```bash
cd hermes-agent-v3.0
bun install
bun run test-e2e.ts         # Should show 144/147 (3 fixture bugs)
```

### Container Testing

```bash
cd hermes-agent-v3.0
docker build -t hermes-v3-test -f container/Dockerfile .
docker run --rm -it hermes-v3-test /bin/bash /app/test-tui-replica.sh
```

---

## Uninstall / Rollback

If something goes wrong:

```bash
# 1. Restore backup
cp ~/.config/opencode/opencode.json.backup ~/.config/opencode/opencode.json

# 2. Remove plugin directory
rm -rf ~/.config/opencode/plugins/hermes-agent-v3.0

# 3. Restart OpenCode
```

---

## Files Included

```
hermes-agent-v3.0/
├── dist/index.js           # Built plugin (550KB)
├── src/                    # TypeScript source (reference)
├── README.md               # This file
├── INSTALL.md              # Detailed installation guide
├── TROUBLESHOOT.md         # Common issues and fixes
├── SHIP_GATE.md            # Ship criteria evidence
├── HANDOVER.md            # Build summary
├── verify-install.sh      # Installation verification
├── test-e2e.ts            # E2E test suite
├── container/
│   ├── Dockerfile          # Container build
│   └── test-tui-replica.sh # TUI replica test
└── docs/
    ├── HOOK_ARCHITECTURE.md
    ├── AGENT_DELEGATION.md
    └── PHASE_STATE_MACHINE.md
```

---

## Support

For issues, see TROUBLESHOOT.md or check:
- SHIP_GATE.md — ship criteria evidence
- HANDOVER.md — build history
- DEBUG_LOG.md — known issues
