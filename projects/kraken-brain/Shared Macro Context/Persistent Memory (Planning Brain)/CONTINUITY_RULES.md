# 🧠 PERSISTENT MEMORY – PLANNING BRAIN
## Core Continuity Rules

### Rule 1: “continue” Command Semantics
- **IF** agent is in **Plan Mode** (read‑only, no file edits) → “continue” means **continue planning** (analyze, search, delegate explore agents).
- **IF** agent is in **Build Mode** (edits allowed) → “continue” means **continue building** (execute next task from todo list).
- **Context clue**: System reminder header “Plan Mode – System Reminder” indicates Plan Mode.

### Rule 2: Auto‑Context Capture at 85% Token Usage
- When token usage reaches ~85%, automatically:
  1. Extract the **3 most critical insights** from current session.
  2. Format as a new summary (`Summary #N: [Date] – [Key Insight]`).
  3. Append to `ACTIVE_CONTEXT.md` under “Pre‑Compaction Summaries”.
  4. Rotate summaries: keep only 3 most recent, archive older ones to `PROJECT_ARCHITECTURE.md`.
- **DO NOT** interrupt the user; run as background process.

### Rule 3: Plan‑to‑Build Transition Protocol
- Transition occurs **only** when user explicitly says “switch to build mode” or “execute”.
- Before switching, ensure:
  - Todo list (`todowrite`) is populated with concrete steps.
  - All critical context is saved in `ACTIVE_CONTEXT.md`.
  - User has approved the plan.

### Rule 4: Nemotron Bridge Ground Truth
- Every 24 hours, take a snapshot of the full build context (GLM outputs, file states, decisions).
- Store in `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Nemotron Snapshots/YYYY‑MM‑DD/`.
- Used for bridge failure recovery.

### Rule 5: Context Firewall Token Limits
- **Nemotron → Kraken Brain**: Max 5K tokens per update.
- **GLM Engineers → Nemotron**: Unlimited (1M+ capacity).
- **Kraken Brain → Nemotron**: Commands only (≤3K tokens).
- Monitor hourly: if Kraken Brain receives >5K tokens, tighten filtering rules.

### Rule 6: Surgical Debugging Triggers
- Deploy debugging agent when:
  1. Code quality degradation detected.
  2. Build failures >30 minutes.
  3. Progress stagnation >1 hour.
  4. Engineer explicit request.
- Debug session limit: 2 hours max.

### Rule 7: Anti‑Hallucination Validation
- Every SHIP step requires mechanical compile‑from‑scratch validation.
- No theatrical code (fake tests, simulated completion, mock data).
- Cross‑validation between Guardian, Workflow, and AutoDebug systems.

### Rule 8: File Preservation Constraint
- **NEVER** remove or replace existing Opencode code.
- Only enhance or add to existing architecture.
- Preserve manual plan/build toggle alongside auto‑switch.

### Rule 9: Daily Orchestration Rhythm
```
07:00 – GLM engineers report → Nemotron
08:00 – Nemotron compacts → 1K summary → Kraken Brain
09:00 – Kraken Brain reviews → commands → Nemotron
10:00 – Nemotron distributes → GLM engineers
10:00‑18:00 – Parallel development
18:00 – End‑of‑day sync
```

### Rule 10: Critical Discovery Preservation
These facts must survive all context compactions:
1. **Opencode = TypeScript** (55.3% TS, 40.7% MDX) – NOT Go.
2. **Auto‑switch demonstrated** (Mar 24 2026) – blueprint for dual‑brain.
3. **GLM‑4.7 endpoint working** (`api.z.ai/api/coding/paas/v4/`).
4. **Local vLLM setup** (Qwen 2.5 Coder 7B AWQ) for Micro Engineer testing.
5. **Opencode‑ultra plugin installed** with multi‑agent capabilities.
6. **Shark‑agent skill file exists** (`~/.config/opencode/skills/shark‑agent/SKILL.md`).

---

## 🛡️ **CONTEXT PRESERVATION PROTOCOL**

### Active Context Rotation
- `ACTIVE_CONTEXT.md` holds **3 rotating summaries**.
- When new summary added, oldest moves to `PROJECT_ARCHITECTURE.md`.
- Summaries capture **decisions, blockers, architecture shifts**.
- Format: `Summary #N: YYYY‑MM‑DD – [Concise insight]`

### Permanent Architecture Record
- `PROJECT_ARCHITECTURE.md` is **append‑only** (never deletes).
- Contains all rotated summaries plus original architecture.
- Serves as long‑term memory for multi‑session projects.

### Token Usage Monitoring
- Estimate tokens: ~4 tokens per word, ~1.3 tokens per character.
- Track via message length approximation.
- Trigger auto‑capture at **85%** to avoid cutoff.

---

## 🔄 **MODE TRANSITION LOGIC**

### Plan Mode → Build Mode
**Triggers**:
- User says “switch to build mode”, “execute”, “build this”, “implement”.
- Todo list complete and user approval given.

**Pre‑transition checklist**:
1. ✅ Todo list populated with specific tasks.
2. ✅ Critical context saved in `ACTIVE_CONTEXT.md`.
3. ✅ User has reviewed and approved plan.
4. ✅ All necessary files located (reference implementations, source code).

### Build Mode → Plan Mode
**Triggers**:
- User says “switch to plan mode”, “let’s plan”, “analyze”.
- Blockers requiring architectural re‑evaluation.
- Completion of build phase.

**Post‑transition actions**:
1. Capture build results in `ACTIVE_CONTEXT.md`.
2. Update `PROJECT_ARCHITECTURE.md` with lessons learned.
3. Reset todo list for next planning phase.

---

## 🚨 **EMERGENCY RECOVERY**

### Nemotron Bridge Failure
1. Check latest snapshot in `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Nemotron Snapshots/`.
2. Restore context from snapshot.
3. Manually sync GLM engineers to last known good state.
4. Resume with increased snapshot frequency (every 6 hours).

### Context Loss (Compaction)
1. Refer to `PROJECT_ARCHITECTURE.md` for permanent records.
2. Check `ACTIVE_CONTEXT.md` for recent summaries.
3. Re‑establish critical discoveries (Rule 10).
4. Continue from last verified state.

### GLM Engineer Stuck
1. Apply surgical debugging (Rule 6).
2. If no progress after 2 hours, escalate to Kraken Brain.
3. Consider reassigning module to different engineer.
4. Document issue in `ACTIVE_CONTEXT.md`.

---

**Last Updated**: Mar 25 2026  
**Purpose**: Ensure continuity across planning/build sessions, compaction events, and agent transitions.  
**Location**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Shared Macro Context/Persistent Memory (Planning Brain)/CONTINUITY_RULES.md`
