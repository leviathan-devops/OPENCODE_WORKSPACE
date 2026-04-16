# OpenCode Plugin Engineering — Quickstart

**One page. Start here.**

---

## The Rule

> **Skill ≠ Plugin**
> - Skill = `.md` in `~/.hermes/skills/` → agent knowledge
> - Plugin = `.js` bundle in `opencode.json` → OpenCode runtime

**Build to `dist/index.js`. Always.**

---

## 1. Create Plugin Structure

```
plugins/my-plugin/
├── src/
│   └── index.ts        ← Entry point
├── dist/               ← Built output
├── package.json
└── opencode.json       ← Registration
```

---

## 2. Minimal Plugin (src/index.ts)

```typescript
import { tool, type Plugin, type PluginInput, type Hooks } from '@opencode-ai/plugin';

export default async function MyPlugin(input: PluginInput): Promise<Hooks> {
  return {
    tool: {
      myTool: tool({
        description: "Does something",
        args: {},
        execute: async (args, ctx) => {
          return JSON.stringify({ success: true });
        }
      })
    }
  };
}
```

---

## 3. Build

```bash
cd plugins/my-plugin
bun install
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```

---

## 4. Register

In `opencode.json`:

```json
{
  "plugin": [
    "file:///full/path/to/plugins/my-plugin/dist/index.js"
  ]
}
```

---

## 5. Verify

```bash
opencode --print-logs --agent default "test"
# Look for: service=plugin path=... loading plugin
```

---

## Key Hooks

| Hook | When | Use |
|------|------|-----|
| `tool.execute.before` | Pre-tool | Validate, block |
| `tool.execute.after` | Post-tool | Track, evidence |
| `chat.message` | On message | Route, delegate |

---

## Full Docs

- **SKILL.md** — This skill's entry point
- **layers/layer-1-CORE.md** — Complete engineering guide
- **references/HOOK_MAP.md** — All hooks with signatures
- **cases/SKILL_VS_PLUGIN_CASE_STUDY.md** — Why plugins fail
