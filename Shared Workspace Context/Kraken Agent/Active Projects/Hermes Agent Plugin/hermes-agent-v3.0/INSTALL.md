# Hermes Agent v3.0 — Detailed Installation Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [opencode.json Configuration](#opencodejson-configuration)
4. [Hook Order](#hook-order)
5. [Verification](#verification)
6. [Post-Installation](#post-installation)

---

## Prerequisites

### Required

| Tool | Version | Purpose |
|------|---------|---------|
| OpenCode | 1.4.x+ | Plugin host |
| Bun | 1.x | Build tool |
| Node.js | 18+ | Runtime |

### Verify Prerequisites

```bash
opencode --version    # Must be 1.4.x or higher
bun --version         # Must be 1.x
node --version        # Must be 18+
```

---

## Installation Steps

### Step 1: Get the Plugin

Copy the `hermes-agent-v3.0/` directory to a permanent location:

```bash
# Option A: Use as-is from the build location
PLUGIN_DIR="$HOME/hermes-agent-v3.0"

# Option B: Copy to config directory
cp -r /path/to/hermes-agent-v3.0 ~/.config/opencode/plugins/
```

### Step 2: Create Plugin Directory

```bash
mkdir -p ~/.config/opencode/plugins/hermes-agent-v3.0
```

### Step 3: Copy Plugin File

```bash
cp hermes-agent-v3.0/dist/index.js ~/.config/opencode/plugins/hermes-agent-v3.0/
```

### Step 4: Configure opencode.json

**⚠️ CRITICAL: This step is interactive. Do NOT skip the backup.**

```bash
# Backup first
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup

# View current config
cat ~/.config/opencode/opencode.json
```

Now edit `~/.config/opencode/opencode.json`:

```json
{
  "plugins": [
    "file:///home/YOUR_USER/.config/opencode/plugins/hermes-agent-v3.0/index.js"
  ]
}
```

**If you already have plugins**, see "Hook Order" section below.

### Step 5: Verify Installation

```bash
./verify-install.sh
```

---

## opencode.json Configuration

### Minimal Config (Hermes only)

```json
{
  "plugins": [
    "file:///home/USER/.config/opencode/plugins/hermes-agent-v3.0/index.js"
  ]
}
```

### With Spider Agent

```json
{
  "plugins": [
    "file:///home/USER/.config/opencode/plugins/spider-agent/index.js",
    "file:///home/USER/.config/opencode/plugins/hermes-agent-v3.0/index.js"
  ]
}
```

### With Other Plugins

```json
{
  "plugins": [
    "file:///home/USER/.config/opencode/plugins/plugin-a/index.js",
    "file:///home/USER/.config/opencode/plugins/spider-agent/index.js",
    "file:///home/USER/.config/opencode/plugins/hermes-agent-v3.0/index.js"
  ]
}
```

---

## Hook Order

### Why Order Matters

OpenCode executes hooks in the order they appear in `opencode.json`. Hooks can be:

1. **Global** — Fire for ALL agents (guardrails, anti-slop)
2. **Agent-specific** — Fire only for specific agents (Hermes hooks)

Hermes Agent has **agent-specific guards** (`isHermesAgent()`) on all 29 hooks. This means Hermes hooks should NOT interfere with other agents — but hook execution ORDER can still matter.

### The Problem

If Hermes loads BEFORE Spider Agent, and Spider's hooks expect to run first, you may see:
- Unexpected behavior
- Hook execution errors
- Phase state corruption

### The Solution

**Load Hermes AFTER plugins that need to run first:**

```json
{
  "plugins": [
    "file:///path/to/global-guardrails/index.js",    # First: global hooks
    "file:///path/to/spider-agent/index.js",         # Second: Spider
    "file:///path/to/hermes-agent-v3.0/index.js"     # Third: Hermes
  ]
}
```

### Verifying Hook Order

After installation, run:

```bash
opencode --list-agents | grep hermes
# Should show: hermes
```

If you see issues, try reordering plugins in `opencode.json`.

---

## Verification

### Quick Check

```bash
opencode --version
opencode --list-agents | grep hermes
```

### Full Verification

```bash
./verify-install.sh
```

Expected output:
```
=== Hermes Agent v3.0 Verification ===
1. Checking plugin file... ✓
2. Checking opencode version... ✓ (1.4.x)
3. Checking opencode.json... ✓
4. Running E2E tests... ✓ (144/147)
5. Checking hook guards... ✓ (29/29)
=== Verification Complete ===
```

### E2E Test Suite

```bash
cd hermes-agent-v3.0
bun install
bun run test-e2e.ts
```

Expected: **144/147** (3 failures are test fixture bugs, not code bugs)

### Container Testing

```bash
cd hermes-agent-v3.0
docker build -t hermes-v3-test -f container/Dockerfile .
docker run --rm -it hermes-v3-test /bin/bash /app/test-tui-replica.sh
```

---

## Post-Installation

### First Run

```bash
# Start Hermes Agent TUI
opencode --agent hermes

# Or run a command
opencode run "help" --agent hermes
```

### Expected First-Time Behavior

1. Hermes creates `~/.hermes/` directory
2. Phase starts at IDLE
3. Brainstorm gate fires on first task
4. `/hermes status` shows current phase

### Check Phase State

```bash
cat ~/.hermes/phase.json
```

Expected:
```json
{
  "phase": "IDLE",
  "step": 0,
  "updated": "2026-04-14T..."
}
```

---

## Troubleshooting

See [TROUBLESHOOT.md](./TROUBLESHOOT.md) for common issues.

---

## Updating

To update to a new version:

```bash
# 1. Backup config
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup

# 2. Remove old plugin
rm -rf ~/.config/opencode/plugins/hermes-agent-v3.0

# 3. Install new version
mkdir -p ~/.config/opencode/plugins/hermes-agent-v3.0
cp new-version/dist/index.js ~/.config/opencode/plugins/hermes-agent-v3.0/

# 4. Restart OpenCode
```
