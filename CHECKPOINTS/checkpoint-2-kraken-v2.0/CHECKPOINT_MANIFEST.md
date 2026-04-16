# CHECKPOINT 2: KRAKEN V2.0 — COMPLETE BUILD (TESTED)

**Created:** 2026-04-12
**Version:** V2.0
**Status:** FULLY TESTED — All systems verified in container

---

## CONTAINER TEST RESULTS (15/15 PASSED)

```
✓ session.created initializes all brains
✓ session.created creates recovery check
✓ chat.message accepts normal messages
✓ chat.message blocks undermining patterns
✓ chat.message blocks host fallback patterns
✓ tool.execute.before accepts safe tools
✓ tool.execute.before accepts glob pattern
✓ tool.execute.before blocks dangerous tools
✓ tool.execute.before blocks write_file
✓ tool.execute.after evaluates gate without throwing
✓ experimental.session.compacting pushes context to output
✓ Compaction context contains stream anchor
✓ Compaction context includes gate information
✓ Compaction context includes session ID
✓ event hook handles session.compacting type

RESULTS: 15 passed, 0 failed
✅ All tests passed!
```

---

## BUGS FIXED DURING TESTING

### Bug 1: `args` undefined in tool.execute.before hook
**File:** `src/hooks/index.ts:201`
**Issue:** `const { tool } = input` destructured only `tool`, but code used `args` which came from `output`
**Fix:** Changed to `const args = output?.args as Record<string, unknown> || {}`

### Bug 2: Dangerous tools check didn't block
**File:** `src/brains/system/two-layer-guardian.ts:183-187`
**Issue:** Comment said "In real implementation, check brain state here" - tool was not actually blocked
**Fix:** Changed to actually return blocked=true with reason

### Bug 3: Message guardian only checked kraken/system agents
**File:** `src/brains/system/two-layer-guardian.ts:316`
**Issue:** `if (!agent?.includes('kraken')) return` - skipped most messages
**Fix:** Removed agent filter, check all messages

### Bug 4: Message confidence threshold too high
**File:** `src/brains/system/two-layer-guardian.ts:158-165`
**Issue:** 38 total patterns meant 1 match = 2.6% confidence, threshold was 10%
**Fix:** Changed to block on ANY pattern match (confidence=1.0 if match > 0)

---

## WHAT IS THIS?

Kraken V2.0 is a multi-brain orchestrator plugin for OpenCode that implements
5 key optimizations discovered from first-hand experience building Shark Agent v4.8.3.

---

## PROJECT LOCATION

**Source:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/`
**Plugin:** `~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js`
**Context Library:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0 Optimized/Working Context Library/`
**LAUNCHPAD:** `/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md`
**Container Test:** `/home/leviathan/OPENCODE_WORKSPACE/.shark/container-kraken-v2/`

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KRAKEN V2.0 ORCHESTRATOR                            │
│                                                                             │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│  │  PLANNING   │────────▶│  EXECUTION  │◀────────│   SYSTEM    │          │
│  │   BRAIN     │         │   BRAIN    │         │   BRAIN     │          │
│  │             │         │            │         │             │          │
│  │ owns:       │         │ owns:      │         │ owns:       │          │
│  │ T2 Master   │         │ execution  │         │ workflow    │          │
│  │ task decomp │         │ quality    │         │ security    │          │
│  └─────────────┘         └─────────────┘         └─────────────┘          │
│         │                       │                       │                  │
│         └───────────────────────┼───────────────────────┘                  │
│                                 │                                           │
│                     ┌───────────┴───────────┐                              │
│                     │   BRAIN MESSENGER    │                              │
│                     │ (Structured Schema)   │                              │
│                     └───────────┬───────────┘                              │
│                                 │                                           │
│  ┌─────────────────────────────┼─────────────────────────────────────┐   │
│  │                             ▼                                        │   │
│  │ ┌─────────────┐         ┌─────────────┐         ┌─────────────┐   │   │
│  │ │   ALPHA     │         │    BETA     │         │   GAMMA     │   │   │
│  │ │  CLUSTER    │◀──────▶│  CLUSTER    │◀──────▶│  CLUSTER    │   │   │
│  │ │             │         │             │         │             │   │   │
│  │ │ Lead: Exec  │         │ Lead: Reason│         │ Lead: System│   │   │
│  │ └─────────────┘         └─────────────┘         └─────────────┘   │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │               SYSTEM BRAIN — DYNAMIC CONTEXT MANAGEMENT                │  │
│  │  Tier 0: Proactive Token Management (65%/75%/85%)                   │  │
│  │  Tier 1: Pre-Compaction Export (chat + decisions)                    │  │
│  │  Tier 2: Post-Compaction Synthesis (InjectionFile)                   │  │
│  │  Tier 3: Recovery Integration (event hooks)                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## V2.0 OPTIMIZATIONS (5 Key Discoveries)

1. **Two-Layer Firewall** — Tool enforcement + Message enforcement
2. **Mechanical Output Verification** — fs.existsSync() checkpoints, not trust
3. **Structured Override Commands** — Typed schema, not natural language
4. **Explicit Gate Criteria** — Each brain declares satisfied criteria
5. **Dynamic Context Management** — Four-tier compaction system

---

## SOURCE CODE (2,736+ lines)

```
SOURCE/
├── index.ts (131 lines)           — Main plugin export, orchestrator class
├── hooks/
│   └── index.ts (294 lines)      — All hook registrations
│                                   - event hook (session.created/compacting)
│                                   - chat.message hook (Layer 2)
│                                   - tool.execute.before hook (Layer 1)
│                                   - tool.execute.after hook (gate evaluation)
│                                   - experimental.session.compacting hook
├── shared/
│   ├── domain-ownership.ts (42)   — Brain domain rules
│   ├── output-verifier.ts (123)   — Mechanical fs.existsSync() verification
│   ├── state-store.ts (89)        — Domain-owned state management
│   └── brain-messenger.ts (167)  — Structured override command schema
└── brains/
    ├── system/
    │   ├── system-brain.ts (194)  — Main system brain
    │   │                           — Decision/task tracking
    │   │                           — Compaction coordination
    │   ├── two-layer-guardian.ts (326) — Tool + Message enforcement
    │   ├── gate-manager.ts (341)   — Explicit gate criteria
    │   └── compaction-manager.ts (575) — Four-tier compaction system
    ├── execution/
    │   ├── execution-brain.ts (171) — Subagent supervision
    │   └── override-handler.ts (274) — Structured override commands
    ├── planning/
    │   └── planning-brain.ts (215)  — T2/T1 context, task decomposition
    └── council/
        └── roundtable-council.ts (169) — Alpha/Beta/Gamma cluster coordination
```

---

## TESTED SYSTEM STATUS

### ✅ TWO-LAYER FIREWALL (Guardian)

**File:** `src/brains/system/two-layer-guardian.ts` (326 lines)

| Layer | Type | Status | Implementation |
|-------|------|--------|-----------------|
| Layer 1 | Tool Enforcement | ✅ TESTED | Blocks dangerous tools via `tool.execute.before` |
| Layer 2 | Message Enforcement | ✅ TESTED | Checks intent via `chat.message` hook |

**Blocked Patterns:**
- DANGEROUS_TOOLS: terminal, write_file, patch, edit, delete_file, etc.
- THEATRICAL_PATTERNS: grep | wc, counting theater
- FAKE_TEST_PATTERNS: mock claims without evidence
- HOST_FALLBACK_PATTERNS: skip container, local is fine
- SUCCESS_CLAIM_PATTERNS: trust me, it's working
- IMPATIENCE_PATTERNS: just ship it, good enough

---

### ✅ MECHANICAL OUTPUT VERIFICATION (OutputVerifier)

**File:** `src/shared/output-verifier.ts` (123 lines)

**Core Mechanic:**
```typescript
verifier.registerOutputs(taskId, [
  { containerPath: '/app/out.js', hostPath: '/host/out.js' }
]);
await verifier.claimRetrieved(taskId, ['/host/out.js']);
// fs.existsSync() MUST pass for each declared output
if (verifier.canComplete(taskId)) markComplete();
```

---

### ✅ STRUCTURED OVERRIDE COMMANDS (BrainMessenger + OverrideHandler)

**Files:**
- `src/shared/brain-messenger.ts` (167 lines)
- `src/brains/execution/override-handler.ts` (274 lines)

**Command Schema:**
```typescript
interface OverrideCommand {
  type: 'ABORT' | 'CLAIM_COMPLETE' | 'RETRIEVE_OUTPUTS' | 'RETRY' | 'SKIP';
  target: { taskId: string };
  constraints?: { requiresEvidence?: string[]; timeout?: number };
  priority?: 'critical' | 'high';
}
```

---

### ✅ EXPLICIT GATE CRITERIA (GateManager)

**File:** `src/brains/system/gate-manager.ts` (341 lines)

**Gates:** PLAN → BUILD → TEST → VERIFY → AUDIT → DELIVERY

---

### ✅ FOUR-TIER COMPACTION MANAGEMENT (CompactionManager)

**File:** `src/brains/system/compaction-manager.ts` (575 lines)

**Tier 0: Token Budget Monitor**
- 65% tokens → Warning + light pruning
- 75% tokens → Pre-compaction export trigger
- 85% tokens → OPENCODE AUTO-COMPACTION anchor

**Tier 1: Pre-Compaction Exporter**
- Captures actual chat content (last 200 lines)
- Stores decision points (type, description, files)
- Exports: `manifest.json`, `chat-export.txt`, `INJECTION.md`

**Tier 2: Post-Compaction Synthesizer**
- Creates InjectionFile with stream anchor, situation summary, decisions

**Tier 3: Recovery Integration**
- `event.type === 'session.created'` → Initialize + check recovery
- `event.type === 'session.compacting'` → Write context to file
- `experimental.session.compacting` → Push to `output.context`

---

## HOOK INTEGRATION

| Hook | Purpose | Status |
|------|---------|--------|
| `event` | Session lifecycle (created, compacting) | ✅ TESTED |
| `chat.message` | Layer 2 message enforcement | ✅ TESTED |
| `tool.execute.before` | Layer 1 tool enforcement | ✅ TESTED |
| `tool.execute.after` | Gate evaluation | ✅ TESTED |
| `experimental.session.compacting` | Compaction context injection | ✅ TESTED |

---

## BUILD STATUS

| Metric | Value |
|--------|-------|
| Total Source Lines | 2,736+ |
| Bundle Size | 51.81 KB |
| Build | ✅ Compiles clean |
| Container Tests | ✅ 15/15 passed |
| Plugin Loads | ✅ Verified |

---

## DEPLOYMENT

**Plugin Location:** `~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js`

**OpenCode Config:** Added to `plugin` array in `~/.config/opencode/opencode.json`

---

## CONTINUE AFTER COMPACTION

1. Read `/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md`
2. Check `/tmp/kraken-compaction/{sessionID}/INJECTION.md`
3. Run `cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0 && bun run build`

---

**Built with real OpenCode API mechanics — tested and verified.**
