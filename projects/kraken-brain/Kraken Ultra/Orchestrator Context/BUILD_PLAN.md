# KRAKEN ULTRA - ORCHESTRATOR BUILD PLAN

**Created**: Mar 26 2026
**Mode**: Build Mode
**Status**: Executing

---

## MISSION OVERVIEW

Build Nemotron Communication Layer + Kraken Ultra Architecture for efficient inter-agent communication with dynamic 2-8k token sizing.

---

## ARCHITECTURE SUMMARY

```
Orchestrator (128K context)
    ↕ 2-8k tokens (auto-sized, can request 24-72k)
Nemotron Communication Layer (1M context)
    ↕ Bidirectional routing
GLM Engineers (5 parallel)
```

---

## TOKEN SIZING LOGIC

### Default Sizes (Auto-Detected, Use Only What's Needed)
- **2K**: Simple acks, status updates ("Understood", "75% complete")
- **4K**: Progress reports, questions, dependencies
- **6K**: Build prompts, architecture decisions, code reviews
- **8K**: Debugging sessions, complex integrations, escalations

### Key Principle
**Messages use ONLY the tokens they need.** If a 2k message only needs 500 tokens, it uses 500 tokens. The limit is a maximum, not a target.

### Override Mechanisms
1. **Explicit**: `[TOKEN_OVERRIDE: 8k]`
2. **CRITICAL Priority**: Auto-doubles limit
3. **More Context**: Orchestrator requests → 24-72k delivered

---

## BUILD PHASES

### Phase 1: TurboQuant Archive (5 min) ✅
- Archive TurboQuant context
- Forget about it

### Phase 2: Nemotron Communication Layer (90 min) ⏳
- types.ts
- message-classifier.ts
- compression.ts
- routing.ts
- nemotron-bridge.ts
- config & docs

### Phase 3: Kraken Ultra Directory (30 min) ⏳
- ACTIVE_CONTEXT.md
- VERSION 1 & 2 prompts
- Test engineer prompts
- Protocols

### Phase 4: Shared Context Update (10 min) ⏳
- Update PROJECT_ARCHITECTURE.md

---

## SUCCESS CRITERIA

- ✅ TypeScript compiles without errors
- ✅ Message classifier uses minimal needed tokens
- ✅ "More context" returns relevant 24-72k
- ✅ All prompt versions have use-case tags
- ✅ Shared context updated

---

## CRITICAL FILES

- `/home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/` (main build)
- `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/` (active project)
- `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Shared Macro Context/PROJECT_ARCHITECTURE.md` (update)

---

**EXECUTING NOW**
