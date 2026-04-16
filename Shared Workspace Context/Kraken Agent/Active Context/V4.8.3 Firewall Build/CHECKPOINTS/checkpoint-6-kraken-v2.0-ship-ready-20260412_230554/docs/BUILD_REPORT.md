# KRAKEN V2.0 — FULL BUILD REPORT

**Version:** 2.0.0  
**Built:** 2026-04-12  
**Status:** ✅ COMPLETE — ALL TESTS PASSING (15/15)  
**Bundle Size:** 51.81 KB  
**Source Lines:** 2,812+

---

## EXECUTIVE SUMMARY

Kraken V2.0 is a multi-brain orchestrator plugin for OpenCode that implements 5 key
optimizations discovered from first-hand experience building the Shark Agent v4.8.3 firewall system.

**Key Achievement:** Container testing verified all hooks work correctly — 15/15 tests passing.

---

## ARCHITECTURE OVERVIEW

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
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │               SYSTEM BRAIN — DYNAMIC CONTEXT MANAGEMENT                │  │
│  │  Tier 0: Proactive Token Management (65%/75%/85%)                   │  │
│  │  Tier 1: Pre-Compaction Export (chat + decisions)                     │  │
│  │  Tier 2: Post-Compaction Synthesis (InjectionFile)                  │  │
│  │  Tier 3: Recovery Integration (event hooks)                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## V2.0 OPTIMIZATIONS (5 Key Discoveries from Shark v4.8.3)

### 1. Two-Layer Firewall
**Problem:** Guardian fires on tool.execute.before only, but `opencode run` sends MESSAGES to agents.
Agents interpret messages and respond naturally, never calling blocked tools.

**Solution:** Tool enforcement + Message enforcement
- Layer 1: `tool.execute.before` hook blocks dangerous tools
- Layer 2: `chat.message` hook checks intent

### 2. Mechanical Output Verification
**Problem:** Task completion claimed without proof.

**Solution:** fs.existsSync() checkpoints
```typescript
verifier.registerOutputs(taskId, [{ containerPath, hostPath }]);
await verifier.claimRetrieved(taskId, [hostPath]);
if (verifier.canComplete(taskId)) markComplete();
```

### 3. Structured Override Commands
**Problem:** Natural language overrides can be misinterpreted.

**Solution:** Typed schema
```typescript
{ type: 'ABORT', target: { taskId }, constraints: { requiresEvidence: [...] } }
```

### 4. Explicit Gate Criteria
**Problem:** "Sync at gates" had no explicit criteria.

**Solution:** Each brain declares requirements per gate (PLAN/BUILD/TEST/VERIFY/AUDIT/DELIVERY)

### 5. Dynamic Context Management
**Problem:** Compaction disrupts stream of consciousness.

**Solution:** Four-tier system
- 65% tokens: Warning
- 75% tokens: Pre-compaction export
- 85% tokens: AUTO-COMPACTION
- Post-compaction: Recovery injection

---

## SOURCE CODE STRUCTURE

```
src/
├── index.ts                    (131 lines)  — Main plugin export
├── hooks/
│   └── index.ts               (294 lines)  — All hook registrations
├── shared/
│   ├── domain-ownership.ts    (42 lines)  — Brain domain rules
│   ├── output-verifier.ts    (123 lines)  — fs.existsSync() checkpoints
│   ├── state-store.ts         (89 lines)  — Domain-owned state
│   └── brain-messenger.ts   (167 lines)  — Override command schema
└── brains/
    ├── system/
    │   ├── system-brain.ts    (194 lines)  — Main system brain
    │   ├── two-layer-guardian.ts (327 lines) — Firewall
    │   ├── gate-manager.ts    (341 lines)  — Explicit gate criteria
    │   └── compaction-manager.ts (575 lines) — Four-tier compaction
    ├── execution/
    │   ├── execution-brain.ts (171 lines)  — Subagent supervision
    │   └── override-handler.ts (274 lines)  — Override commands
    ├── planning/
    │   └── planning-brain.ts  (215 lines)  — T2/T1 context
    └── council/
        └── roundtable-council.ts (169 lines) — Alpha/Beta/Gamma

TOTAL: 2,812+ lines
```

---

## FILE DETAILS

### src/index.ts (131 lines)

Main plugin export creating KrakenOrchestrator class:

```typescript
class KrakenOrchestrator {
  initialize()
  createHooks(): Hooks     // Registers all hooks
  createTools()            // kraken-status, kraken-gate-status
}
```

### src/hooks/index.ts (294 lines)

OpenCode hook registrations:

| Hook | Purpose |
|------|---------|
| `event` | Session lifecycle (created, compacting) |
| `chat.message` | Layer 2 message enforcement |
| `tool.execute.before` | Layer 1 tool enforcement |
| `tool.execute.after` | Gate evaluation |
| `experimental.session.compacting` | Compaction context injection |

Key function: `buildCompactionContext()` creates the context string injected at compaction.

### src/shared/output-verifier.ts (123 lines)

Mechanical output verification:

```typescript
class OutputVerifier {
  registerOutputs(taskId, outputs: OutputDeclaration[])
  async claimRetrieved(taskId, hostPaths)  // fs.existsSync() check
  canComplete(taskId): boolean
  collectEvidence(taskId): OutputEvidence
}
```

### src/shared/brain-messenger.ts (167 lines)

Structured override command schema:

```typescript
interface OverrideCommand {
  type: 'ABORT' | 'CLAIM_COMPLETE' | 'RETRIEVE_OUTPUTS' | 'RETRY' | 'SKIP';
  target: { taskId: string };
  constraints?: { requiresEvidence?: string[]; timeout?: number };
  priority?: 'critical' | 'high';
}
```

### src/brains/system/two-layer-guardian.ts (327 lines)

Two-layer enforcement:

**Layer 1 - Tool Enforcement:**
- DANGEROUS_TOOLS: terminal, write_file, patch, edit, delete_file
- THEATRICAL_PATTERNS: grep | wc, counting theater
- FAKE_TEST_PATTERNS: jest, vitest, npm test
- WRONG_CONTAINER_PATTERNS: opencode container

**Layer 2 - Message Enforcement:**
- IMPATIENCE_PATTERNS: "just ship it", "good enough"
- HOST_FALLBACK_PATTERNS: "skip container", "local is fine"
- SUCCESS_CLAIM_PATTERNS: "trust me", "it's working"

### src/brains/system/gate-manager.ts (341 lines)

Explicit gate criteria for 6 gates:

| Gate | Planning | Execution | System |
|------|----------|-----------|--------|
| PLAN | T2 loaded, T1 generated | tasks registered | firewall armed |
| BUILD | tasks decomposed | outputs declared | criteria tracked |
| TEST | domains designated | outputs verified | tests passing |
| VERIFY | all tasks done | quality verified | metrics met |
| AUDIT | no blockers | audit complete | security clear |
| DELIVERY | ready to ship | deployment verified | ship gate passed |

### src/brains/system/compaction-manager.ts (575 lines)

Four-tier compaction management:

**Tier 0: TokenBudgetMonitor**
- warningThreshold: 0.65 (65%)
- preCompactionThreshold: 0.75 (75%)
- compactionAnchor: 0.85 (85%)

**Tier 1: PreCompactionExporter**
- Captures actual chat content
- Stores decision points
- Writes: manifest.json, chat-export.txt, INJECTION.md

**Tier 2: PostCompactionSynthesizer**
- Creates InjectionFile with stream anchor
- situationSummary, criticalFiles, decisionContext, nextSteps

**Tier 3: Recovery Integration**
- event.type === 'session.created' → Check recovery
- experimental.session.compacting → Push to output.context

---

## BUILD METRICS

| Metric | Value |
|--------|-------|
| Total Source Lines | 2,812+ |
| Bundle Size | 51.81 KB |
| Build Time | ~7-36ms |
| Container Tests | 15/15 PASSED |
| Hook Types | 5 |
| Pattern Types | 38+ |
| Gates | 6 |

---

## CONTAINER TEST RESULTS (15/15)

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
```

---

## DEPLOYMENT

**Build:**
```bash
cd kraken-agent-v2.0
bun install
bun run build
```

**Deploy:**
```bash
cp dist/index.js ~/.config/opencode/plugins/kraken-agent-v2.0/dist/
```

**OpenCode Config:** Add to `~/.config/opencode/opencode.json`:
```json
"plugin": [
  "file:///home/leviathan/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js"
]
```

---

## AFTER COMPACTION

1. Read: `/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md`
2. Check: `/tmp/kraken-compaction/{sessionID}/INJECTION.md`
3. Rebuild: `cd kraken-agent-v2.0 && bun run build`

---

**Built with real OpenCode API mechanics — not theater.**
