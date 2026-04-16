# SOURCE MAP — Shark Agent v4.8.3

## Project Root
`/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/`

## Key Source Files

### Hooks (`src/hooks/v4.1/`)

| File | Purpose | Lines |
|------|---------|-------|
| `guardian-hook.ts` | **FIREWALL** — 155 patterns, L0-L8 | 572 |
| `chat-message-hook.ts` | Agent identity detection | ~50 |
| `session-hook.ts` | Brain initialization | ~100 |
| `gate-hook.ts` | Evidence collection, gate advancement | ~200 |
| `tool-summarizer-hook.ts` | Output reduction | ~60 |
| `compacting-hook.ts` | Session state compaction | ~40 |
| `system-transform-hook.ts` | System prompt injection | ~100 |
| `agent-state.ts` | Agent state management | ~30 |
| `utils.ts` | Utility functions | ~50 |
| `index.ts` | Hook exports | ~50 |

### Shared State (`src/shared/`)

| File | Purpose |
|------|---------|
| `state-store.ts` | Domain-owned state |
| `gates.ts` | GateManager — mechanical phase enforcement |
| `evidence.ts` | EvidenceCollector |
| `guardian.ts` | Zone-based path protection |
| `messenger.ts` | Brain-to-brain communication |
| `agent-identity.ts` | isSharkAgent() function |

### Tools (`src/tools/`)

| Tool | Purpose |
|------|---------|
| `shark-status.ts` | Shows current brain, gate, iteration |
| `shark-gate.ts` | Manual gate control |
| `shark-evidence.ts` | View/manage evidence |
| `shark-test-runner.ts` | End-to-end test execution |
| `checkpoint.ts` | State snapshots |

### Tests

| File | Purpose |
|------|---------|
| `direct-test.mjs` | Unit tests for patterns (17/17 passing) |
| `verify-patterns.mjs` | Pattern verification |

### Build Outputs

| File | Purpose |
|------|---------|
| `dist/index.js` | 1MB bundled output |
| `direct-test.mjs` | Can run from project root |

## Checkpoint Location
`/home/leviathan/OPENCODE_WORKSPACE/CHECKPOINTS/checkpoint-1-shark-v4.8.3/`

## Plugin Deployment
`~/.config/opencode/plugins/shark-agent-v4/dist/index.js`

## How to Rebuild

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle
cp dist/index.js ~/.config/opencode/plugins/shark-agent-v4/dist/
```

## How to Run Tests

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
node direct-test.mjs
```