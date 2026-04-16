# MANDATORY PRE-SHIP CHECKLIST

**Purpose:** Before ANY plugin ship, ALL items must be verified
**Binding:** Zero exceptions, zero shortcuts

---

## 🚫 THE 10 COMMANDMENTS (Reminder)

1. THOU SHALT NOT KILL RUNNING SESSIONS
2. THOU SHALT TEST IN TUI CONTAINER
3. THOU SHALT NOT USE HOOK ARRAYS
4. THOU SHALT NOT USE EXPERIMENTAL HOOKS
5. THOU SHALT NOT OVERWRITE V1 SYSTEMS
6. THOU SHALT NOT EDIT RUNNING CONFIG
7. THOU SHALT DEFENSIVE AGENT REGISTRATION
8. THOU SHALT NOT SHIP WITHOUT CHECKPOINTS
9. THOU SHALT NOT IGNORE MEMORY PRESSURE
10. THOU SHALT COPY BEFORE EDIT

---

## ✅ HOOK VALIDATION

- [ ] All hooks are SINGLE FUNCTIONS (grep: `hooks: {.*\[` should return nothing)
- [ ] No `session.ended` hook (grep: `session.ended` should return nothing)
- [ ] No `experimental.*` hooks (grep: `experimental.` should return nothing)
- [ ] `chat.message` has identity wall (grep: `agent !==` or `agent ===`)
- [ ] `tool.execute.after` has summarization (grep: `summarize` or `SUMMARIZE`)

---

## ✅ ARCHITECTURE VALIDATION

- [ ] Compaction writes to FILE only (grep: `output.context.push` should return nothing)
- [ ] Agent registration uses Object.assign (grep: `Object.assign`)
- [ ] No direct `config.agent = ` assignment
- [ ] Session state uses Map by sessionId (not global state)

---

## ✅ TESTING VALIDATION

- [ ] Config validated: `opencode debug config` passes
- [ ] Plugin loads in TUI: `docker run -it ... opencode-test:1.4.3`
- [ ] Hooks fire in TUI (not `opencode run`)
- [ ] All 5 hook types verified:
  - [ ] session.created fires
  - [ ] session.compacting fires
  - [ ] chat.message fires
  - [ ] tool.execute.before fires
  - [ ] tool.execute.after fires

---

## ✅ CROSS-PLUGIN VALIDATION

- [ ] Manta agent still in tab toggle
- [ ] Shark agent still in tab toggle
- [ ] No agent conflicts
- [ ] No hook conflicts
- [ ] Each agent works independently

---

## ✅ COMPACTION VALIDATION

- [ ] Compaction hook writes to /tmp/kraken-compaction/ (not output.context)
- [ ] session.created checks for recovery file
- [ ] Recovery file contains decision context
- [ ] After compaction, context restores correctly

---

## ✅ MEMORY VALIDATION

- [ ] Database size < 500MB (ls -lah ~/.local/share/opencode/opencode.db)
- [ ] No multiple orphaned processes (pgrep opencode | wc -l)
- [ ] Tool outputs summarized (50KB → ~500 chars)

---

## ✅ DEPLOYMENT VALIDATION

- [ ] Checkpoint created: `CHECKPOINTS/checkpoint-{name}/`
- [ ] v1.x preserved in separate directory
- [ ] Bundle size 50-60KB (ls -lah dist/index.js)
- [ ] Source maps NOT included in production build
- [ ] No console.log statements in production (or minimal)

---

## ✅ SHIP COMMANDS

```bash
# 1. Validate config
opencode debug config

# 2. Build
cd /path/to/plugin && npm run build

# 3. Test in container
docker run -it --rm \
  -v /tmp/test-config:/root/.config/opencode \
  opencode-test:1.4.3

# 4. Check logs
docker logs kraken-tui-test 2>&1 | grep -E "Error|error|Kraken|KRAKEN"

# 5. Verify cross-plugin
# - Tab toggle shows Manta, Shark, Kraken
# - Each works independently
```

---

## ❌ IF ANY CHECK FAILS

1. DO NOT SHIP
2. Fix the issue in workspace
3. Re-run checklist
4. Only ship when ALL items pass

---

## 📋 SHIP PACKAGE CONTENTS

```
CHECKPOINTS/checkpoint-{name}/
├── src/                    # Source code
├── dist/                   # Built bundle
├── docs/
│   ├── BUILD_REPORT.md    # What was built
│   ├── DEBUG_LOG.md       # Debug information
│   ├── CHANGE_LOG.md      # Changes from previous
│   └── SHIP_HYGIENE_REPORT.md  # This checklist signed
├── test-package/
│   └── test-functional.mjs # 15+ test cases
└── LAUNCHPAD/
    └── KRAKEN_LAUNCHPAD.md # Current context
```

---

**SIGN-OFF:** All items verified by: _______________
**Date:** _______________
**Version:** _______________

**VIOLATION OF THIS CHECKLIST = INSTANT SHIP FAILURE**
