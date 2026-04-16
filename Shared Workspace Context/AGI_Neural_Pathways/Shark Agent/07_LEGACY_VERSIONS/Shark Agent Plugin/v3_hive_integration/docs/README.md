# Hive Mind Shark Plugin v3

**Version:** 3.0.0  
**Date:** March 31, 2026  
**Philosophy:** YOLO with Guardrails

---

## Overview

Hive Mind Shark v3 merges two powerful systems:

| System | What It Provides |
|--------|-------------------|
| **Hive Mind** | Persistent context via OpenViking - cross-session memory |
| **Shark** | 5-step workflow enforcement - quality guardrails |

**Core Philosophy:** YOLO mode by default with guardrails that enforce quality. Agents have full dev access. We don't firewall their tools. We just make sure they follow the workflow and learn from failures.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Hive Mind Shark Plugin v3                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TWO MODES (THINKING vs DOING):                                     │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ PLAN (THINKING)                                               │   │
│  │   - Create .shark/plan.md, .shark/claims.json                 │   │
│  │   - Analyze, plan, think                                      │   │
│  │   - Commands: WARN if used (but allowed)                      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                           ↓ auto-shift                              │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ BUILD (DOING)                                                  │   │
│  │   - YOLO mode - full dev access                               │   │
│  │   - Write code, run tests, execute                           │   │
│  │   - All commands allowed                                      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                           ↓ auto-shift                              │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ TEST → VERIFY → SHIP                                         │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  AUTO-INJECT (every response):                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Brick wall + current mode + required artifacts + failures     │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  OPENVIKING PERSISTENCE:                                            │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Session state: mode, artifacts, commands                     │   │
│  │ Failures: auto-saved to viking://shared/memory/failures/    │   │
│  │ Patterns: what works, learned over sessions                   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  GUARDRAILS (minimal):                                               │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ BLOCK: rm -rf /, curl | sh, fork bombs                      │   │
│  │ WARN: theatrical patterns (mock, stub, fake)                  │   │
│  │ NO zone blocking (YOLO - full dev access)                     │   │
│  └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The 5-Step Brick Wall

```
STEP 1: PLAN → STEP 2: BUILD → STEP 3: TEST → STEP 4: VERIFY → STEP 5: SHIP
```

| Step | What | Required Artifacts |
|------|------|-------------------|
| **PLAN** | Think, plan, analyze | `.shark/plan.md`, `.shark/claims.json` |
| **BUILD** | YOLO - write code | `.shark/build-manifest.json` |
| **TEST** | Run tests, capture results | `.shark/test-results/stage1.json`, `.shark/test-results/stage2.json` |
| **VERIFY** | 3 gates: functional, intent, security | `.shark/verify-gates.json` |
| **SHIP** | Generate report | `.shark/SHIP_REPORT.md` |

---

## Mode Shift

### Auto-Detection (Default)

Mode shifts automatically when artifacts are detected:

```
No artifacts → PLAN
.plan.md + .claims.json exist → BUILD
.manifest.json exists → TEST
.stage1.json + .stage2.json exist → VERIFY
.SHIP_REPORT.md exists → SHIP
```

### Manual Shift

Agent can also explicitly call:
```
shark_build → Force shift to BUILD mode
shark_reset → Reset to PLAN mode
```

---

## Guardrails

### BLOCKED (Hard Block)

These genuinely dangerous commands are blocked:

| Pattern | Example |
|---------|---------|
| `rm -rf /` | Deleting root |
| `curl \| sh` | Pipe to shell |
| `fork bomb` | `:(){ :\|:& };:` |
| `wget \| sh` | Pipe wget to shell |

### WARNED (Soft Warning)

These patterns trigger a warning in PLAN mode (but are still allowed):

| Pattern | Why |
|---------|-----|
| `mock mode` | Testing should be real |
| `stub` | Real implementation |
| `fake data` | Use real fixtures |
| `simulate` | Execute for real |
| `would run` | Don't describe, do |

### NO ZONE BLOCKING

Unlike v1/v2, we do NOT block access to `/etc`, `~/.ssh`, etc. YOLO mode.

---

## Tools Available

| Tool | Purpose |
|------|---------|
| `shark_status` | Current mode, progress, warnings |
| `shark_build` | Force shift to BUILD mode |
| `shark_reset` | Reset to PLAN mode |
| `shark_warnings` | Show detected warnings |
| `hive_context` | Query Hive Mind for failures |
| `hive_status` | Check OpenViking connection |

---

## Auto-Inject (Every Response)

Every AI response includes:

```markdown
# 🦈 SHARK ENFORCEMENT ACTIVE

[5-step brick wall]

## CURRENT MODE: PLAN
> THINKING phase - create .shark/plan.md and .shark/claims.json first

## RECENT FAILURES (learn from these)
- npm install EACCES: solution was sudo
- test timeout: solution was increase timeout

## WARNINGS
- Theatrical pattern in PLAN mode: mock mode - should this wait for BUILD?
```

---

## State Persistence

### Session State (`.shark/hive-state-*.json`)

```json
{
  "workflow": {
    "mode": "BUILD",
    "completedSteps": ["PLAN"],
    "artifacts": {
      "plan": true,
      "claims": true
    },
    "warnings": []
  },
  "commands": [
    { "cmd": "npm install", "exitCode": 0, "timestamp": 1743432000 }
  ]
}
```

### Hive Mind Failures (OpenViking)

On command failure, automatically saved to:
```
viking://resources/hive-mind/shared/memory/failures/{session_id}-{timestamp}.json
```

---

## Installation

### 1. Build

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin/v3_hive_integration"
./scripts/build.sh
```

### 2. Register

In `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "hive-mind-plugin"
  ]
}
```

### 3. Start OpenViking (if not running)

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/OpenViking
source .venv/bin/activate
openviking-server --config ~/.openviking/ov.conf
```

### 4. Verify

```bash
curl http://localhost:1933/health
```

---

## Files

```
v3_hive_integration/
├── src/
│   └── index.ts              # Main plugin (TypeScript)
├── test/
│   └── enforcement.test.ts    # Core logic tests
├── scripts/
│   └── build.sh              # Build + install script
├── docs/
│   └── README.md             # This file
├── package.json
└── tsconfig.json
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| **3.0.0** | 2026-03-31 | Hive Mind + Shark merged, YOLO philosophy |
| **2.0.0** | Earlier | Shark v2 with dual-brain, hard zones |
| **1.0.0** | Earlier | Initial Shark plugin |

---

## Philosophy

> **YOLO with guardrails, not a firewall.**
> 
> Give agents full dev access. Enforce quality through the brick wall.
> Learn from failures automatically. Ship without silt.

---

*Execute, don't simulate. Verify, don't assume. Ship only when complete.*
