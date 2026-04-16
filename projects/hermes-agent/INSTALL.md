# Hermes Agent v3.5 — Installation Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [opencode.json Configuration](#opencodejson-configuration)
4. [Verification](#verification)
5. [Post-Installation](#post-installation)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| OpenCode | 1.4.x+ | Plugin host |
| Bun | 1.x | Build tool |

---

## Installation Steps

### Step 1: Create Plugin Directory

```bash
mkdir -p ~/.config/opencode/plugins/hermes-agent-v3.5
```

### Step 2: Copy Plugin

```bash
cp dist/index.js ~/.config/opencode/plugins/hermes-agent-v3.5/
```

### Step 3: Register in opencode.json

```bash
# Backup first
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup

# Add plugin
nano ~/.config/opencode/opencode.json
```

Add to plugins array:

```json
{
  "plugins": [
    "file:///home/YOUR_USER/.config/opencode/plugins/hermes-agent-v3.5/index.js"
  ]
}
```

### Step 4: Verify Installation

```bash
./verify-install.sh
```

---

## Hook Order

If you have Spider Agent or other plugins, ensure Hermes loads AFTER them:

```json
{
  "plugins": [
    "file:///path/to/spider-agent/index.js",
    "file:///path/to/hermes-agent-v3.5/index.js"
  ]
}
```

---

## New v3.5 Tools

### Fork Tools

```bash
# Create a blocking Fork
fork_create(skill="plan", input="design login")

# Send feedback to Fork
fork_feedback(forkId="xxx", message="approved!")

# Complete Fork
fork_complete(forkId="xxx", summary="Plan approved")
```

### Episode Tools

```bash
# List episodes
episode_list(skillName="plan")

# Get episode output
episode_output(episodeId="xxx")
```

### Orchestration Tools

```bash
# Invoke orchestration
orchestration_invoke(skillName="implement", trigger="build login")

# Register new skill
skill_register(name="my-skill", type="orchestration", chain=[...])
```

---

## New v3.5 Skills

### /implement

Full pipeline: plan → tdd → verify → grill

```
User: implement user authentication
→ FORK /plan (collaborative planning)
→ THREAD /tdd (TDD cycle)
→ THREAD /verify (proof-based verification)
→ FORK /grill (adversarial testing)
```

### /plan

Interactive planning (blocking):

```
User: /plan
→ Questions about requirements
→ User provides feedback
→ Plan refined until approved
```

---

## Troubleshooting

### Fork blocking other agents

**FIX:** Fork only activates when `.hermes/` directory exists AND `isHermesAgent()` is true.

### Skills not loading

**FIX:** Skills are loaded from `src/skills/` directory at startup.

### Orchestration chain not working

**CHECK:** 
1. Skill is registered: `skill_list`
2. Chain has valid steps
3. Each step skill exists

---

## Updating from v3.0

```bash
# Backup
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup

# Replace plugin
rm -rf ~/.config/opencode/plugins/hermes-agent-v3.5
mkdir -p ~/.config/opencode/plugins/hermes-agent-v3.5
cp new-version/dist/index.js ~/.config/opencode/plugins/hermes-agent-v3.5/

# Restart OpenCode
```
