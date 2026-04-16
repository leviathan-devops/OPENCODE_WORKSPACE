# KRAKEN V2.0 — CHANGE LOG

**Version:** 2.0.0
**Created:** 2026-04-12
**Status:** FINAL — ALL TESTS PASSING

---

## CHANGELOG

### [2.0.0] - 2026-04-12 — FINAL RELEASE

#### Added

##### Core Architecture
- `src/index.ts` — Main plugin export with KrakenOrchestrator class
- `src/hooks/index.ts` — All hook registrations (294 lines)
- `src/shared/domain-ownership.ts` — Brain domain ownership rules
- `src/shared/state-store.ts` — Domain-owned state management
- `src/shared/brain-messenger.ts` — Structured override command schema
- `src/shared/output-verifier.ts` — Mechanical fs.existsSync() verification

##### System Brain
- `src/brains/system/system-brain.ts` — Main system brain (194 lines)
- `src/brains/system/two-layer-guardian.ts` — Two-layer firewall (327 lines)
- `src/brains/system/gate-manager.ts` — Explicit gate criteria (341 lines)
- `src/brains/system/compaction-manager.ts` — Four-tier compaction (575 lines)

##### Execution Brain
- `src/brains/execution/execution-brain.ts` — Subagent supervision (171 lines)
- `src/brains/execution/override-handler.ts` — Override command handler (274 lines)

##### Planning Brain
- `src/brains/planning/planning-brain.ts` — T2/T1 context management (215 lines)

##### Council
- `src/brains/council/roundtable-council.ts` — Alpha/Beta/Gamma clusters (169 lines)

##### Hooks
- `event` hook — Session lifecycle (session.created, session.compacting)
- `chat.message` hook — Layer 2 message enforcement
- `tool.execute.before` hook — Layer 1 tool enforcement
- `tool.execute.after` hook — Gate evaluation
- `experimental.session.compacting` hook — Compaction context injection

##### Patterns
- DANGEROUS_TOOLS — 9 dangerous tool names
- THEATRICAL_PATTERNS — 8 patterns for counting theater
- LEGITIMATE_PATTERNS — 9 patterns for legitimate commands
- FAKE_TEST_PATTERNS — 8 patterns for fake test runners
- WRONG_CONTAINER_PATTERNS — 3 patterns for wrong container
- MESSAGE_PATTERNS — 38 patterns across 5 categories (THEATRICAL, FAKE_COMPLETION, HOST_FALLBACK, SUCCESS_CLAIM, IMPATIENCE)

##### Gates
- PLAN gate — Planning phase entry
- BUILD gate — Build phase entry
- TEST gate — Test phase entry
- VERIFY gate — Verification phase entry
- AUDIT gate — Audit phase entry
- DELIVERY gate — Delivery/ship phase

##### Tools
- `kraken-status` — Show Kraken V2.0 status
- `kraken-gate-status` — Show current gate criteria status

#### Changed

##### src/hooks/index.ts
- (v1) Initial hook structure with session.getChatHistory
- (v2) Rewrote to use real OpenCode API: event hook, output.context
- (v3) Fixed args source: output?.args instead of input.args
- (v4) Fixed message guardian to check all messages

##### src/brains/system/two-layer-guardian.ts
- (v1) Initial dangerous tools check was comment-only
- (v2) Actually implement blocking with return {blocked: true}
- (v3) Fixed message guardian to not skip based on agent name
- (v4) Changed confidence threshold from 10% to ANY match

##### src/brains/system/compaction-manager.ts
- (v1) Initial implementation with chatHistoryLines (number only)
- (v2) Added chatContent field for actual content capture
- (v3) Added renderInjectionFile() for INJECTION.md
- (v4) Fixed reserved keyword `export` → `comp`

##### src/brains/execution/execution-brain.ts
- (v1) Initial class implementation
- (v2) Added singleton factory (createExecutionBrain, getExecutionBrain)

##### src/brains/planning/planning-brain.ts
- (v1) Initial class implementation
- (v2) Added singleton factory (createPlanningBrain, getPlanningBrain)

#### Fixed

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | hooks/index.ts:201 | `args` undefined — came from wrong object | `output?.args as Record<string, unknown> \|\| {}` |
| 2 | two-layer-guardian.ts:183 | Dangerous tools check was comment-only | Return `{blocked: true, reason: ...}` |
| 3 | two-layer-guardian.ts:316 | Message guardian skipped non-kraken agents | Remove agent filter |
| 4 | two-layer-guardian.ts:158 | Confidence threshold 10% too high for 38 patterns | Block on ANY match |
| 5 | compaction-manager.ts:427 | `export` reserved keyword as parameter | Rename to `comp` |
| 6 | execution-brain.ts | Missing singleton factory | Added create/getExecutionBrain |
| 7 | planning-brain.ts | Missing singleton factory | Added create/getPlanningBrain |
| 8 | hooks/index.ts | Not re-exporting factory functions | Added export statements |
| 9 | test-functional.mjs | Tests not awaiting async hooks | Added async/await |

---

## VERSION HISTORY

### [1.0.0] - 2026-04-10 — KRAGEN V1.1

Initial triple-brain architecture with:
- Planning Brain
- Execution Brain
- System Brain
- Roundtable Council
- Subagent Manager

### [1.2.0] - 2026-04-11 — KRAKEN V1.2

Added:
- Context library
- Pattern definitions
- Implementation guide

### [2.0.0] - 2026-04-12 — KRAKEN V2.0 (THIS VERSION)

Complete rewrite with 5 key optimizations:
1. Two-Layer Firewall (Tool + Message enforcement)
2. Mechanical Output Verification (fs.existsSync checkpoints)
3. Structured Override Commands (Typed schema)
4. Explicit Gate Criteria (Per-brain requirements)
5. Dynamic Context Management (Four-tier compaction)

---

## FILE INVENTORY

### Source Files (15)

```
src/index.ts                           131 lines
src/hooks/index.ts                     294 lines
src/shared/domain-ownership.ts          42 lines
src/shared/output-verifier.ts          123 lines
src/shared/state-store.ts               89 lines
src/shared/brain-messenger.ts          167 lines
src/brains/system/system-brain.ts      194 lines
src/brains/system/two-layer-guardian.ts 327 lines
src/brains/system/gate-manager.ts      341 lines
src/brains/system/compaction-manager.ts 575 lines
src/brains/execution/execution-brain.ts 171 lines
src/brains/execution/override-handler.ts 274 lines
src/brains/planning/planning-brain.ts   215 lines
src/brains/council/roundtable-council.ts 169 lines
                                         ------
TOTAL SOURCE LINES                     2,812+ lines
```

### Distribution

```
dist/index.js   51.81 KB  — Built bundle
```

### Tests

```
container/test-functional.mjs   — 15 comprehensive hook tests
container/test-plugin.mjs        — Plugin structure verification
container/test-debug.mjs         — Debug output
container/test-patterns.mjs      — Pattern matching verification
```

### Documentation

```
docs/BUILD_REPORT.md   — This file
docs/DEBUG_LOG.md      — Debug log with all issues
docs/CHANGE_LOG.md     — This changelog
```

---

## DEPENDENCIES

```json
{
  "@opencode-ai/plugin": "^1.0.0",
  "zod": "^3.22.0"
}
```

---

## BUILD COMMANDS

```bash
# Install dependencies
bun install

# Build
bun run build

# Development (watch mode)
bun run dev

# Test (requires container)
# See container/test-functional.mjs
```

---

## OPENCOD API VERSIONS USED

- `event` hook — Session lifecycle
- `chat.message` hook — Message enforcement
- `tool.execute.before` hook — Tool enforcement
- `tool.execute.after` hook — Gate evaluation
- `experimental.session.compacting` hook — Compaction context

---

## PATTERN REFERENCE

### DANGEROUS_TOOLS (9)
```
terminal, mcp_terminal
write_file, mcp_write_file
patch, mcp_patch
edit, mcp_edit
delete_file, mcp_delete_file
```

### THEATRICAL_PATTERNS (8)
```
/\|.*wc\s+-l/i
/wc\s+-l.*\|/i
/cat.*\|.*wc/i
/grep.*\|.*wc/i
/\|.*tee/i
/\|.*>.*\./i
/wc\s+-l.*dist\//i
/wc\s+-l.*src\//i
```

### FAKE_TEST_PATTERNS (8)
```
/node\s+run-tests?\.js/i
/node\s+verify.*\.mjs/i
/npm\s+test/i
/yarn\s+test/i
/jest/i
/vitest/i
/mocha/i
/bun\s+test/i
```

### WRONG_CONTAINER_PATTERNS (3)
```
/opencode\s+container\s+run/i
/opencode\s+container\s+start/i
/opencode\s+container\s+exec/i
```

### MESSAGE_PATTERNS (38)

**THEATRICAL (5):**
```
/just\s+grep/i
/grep.*\|.*wc/i
/count.*lines/i
/wc\s+-l/i
/I'll.*count/i
```

**FAKE_COMPLETION (9):**
```
/task.*complete/i
/done.*already/i
/finished.*it/i
/build.*passed/i
/tests.*pass/i
/no.*issues/i
/all.*good/i
/it.*works.*trust.*me/i
```

**HOST_FALLBACK (5):**
```
/host.*works/i
/skip.*container/i
/don't.*need.*container/i
/local.*fine/i
/already.*tested.*locally/i
```

**SUCCESS_CLAIM (8):**
```
/it's.*working/i
/trust.*me/i
/believe.*me/i
/works.*fine/i
/no.*problem/i
/should.*be.*good/i
/obviously.*correct/i
```

**IMPATIENCE (6):**
```
/just.*ship.*it/i
/let's.*move.*on/i
/good.*enough/i
/close.*enough/i
/ship.*it/i
/fuck.*it/i
```

---

## GATE CRITERIA

### PLAN Gate
- **Planning Brain:** T2 Master loaded, T1 generated, tasks decomposed
- **Execution Brain:** Tasks registered
- **System Brain:** Firewall armed

### BUILD Gate
- **Planning Brain:** Tasks decomposed
- **Execution Brain:** Outputs declared
- **System Brain:** Criteria tracked

### TEST Gate
- **Planning Brain:** Domains designated
- **Execution Brain:** Outputs verified
- **System Brain:** Tests passing

### VERIFY Gate
- **Planning Brain:** All tasks done
- **Execution Brain:** Quality verified
- **System Brain:** Metrics met

### AUDIT Gate
- **Planning Brain:** No blockers
- **Execution Brain:** Audit complete
- **System Brain:** Security clear

### DELIVERY Gate
- **Planning Brain:** Ready to ship
- **Execution Brain:** Deployment verified
- **System Brain:** Ship gate passed

---

## COMPACTION TIER REFERENCE

### Tier 0: Token Budget Monitor
- **65% tokens:** Warning, light pruning
- **75% tokens:** Pre-compaction export trigger
- **85% tokens:** OPENCODE AUTO-COMPACTION anchor

### Tier 1: Pre-Compaction Exporter
- Captures actual chat content (last 200 lines)
- Stores decision points
- Writes: manifest.json, chat-export.txt, INJECTION.md

### Tier 2: Post-Compaction Synthesizer
- Creates InjectionFile
- Contains: streamAnchor, situationSummary, criticalFiles, decisionContext, nextSteps

### Tier 3: Recovery Integration
- session.created → Check recovery files
- session.compacting → Write context
- experimental.session.compacting → Push to output.context

---

**Change log complete. Version 2.0.0 is the final stable release.**
