# OpenCode Plugin Agent Tab Toggle Registration

## Problem
Custom plugin agents (e.g., `hermes`, `architect`) do not appear in the OpenCode tab switcher UI even when:
- The plugin loads and executes correctly
- Delegation via `@agentname` works
- The agent responds with its own system prompt

## Root Cause
The OpenCode tab switcher reads agent names from `opencode.json`'s `agent` section, NOT from plugin `agent` fields returned by `getAgentConfigs()`.

**Config hierarchy (later overrides earlier):**
1. `~/.config/opencode/opencode.json` - base config, loaded first
2. `~/.opencode/opencode.jsonc` - user config, loaded second (overrides `agent` section completely)
3. Project-level `.opencode/opencode.jsonc` - loaded last

Plugins register agents dynamically via `getAgentConfigs()`, but this does NOT populate the tab switcher registry. The tab switcher only shows agents explicitly listed in the JSON config's `agent` section.

**Example:** Spider Agent's `architect` has `disable: true` in `opencode.json`'s agent section. This is how the tab switcher knows about architect - it was manually registered there. Without this entry, the tab would not show architect despite the plugin working correctly.

## Solution

Add the agent to BOTH config files:

**~/.config/opencode/opencode.json** (line ~417):
```json
"agent": {
  "architect": { "disable": true },
  "hermes": { "color": "#D35400" },
  "plan": { "color": "#F59E0B" }
}
```

**~/.opencode/opencode.jsonc** (must have agent section too - this was the bug):
```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "hermes": { "color": "#D35400" }
  },
  "plugin": [
    "file:///path/to/plugin/dist/index.js",
    "list"
  ]
}
```

## Fields in agent config

| Field   | Purpose                                      |
|---------|----------------------------------------------|
| `color` | Tab color                                    |
| `disable` | Prevent tab from showing                   |
| `mode` | Not supported in JSON config; tab shows `(all)` if omitted, `(primary)` if set |

## Verification

```bash
opencode agent list --pure
# Should show: hermes (all)

opencode run "@hermes test"
# Should delegate to hermes agent, fire hermes_recall tool
```

## Debug: Why is tab missing?

1. Check `opencode agent list --pure` - does it show the agent?
2. Check `~/.config/opencode/opencode.json` agent section - is the agent listed there?
3. Check `~/.opencode/opencode.jsonc` agent section - does it ALSO have the agent? (config override bug)
4. Check plugin path in opencode.jsonc - does it point to the correct (latest) build directory?

## See Also
- `REFERENCE/PLUGIN_SPEC.md` - Plugin architecture and agent registration mechanics
- `REFERENCE/DELEGATION_GATE.md` - How @agent delegation works
- `SKILLS/DEBUG.md` - Plugin debugging workflow