# OpenCode Plugin Deployment SOP

**Purpose**: Document the exact process for successfully deploying an OpenCode plugin. This is the canonical reference for any future plugin shipping.

---

## The Golden Rule

> **A plugin is a compiled JS bundle (`dist/index.js`). A skill is a markdown file (`SKILL.md`). They are completely different systems.**

OpenCode cannot load a SKILL.md as a plugin. It needs `dist/index.js`.

---

## Why coding-subagents WORKS

### 1. Correct File Structure

```
~/OPENCODE_WORKSPACE/plugins/coding-subagents/
├── src/
│   ├── index.ts          ← Plugin entry point
│   └── tools/
│       ├── gemma.ts
│       ├── qwen.ts
│       └── route.ts
├── dist/
│   └── index.js          ← 457KB BUNDLED output (what OpenCode loads)
├── package.json
├── tsconfig.json
└── SKILL.md              ← Optional skill reference (NOT the plugin)
```

**Key**: OpenCode loads `dist/index.js`, not the TypeScript source.

### 2. Correct Registration in opencode.json

```json
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js"
]
```

The path explicitly points to the **bundled JS file**, not a folder, not a SKILL.md.

### 3. Build Command

```bash
cd ~/OPENCODE_WORKSPACE/plugins/coding-subagents
bun build src/index.ts \
  --outdir dist \
  --target bun \
  --format esm \
  --bundle
```

This compiles TypeScript → JavaScript and bundles all dependencies into a single `dist/index.js`.

### 4. Plugin Architecture (How it works)

The plugin exports a function that returns OpenCode hooks:

```typescript
// src/index.ts
export default async function CodingSubagents(): Promise<Hooks> {
  const tools = createToolRegistry();  // { route, gemma, qwen }
  return { tool: tools };
}
```

OpenCode:
1. Loads the JS bundle
2. Calls the default export function
3. Registers the returned `tool` hooks
4. Tools become available to agents automatically

### 5. Verification

```bash
opencode --print-logs run "Use the route tool to recommend which sub-agent for: write fibonacci" --agent default
```

Output shows `CodingSubagents initialized` and the tool executes successfully.

---

## Why opencode-plugin-engineering FAILS

### The Conflation

The agent confused **skills** (Hermes agent knowledge) with **plugins** (OpenCode extensions).

| | Skill | Plugin |
|--|-------|--------|
| **Location** | `~/.hermes/skills/` | `opencode.json` plugin array |
| **Format** | Markdown (SKILL.md) | JavaScript bundle (dist/index.js) |
| **Loaded by** | Hermes agent (manual via `skill_view`) | OpenCode (at startup) |
| **Purpose** | Agent knowledge/context | Tools, agents, hooks |

### What opencode-plugin-engineering Actually Has

```
~/hermes-workspace/shared/handoff/opencode-plugin-engineering/
├── SKILL.md              ← A SKILL (for Hermes agent knowledge)
├── HANDOVER.md           ← Documentation
├── SKILL_FULL.md         ← More documentation
├── KNOWLEDGE_LIBRARY.md  ← File listing
└── (NO dist/index.js)    ← Not a plugin!
```

### What the Other Agent Tried

```json
"plugin": [
  "file:///home/leviathan/hermes-workspace/shared/handoff/opencode-plugin-engineering/"
]
```

This is a **folder path**, not a path to `dist/index.js`. OpenCode looks for `dist/index.js` inside a folder, but this folder doesn't have one — it only has markdown files.

### The Registration Attempt

The other agent tried to register the folder itself. OpenCode resolution rules:

| Path Type | Resolution |
|-----------|------------|
| Ends in `.js` | Load directly |
| Ends in `.ts` | Compile and load |
| Is a directory | Look for `dist/index.js` or `index.js` |

The folder has **no `dist/` subdirectory** and no `index.js` — so OpenCode cannot load it as a plugin.

---

## The SOP (Step by Step)

### Phase 1: Create the Plugin

```bash
# 1. Create plugin directory
mkdir -p ~/OPENCODE_WORKSPACE/plugins/<plugin-name>/src/tools

# 2. Initialize package.json
cd ~/OPENCODE_WORKSPACE/plugins/<plugin-name>
cat > package.json << 'EOF'
{
  "name": "<plugin-name>",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target bun --format esm --bundle"
  },
  "peerDependencies": {
    "@opencode-ai/plugin": "^1.3.6"
  }
}
EOF

# 3. Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
EOF
```

### Phase 2: Write the Plugin Code

```typescript
// src/index.ts
import type { Hooks } from '@opencode-ai/plugin';

export default async function MyPlugin(): Promise<Hooks> {
  return {
    tool: {
      myTool: {
        description: 'What this tool does...',
        args: { /* Zod schema */ },
        execute: async (args) => { /* ... */ }
      }
    }
  };
}
```

### Phase 3: Build

```bash
cd ~/OPENCODE_WORKSPACE/plugins/<plugin-name>
bun install
bun run build
```

**Verify**:
```bash
ls -la dist/
# Should show: dist/index.js
```

### Phase 4: Register in opencode.json

```bash
# Edit opencode.json
code ~/.config/opencode/opencode.json
```

Add to the `plugin` array:

```json
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/<plugin-name>/dist/index.js"
]
```

### Phase 5: Verify

```bash
opencode --print-logs run "Use myTool with argument X" --agent default
```

Look for:
- `MyPlugin initialized` in logs
- Tool executes without errors

### Phase 6 (Optional): Create a SKILL.md

If you want agents to know how to use the plugin, create a skill:

```bash
mkdir -p ~/.hermes/skills/
cat > ~/.hermes/skills/my-plugin.md << 'EOF'
---
name: my-plugin
description: How to use the my-plugin OpenCode tool
---

# My Plugin

Use the `myTool` for [specific task].

## When to Use

- [Scenario 1]
- [Scenario 2]
EOF
```

**Important**: The SKILL.md goes in `~/.hermes/skills/`, NOT in the plugin folder. The plugin folder should only contain code.

---

## Quick Reference

| Action | Command |
|--------|---------|
| Build plugin | `bun run build` (in plugin dir) |
| Verify bundle exists | `ls dist/index.js` |
| Check plugin registered | `cat ~/.config/opencode/opencode.json \| jq '.plugin'` |
| Test plugin loads | `opencode --print-logs run "use mytool" --agent default` |
| Verify skill exists | `ls ~/.hermes/skills/` |

---

## Common Failure Modes

### 1. No dist/index.js
```
ERROR: Plugin path doesn't resolve to a .js file
FIX: Run `bun run build` in the plugin directory
```

### 2. Wrong path in opencode.json
```
WRONG:  "file:///path/to/plugin-folder/"
RIGHT:  "file:///path/to/plugin-folder/dist/index.js"
```

### 3. Conflating SKILL with PLUGIN
```
WRONG:  "file:///path/to/SKILL.md"
WRONG:  "file:///path/to/handoff-folder/"
RIGHT:  "file:///path/to/plugin/dist/index.js"
```

### 4. Forgetting to rebuild after changes
```
FIX: After any src/ change, always run `bun run build`
```

---

## Two Patterns: Tool Plugin vs Knowledge Plugin

### Pattern 1: Tool Plugin (coding-subagents)

A plugin that provides **executable tools**:

```
OPENCODE_WORKSPACE/plugins/coding-subagents/
├── src/
│   ├── index.ts          ← Exports { tool: { gemma, qwen, route } }
│   └── tools/
├── dist/
│   └── index.js          ← Bundled tools
├── SKILL.md              ← For OpenCode skill discovery
└── package.json
```

**Use when**: You want agents to invoke code generation, API calls, CLI tools.

### Pattern 2: Knowledge Plugin (opencode-plugin-engineering)

A plugin that provides **knowledge lookup** as a tool:

```
OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/
├── src/
│   ├── index.ts          ← Exports { tool: { opencode-plugin-engineering } }
│   │                      ← Tool reads from knowledge base files
│   └── utils/
├── dist/
│   └── index.js
├── SKILL.md              ← Copied from knowledge library
├── (references/)         ← Knowledge base files live elsewhere
│                          (in Shared Workspace Context/Plugin Engineering/)
└── package.json
```

**Use when**: You want agents to query documentation, SOPs, reference materials on-demand.

### Key Difference

| Aspect | Tool Plugin | Knowledge Plugin |
|--------|-------------|------------------|
| Tool does | Executes code, calls APIs | Reads files, returns content |
| Knowledge lives | In tool logic | In markdown files |
| Trigger | Agent calls the tool | Agent calls tool with query |

---

## The Distinction Visualized

```
~/.hermes/skills/           ← Skills (Hermes agent knowledge)
  └── opencode-plugin-engineering/SKILL.md

~/.config/opencode/opencode.json  ← Plugin registry
  └── "plugin": ["file:///.../coding-subagents/dist/index.js"]

OPENCODE_WORKSPACE/plugins/ ← Plugin source code
  ├── coding-subagents/
  │   ├── src/              ← TypeScript source
  │   ├── dist/index.js     ← Compiled bundle (what OpenCode loads)
  │   └── SKILL.md          ← For skill discovery
  └── opencode-plugin-engineering/
      ├── src/              ← Tool that queries knowledge files
      ├── dist/index.js     ← Compiled bundle
      └── SKILL.md          ← Copied from knowledge library

Knowledge Base (separate):
OPENCODE_WORKSPACE/Shared Workspace Context/Plugin Engineering/
  ├── SKILL.md
  ├── layers/layer-1-CORE.md
  ├── references/*.md
  └── PLUGIN_SHIP_SOP.md
```

**Ship is not complete until:**
1. `dist/index.js` exists (build step)
2. Path registered in `opencode.json` (points to dist/index.js)
3. Plugin verified working via `opencode --print-logs run`
4. SKILL.md exists in plugin directory (for auto-discovery)
