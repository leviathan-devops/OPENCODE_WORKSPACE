# OPENCODE OPERATIONAL GUARDRAILS - NUCLEAR PREVENTION SYSTEM

**Purpose:** Ironclad rules that PREVENT catastrophic failures like Kraken V2.0
**Binding:** ALL agents, ALL tasks, ALL ships
**Enforcement:** These are not suggestions. They are LAW.

---

## 🚫 THE 10 COMMANDMENTS

### 1. THOU SHALT NOT KILL RUNNING SESSIONS
- **NEVER** `kill`, `pkill`, `killall` on opencode processes
- **NEVER** kill processes to "fix" memory issues
- Memory problems are solved via architecture, not murder
- If you need to fix something, DO IT IN WORKSPACE, not via process termination

### 2. THOU SHALT TEST IN TUI CONTAINER
- `opencode run` has BROKEN hooks - it is USELESS for testing
- Only TUI mode (`opencode /workspace`) fires all hooks properly
- If it wasn't tested in TUI, it is NOT tested

### 3. THOU SHALT NOT USE HOOK ARRAYS
- OpenCode hooks expect SINGLE functions, NOT arrays
- ❌ `'hook.name': [hook1, hook2]`
- ✅ `'hook.name': async (input, output) => { await hook1(input, output); await hook2(input, output); }`

### 4. THOU SHALT NOT USE EXPERIMENTAL HOOKS
- `session.ended` - NOT A VALID EVENT
- `experimental.*` - unless explicitly documented, DO NOT USE
- Valid hooks: `session.created`, `chat.message`, `tool.execute.before`, `tool.execute.after`

### 5. THOU SHALT NOT OVERWRITE V1 SYSTEMS
- Always preserve previous working versions
- Install new versions ALONGSIDE, not instead of
- Zero overwrites until new version is VERIFIED

### 6. THOU SHALT NOT EDIT RUNNING CONFIG
- opencode.json is LIVE - edits while running can corrupt
- Edit configs only in workspace, then deploy

### 7. THOU SHALT DEFENSIVE AGENT REGISTRATION
```typescript
config: async (opencodeConfig) => {
  if (!opencodeConfig.agent) opencodeConfig.agent = {};
  Object.assign(opencodeConfig.agent, agents);
}
```

### 8. THOU SHALT NOT SHIP WITHOUT CHECKPOINTS
- Create checkpoint before every ship
- Self-contained with all docs and test package
- Location: `CHECKPOINTS/checkpoint-{name}/`

### 9. THOU SHALT NOT IGNORE MEMORY PRESSURE
- 2.89GB database = BAD
- Multiple opencode instances = NORMAL (one per session)
- Memory issues fix via architecture: summarization, compaction, archival

### 10. THOU SHALT COPY BEFORE EDIT
- If a file needs editing and it's not in workspace, COPY IT FIRST
- Everything lives in `/home/leviathan/OPENCODE_WORKSPACE/`
- Temp files use `/tmp/`, never home directory

---

## 🔴 EMERGENCY ABORT SEQUENCE

If you feel the urge to:
- Kill a process → STOP → Fix in workspace instead
- Edit opencode.json → STOP → Edit in workspace first
- Use `opencode run` for testing → STOP → Use TUI
- Push to production → STOP → Create checkpoint + checklist first

---

## ✅ PRE-SHIP CHECKLIST (MANDATORY)

- [ ] Hooks are SINGLE FUNCTIONS, not arrays
- [ ] No experimental hooks used
- [ ] Agent registration is defensive (null check)
- [ ] Tested in TUI container (not `opencode run`)
- [ ] Checkpoint created before ship
- [ ] v1.x preserved (zero overwrites)
- [ ] Cross-plugin test: Manta + Shark still work
- [ ] Memory check: DB size reasonable (<500MB)
- [ ] Bundle size: 50-60KB typical
- [ ] Grep verify: `grep "createToolSummarizerHook" dist/index.js` finds definition

---

## 🆘 RECOVERY PROTOCOL

If something breaks:
1. **DO NOT** kill processes
2. **DO** restore from checkpoint
3. **DO** analyze what went wrong in workspace docs
4. **DO** update guardrails with lessons learned
5. **DO NOT** ship again until checklist complete

---

## 📋 CONTEXT INJECTION ORDER

When starting any task, inject this order:
1. Read GUARDRAILS.md (this file)
2. Read MANDATORY_PRE_SHIP_CHECKLIST.md
3. Read TUI_CONTAINER_TESTING.md
4. Read SHIP_FAILURE_FORENSIC.md
5. Proceed with task

---

**VIOLATION OF THESE RULES = INSTANT JOB FAILURE**
**NO EXCEPTIONS. NO EXCUSES.**
