# Agent-Factory-Edition

Plugin agent boilerplate with factory-based multi-brain architecture support.

## Reference Documentation

**Start here before designing any multi-brain architecture:**

- `PARALLEL_PEER_BRAINS.md` — Shark Macro (triple-brain parallel peer) architecture: Execution + Reasoning + System brains racing concurrently through domain ownership, dynamic context injection, and gate-based synchronization. Based on shark-context ground truth at `/home/leviathan/OPENCODE_WORKSPACE/shark-agent-rebirth/shark-context/`.

## Quick Start

```bash
# Build
bun install
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Result: dist/index.js
```

## Key Files

| File | Purpose |
|------|---------|
| `HOTFIX_LOG.md` | Critical OpenCode SDK registration patterns for tab toggle agents |
| `PARALLEL_PEER_BRAINS.md` | Multi-brain peer execution architecture |
| `src/index.ts` | Plugin entry point |

## OpenCode Agent Registration Pattern

For tab toggle agents, the return object **must** have a direct `agent` property:

```typescript
return {
  name: "my-agent",
  agent: agentConfigs,          // ← Direct property (SDK reads at init)
  config: async (oc) => {       // ← Runtime merge
    Object.assign(oc.agent, agentConfigs);
  },
  tool: { ... },
  hooks: { ... }
};
```

Each agent config uses `config: { prompt }` not `instructions`:

```typescript
const agentConfigs = {
  myAgent: {
    name: "myAgent",
    config: {
      prompt: MY_PROMPT,        // ← "prompt" not "instructions"
      color: "#D35400"          // ← Tab toggle color
    },
    mode: "primary",           // ← "primary" for orchestrator
    tools: {}
  }
};
```

See `HOTFIX_LOG.md` for the complete fix pattern.
