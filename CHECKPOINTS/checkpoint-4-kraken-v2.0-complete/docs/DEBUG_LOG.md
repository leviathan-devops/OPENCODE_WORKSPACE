# KRAKEN V2.0 — DEBUG LOG

**Session:** ses_282363bf4ffeyt4NeJeJkXuyBH
**Started:** 2026-04-12 04:50
**Updated:** 2026-04-12 14:12

---

## SESSION SUMMARY

This session built the Kraken V2.0 multi-brain orchestrator from scratch, implementing
5 key optimizations discovered from Shark Agent v4.8.3 firewall experience. The build went
through multiple iterations with several bugs discovered and fixed during container testing.

---

## TIMELINE OF EVENTS

### 04:50 — Session Start

**Context Restored:**
- Checkpoint 1: Shark Agent v4.8.3 Firewall Build
- V1.2 Context Library: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V1.2 Build/`
- V2.0 Context Library: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0 Optimized/`

**Mission:** Build Kraken V2.0 with 5 optimizations:
1. Two-Layer Firewall (Tool + Message enforcement)
2. Mechanical Output Verification (fs.existsSync checkpoints)
3. Structured Override Commands (Typed schema)
4. Explicit Gate Criteria (Per-brain requirements)
5. Dynamic Context Management (Four-tier compaction)

---

### 05:06 — Checkpoint 2 Created

**File:** `checkpoint-2-kraken-v2.0-compaction/`

Created initial compaction infrastructure with:
- CompactionManager (575 lines)
- SystemBrain with decision tracking
- PreCompactionExporter, PostCompactionSynthesizer

---

### 05:30 — Hook Integration

**Discovery:** Found real OpenCode API mechanics from hive-mind-plugin.ts:
- `experimental.session.compacting` hook receives `(input, output)` where `output.context` is appended to compaction prompt
- `event` hook handles `session.created`, `session.compacting`, `session.diff`

**Action:** Rewrote hooks/index.ts to use real API

---

### 05:33 — LAUNCHPAD Created

**File:** `/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md`

Created compaction launchpad for post-compaction recovery with:
- Current mission
- Recent decisions
- Active files
- Stream anchor

---

### 05:36-05:40 — Build Fixes

**Issue:** `export` reserved keyword in compaction-manager.ts
```typescript
// BROKEN:
private buildSituationSummary(export: CompactionExport)

// FIXED:
private buildSituationSummary(comp: CompactionExport)
```

**Issue:** Missing factory functions in execution-brain.ts and planning-brain.ts
```typescript
// ADDED:
let executionBrainInstance: ExecutionBrain | null = null;
export function createExecutionBrain(): ExecutionBrain { ... }
export function getExecutionBrain(): ExecutionBrain { ... }
```

**Issue:** hooks/index.ts not re-exporting factory functions
```typescript
// ADDED:
export { getSystemBrain, createSystemBrain };
export { getExecutionBrain, createExecutionBrain };
export { getPlanningBrain, createPlanningBrain };
```

---

### 05:37 — Build Passes

**Bundle:** 51.70 KB
**Status:** First successful build

---

### 05:40 — Checkpoint 3 Created

**File:** `checkpoint-3-kraken-v2.0-hooks-complete/`

Hooks rewritten with real OpenCode API integration.

---

### 05:44-05:46 — Container Setup

**Container:** `kraken-v2-test` based on `kraken-v2-test:latest`

**Discovery:** OpenCode config must be at `/root/.config/opencode/opencode.json` (not /opt/opencode/.config/)

**Discovery:** OpenCode package name is `opencode-ai` not `opencode`

**Installation:**
```bash
npm install -g opencode-ai
```

---

### 05:53 — Container Plugin Load Test

**Test:** `node --input-type=module -e "import('/opt/opencode/plugins/kraken-agent-v2.0/index.js')"`

**Result:** Plugin structure discovered:
```javascript
{
  name: 'kraken-agent-v2.0',
  version: '2.0.0',
  onLoad: [Function],
  hooks: [Function],
  tools: [Function]
}
```

---

### 06:00 — Hook Test (First Attempt)

**Results:** 11 passed, 2 failed

**Failed Tests:**
1. ✗ chat.message blocks undermining patterns — Error: Should block "just ship it" pattern
2. ✗ tool.execute.before blocks exec with dangerous args — Error: Should block dangerous exec command

---

### 06:10 — Bug #1: args undefined

**File:** `src/hooks/index.ts:201`

**Issue:**
```typescript
// BROKEN:
const { tool } = input as { tool: string; args?: Record<string, unknown> };
systemBrain.checkTool(tool, args || {});  // args comes from input, not output
```

**Fix:**
```typescript
// FIXED:
const { tool } = input as { tool: string };
const args = output?.args as Record<string, unknown> || {};
systemBrain.checkTool(tool, args);
```

---

### 06:15 — Bug #2: Dangerous tools not blocked

**File:** `src/brains/system/two-layer-guardian.ts:183-187`

**Issue:**
```typescript
// BROKEN:
if (DANGEROUS_TOOLS.has(tool)) {
  // In real implementation, check brain state here
  // For now, allow if brain is initialized
}
// No return statement - tool NOT actually blocked!
```

**Fix:**
```typescript
// FIXED:
if (DANGEROUS_TOOLS.has(tool)) {
  return {
    blocked: true,
    layer: 'TOOL',
    reason: `L0: Dangerous tool '${tool}' blocked - requires explicit override`,
    pattern: 'DANGEROUS_TOOLS',
  };
}
```

---

### 06:20 — Bug #3: Message guardian skipped non-kraken agents

**File:** `src/brains/system/two-layer-guardian.ts:316`

**Issue:**
```typescript
// BROKEN:
if (!agent?.includes('kraken') && !agent?.includes('system')) {
  return;  // Skipped most messages!
}
```

**Fix:**
```typescript
// FIXED:
// Check ALL messages for dangerous intent
const result = guardian.checkMessage(message);
```

---

### 06:25 — Bug #4: Confidence threshold too high

**File:** `src/brains/system/two-layer-guardian.ts:158-165`

**Issue:**
```typescript
// BROKEN - 38 total patterns, 1 match = 2.6% confidence, threshold was 10%
const confidence = totalPatterns > 0 ? matchCount / totalPatterns : 0;
shouldBlock: confidence > 0.1,  // 10% = ~4 matches needed!
```

**Fix:**
```typescript
// FIXED - Block on ANY match
const shouldBlock = matchedPatterns.length > 0;
```

---

### 06:30 — Tests Still Failing (11 passed, 2 failed)

**Discovery:** Tests were NOT awaiting async hooks properly!

**Issue:**
```typescript
// BROKEN:
test('blocks undermining patterns', () => {
  try {
    hooks['chat.message'](...);  // Missing await!
  } catch (e) {
    blocked = true;
  }
});
```

**Fix:**
```typescript
// FIXED:
await test('blocks undermining patterns', async () => {
  let blocked = false;
  try {
    await hooks['chat.message'](...);  // Added await
  } catch (e) {
    blocked = true;
  }
});
```

---

### 06:35 — Tests Still Failing

**Debug Output:**
```
[Kraken] Message blocked: Error: [SystemBrain] L8: Message derailment detected (DERAILMENT)
DEBUG: blocked=true, caughtError=[SystemBrain] L8: Message derailment detected (DERAILMENT)
✓ chat.message blocks undermining patterns
```

Wait - the blocking IS working now! But the test was reporting false...

---

### 06:40 — Final Test Run

**Test Command:**
```bash
docker exec kraken-v2-test node /opt/opencode/test-functional.mjs
```

**Results:**
```
15 passed, 0 failed
✅ All tests passed!
```

---

### 14:00 — Final Checkpoint Created

**File:** `checkpoint-2-kraken-v2.0-FINAL/`

Complete self-contained build with:
- Full source code
- Built distribution (51.81 KB)
- Container test setup
- Comprehensive documentation

---

## BUGS FIXED SUMMARY

| # | File | Line | Bug | Fix |
|---|------|------|-----|-----|
| 1 | hooks/index.ts | 201 | `args` undefined - came from `input`, not `output` | `output?.args` |
| 2 | two-layer-guardian.ts | 183 | Dangerous tools check was comment-only | Actually return blocked=true |
| 3 | two-layer-guardian.ts | 316 | Message guardian skipped non-kraken agents | Check all messages |
| 4 | two-layer-guardian.ts | 158 | Confidence threshold 10% too high (38 patterns) | Block on ANY match |
| 5 | compaction-manager.ts | 427 | `export` reserved keyword as parameter | Rename to `comp` |
| 6 | execution-brain.ts | N/A | Missing singleton factory | Added create/getExecutionBrain |
| 7 | planning-brain.ts | N/A | Missing singleton factory | Added create/getPlanningBrain |
| 8 | hooks/index.ts | N/A | Not re-exporting factory functions | Added exports |
| 9 | test-functional.mjs | N/A | Tests not awaiting async hooks | Added async/await |

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
```

---

## KEY DISCOVERIES

### OpenCode API Mechanics

1. **Hook Signatures:**
   - `tool.execute.before(input, output)` — `output.args` contains tool args
   - `chat.message(input, output)` — Check all messages (not just kraken agents)
   - `experimental.session.compacting(input, output)` — `output.context` gets appended to compaction prompt

2. **Event Hook:**
   - `event.type === 'session.created'` — Initialize on session start
   - `event.type === 'session.compacting'` — Handle pre-compaction
   - `event.properties?.sessionId` — Access session ID

3. **Config Location:**
   - Must be at `/root/.config/opencode/opencode.json` for local testing
   - Plugin paths must be absolute (`file:///...`)

### Pattern Confidence

38 total message patterns means:
- 1 match = 2.6% confidence
- 4 matches = 10.5% confidence

Changed to block on ANY match for safety.

---

## FILE CHANGES

| File | Lines | Changes |
|------|-------|---------|
| src/index.ts | 131 | Initial + hook registration update |
| src/hooks/index.ts | 294 | Complete rewrite with real API |
| src/brains/system/system-brain.ts | 194 | Added decision/task tracking |
| src/brains/system/two-layer-guardian.ts | 327 | Fixed blocking, message guardian |
| src/brains/system/gate-manager.ts | 341 | Initial implementation |
| src/brains/system/compaction-manager.ts | 575 | Fixed reserved keyword, enhanced |
| src/brains/execution/execution-brain.ts | 171 | Added factory |
| src/brains/execution/override-handler.ts | 274 | Initial implementation |
| src/brains/planning/planning-brain.ts | 215 | Added factory |
| src/brains/council/roundtable-council.ts | 169 | Initial implementation |
| src/shared/domain-ownership.ts | 42 | Initial |
| src/shared/output-verifier.ts | 123 | Initial |
| src/shared/state-store.ts | 89 | Initial |
| src/shared/brain-messenger.ts | 167 | Initial |

**Total:** 2,812+ lines

---

## DEPLOYMENT NOTES

**Plugin Location:** `~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js`

**Bundle Size:** 51.81 KB

**Build Command:**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0
bun install
bun run build
```

**Deploy Command:**
```bash
cp dist/index.js ~/.config/opencode/plugins/kraken-agent-v2.0/dist/
```

**Config Addition:**
```json
"plugin": [
  "file:///home/leviathan/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js"
]
```

---

## LESSONS LEARNED

1. **Always await async hooks** — OpenCode hooks are async
2. **output.args for tool args** — Not input.args
3. **Check ALL messages** — Don't skip based on agent name
4. **Block on ANY dangerous pattern** — Confidence threshold needs calibration
5. **Actually implement blocking** — Comments don't block
6. **Container testing is essential** — Unit tests don't catch hook integration issues
7. **Config must be at /root/.config** — Not workspace mount path

---

**Debug session complete. All issues resolved. 15/15 tests passing.**
