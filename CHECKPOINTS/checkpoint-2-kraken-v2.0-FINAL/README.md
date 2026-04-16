# KRAKEN V2.0 — COMPLETE BUILD PACKAGE

**Version:** 2.0.0
**Status:** ✅ FULLY TESTED — 15/15 TESTS PASSING
**Bundle Size:** 51.81 KB
**Source Lines:** 2,812+

---

## QUICK START

```bash
# 1. Install dependencies
bun install

# 2. Build
bun run build

# 3. Deploy
cp dist/index.js ~/.config/opencode/plugins/kraken-agent-v2.0/dist/

# 4. Add to opencode.json
# Add: "file:///home/leviathan/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js"

# 5. Test in container
docker build -t kraken-v2-test -f container/Dockerfile container/
docker run -it kraken-v2-test
```

---

## WHAT IS KRAKEN V2.0?

Kraken V2.0 is a multi-brain orchestrator plugin for OpenCode that implements 5 key
optimizations discovered from first-hand experience building the Shark Agent v4.8.3 firewall:

1. **Two-Layer Firewall** — Tool enforcement + Message enforcement
2. **Mechanical Output Verification** — fs.existsSync() checkpoints, not trust
3. **Structured Override Commands** — Typed schema, not natural language
4. **Explicit Gate Criteria** — Each brain declares satisfied criteria
5. **Dynamic Context Management** — Four-tier compaction system

---

## PROJECT STRUCTURE

```
kraken-agent-v2.0/
├── src/                          # TypeScript source (2,812+ lines)
│   ├── index.ts                 # Main plugin export
│   ├── hooks/index.ts            # All hook registrations
│   ├── shared/                   # Shared utilities
│   │   ├── domain-ownership.ts  # Brain domain rules
│   │   ├── output-verifier.ts   # fs.existsSync() checkpoints
│   │   ├── state-store.ts       # Domain-owned state
│   │   └── brain-messenger.ts   # Override command schema
│   └── brains/                   # Brain implementations
│       ├── system/               # System brain + guardians
│       ├── execution/            # Execution brain
│       ├── planning/             # Planning brain
│       └── council/              # Roundtable council
├── dist/
│   └── index.js                 # Built bundle (51.81 KB)
├── container/                   # Container test setup
│   ├── Dockerfile               # Container definition
│   ├── test-functional.mjs      # 15 comprehensive tests
│   └── plugins/                # Pre-copied plugins
├── docs/                        # Documentation
│   ├── BUILD_REPORT.md         # Full build report
│   ├── DEBUG_LOG.md            # Debug log
│   └── CHANGE_LOG.md           # Change log
└── package.json                # Dependencies
```

---

## CONTAINER TESTING

```bash
# Build container
docker build -t kraken-v2-test -f container/Dockerfile container/

# Run container
docker run -it --name kraken-v2-test kraken-v2-test

# Inside container, run tests
node /opt/opencode/test-functional.mjs
```

**Expected Results:**
```
15 passed, 0 failed
✅ All tests passed!
```

---

## HOOKS IMPLEMENTED

| Hook | Purpose | Status |
|------|---------|--------|
| `event` | Session lifecycle | ✅ Tested |
| `chat.message` | Layer 2 message enforcement | ✅ Tested |
| `tool.execute.before` | Layer 1 tool enforcement | ✅ Tested |
| `tool.execute.after` | Gate evaluation | ✅ Tested |
| `experimental.session.compacting` | Compaction context | ✅ Tested |

---

## FILES CREATED

### Source (15 files, 2,812+ lines)
- src/index.ts
- src/hooks/index.ts
- src/shared/domain-ownership.ts
- src/shared/output-verifier.ts
- src/shared/state-store.ts
- src/shared/brain-messenger.ts
- src/brains/system/system-brain.ts
- src/brains/system/two-layer-guardian.ts
- src/brains/system/gate-manager.ts
- src/brains/system/compaction-manager.ts
- src/brains/execution/execution-brain.ts
- src/brains/execution/override-handler.ts
- src/brains/planning/planning-brain.ts
- src/brains/council/roundtable-council.ts

### Tests (4 files)
- container/test-functional.mjs
- container/test-plugin.mjs
- container/test-debug.mjs
- container/test-patterns.mjs

### Documentation (3 files)
- docs/BUILD_REPORT.md
- docs/DEBUG_LOG.md
- docs/CHANGE_LOG.md

---

## KEY CODE PATTERNS

### Mechanical Output Verification
```typescript
verifier.registerOutputs(taskId, [
  { containerPath: '/app/out.js', hostPath: '/host/out.js' }
]);
await verifier.claimRetrieved(taskId, ['/host/out.js']);
if (verifier.canComplete(taskId)) markComplete();
```

### Structured Override
```typescript
{
  type: 'ABORT' | 'CLAIM_COMPLETE' | 'RETRIEVE_OUTPUTS',
  target: { taskId },
  constraints: { requiresEvidence: ['test.json'] }
}
```

### Compaction Context Injection
```typescript
experimental.session.compacting: (input, output) => {
  output.context.push(contextStr);  // Appended to summary
}
```

---

## AFTER COMPACTION

1. Read launchpad: `/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md`
2. Check recovery: `/tmp/kraken-compaction/{sessionID}/INJECTION.md`
3. Rebuild if needed: `bun run build`

---

## BUGS FIXED DURING TESTING

| # | Bug | Fix |
|---|-----|-----|
| 1 | `args` undefined in tool hook | `output?.args` |
| 2 | Dangerous tools not blocked | Return `{blocked: true}` |
| 3 | Message guardian skipped agents | Check all messages |
| 4 | Confidence threshold too high | Block on ANY match |
| 5 | `export` reserved keyword | Rename to `comp` |
| 6-9 | Missing factories, exports | Added create/get functions |

---

## DEPENDENCIES

```json
{
  "@opencode-ai/plugin": "^1.0.0",
  "zod": "^3.22.0"
}
```

---

## BUILD METRICS

| Metric | Value |
|--------|-------|
| Source Lines | 2,812+ |
| Bundle Size | 51.81 KB |
| Tests | 15/15 PASSED |
| Hook Types | 5 |
| Pattern Types | 38+ |
| Gates | 6 |

---

## OPENCOD API

Requires OpenCode with plugin API:
- `event` hook for session lifecycle
- `chat.message` hook for message enforcement
- `tool.execute.before` hook for tool enforcement
- `tool.execute.after` hook for gate evaluation
- `experimental.session.compacting` hook for compaction

---

**Built with real OpenCode API mechanics — not theater.**
