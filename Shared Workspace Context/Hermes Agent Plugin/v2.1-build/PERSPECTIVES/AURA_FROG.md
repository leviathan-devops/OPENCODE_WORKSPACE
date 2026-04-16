# AURA FROG — Memory Heals Itself, LLM OS Architecture

Source: GitHub, aura-frog
Full analysis: `~/hermes-workspace/context/engineering/HERMES_AGENT_PLUGIN_SPEC.md`

---

## LLM OS Mental Model

| LLM Component | OS Equivalent |
|---------------|---------------|
| Claude | Kernel |
| Context Window | RAM |
| Project Files | Disk |
| Agents | Processes |
| 5-Phase TDD | Scheduler |
| MCP | Device Drivers |
| TOON | Compression |
| Approval Gates | Interrupts |
| Handoffs | IPC |

---

## Memory That Heals Itself

**Core principle**: All cached context is a hint. Verify against actual files before acting. Update state only after confirmed success.

```
WRONG:
  "I remember the file has X, so I'll modify it based on X"
  
RIGHT:
  "I remember the file has X, but let me verify:
   1. Read actual file
   2. Confirm X is still there
   3. Modify based on confirmed state
   4. Update memory only after verified success"
```

**Strict Write Discipline**: Memory is updated AFTER success, not BEFORE. Assumptions that turn out wrong are corrected immediately.

---

## 5-Phase TDD (mapped to Hermes)

| Aura Frog Phase | Hermes Phase | Description |
|-----------------|--------------|-------------|
| Understand + Design | Phase 0: Brainstorm | User approves plan |
| Test RED | Phase 2: Build (RED) | Failing test written |
| Build GREEN | Phase 2: Build (GREEN) | Minimal code to pass |
| Refactor + Review | Phase 3: Review | Auto quality + security |
| Finalize | Phase 5: Complete | Docs + notifications |

---

## 3-Tier Context Compression

| Tier | Trigger | Action |
|------|---------|--------|
| **MicroCompact** | Every 10 turns | Drop verbatim tool outputs |
| **AutoCompact** | 80% budget | Summarize decisions |
| **ManualCompact** | Handoff | Full session snapshot |

---

## Smart Complexity Routing

Automatically matches effort to task size:

| Task Type | Example | Routing |
|-----------|---------|---------|
| Trivial | Fix typo, rename variable | Direct edit — no agent |
| Simple | Add a method, fix a bug | @builder Lite |
| Moderate | New feature, refactor module | Full workflow |
| Complex | New service, architecture | Collaborative planning |

**No configuration needed** — the system auto-routes.

---

## 26 Conditional Hooks

Aura Frog hooks run ~40% fewer times than Spider's because they're conditional:

| Hook | Condition |
|------|-----------|
| security-guard | Only on Bash tool |
| format-enforcer | Only on Write/Edit tools |
| context-tracker | Only on Read tools |

---

## Hermes Adoption

**Keep from Aura Frog**:
- Memory heals itself → Hermes's Strict Write Discipline
- 3-tier compaction → Hermes's 5-tier compaction
- Smart complexity routing → Hermes's complexity classifier
- Framework packs → Hermes's auto-framework detection

**Adapt to Hermes**:
- Integrate with Spider's hook architecture (Aura Frog has fewer, more conditional hooks)
- Map to Hermes's 6-phase workflow
- Use Spider's enforcement as primary, Aura Frog's efficiency as optimization
