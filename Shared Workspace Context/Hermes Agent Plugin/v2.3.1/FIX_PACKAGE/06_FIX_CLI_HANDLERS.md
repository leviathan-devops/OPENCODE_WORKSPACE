# FIX 6: CLI Commands — NO HANDLERS (MEDIUM)

**Severity**: MEDIUM — commands registered but do nothing
**Status**: MUST FIX
**Source File**: `src/index.ts`
**Source Lines**: 319-329

---

## THE PROBLEM

Two CLI commands are registered as command templates but have no handler functions:

```typescript
opencodeConfig.command = {
  Hermes: {
    template: "/Hermes $ARGUMENTS",
    description: "Hermes management commands - view status, manage agents, check memory",
  },
  Shark: {
    template: "/Shark $ARGUMENTS",
    description: "Shark audit commands - run security audit on current project",
  },
};
```

These templates are registered but nothing handles the `/Hermes` or `/Shark` invocations. The build report marks this as complete but it's theatrical — the commands exist in the config but do nothing when invoked.

**Note**: The `/Shark` command references "shark-agent-plugin" which is a SEPARATE PROJECT. This is cross-contamination. The hermes-agent-plugin should NOT be registering Shark commands — that belongs to shark-agent-plugin.

---

## EXACT FIX

**Remove the Shark command entirely.** It does not belong to this project.

**For Hermes commands**: Implement actual handlers.

**Add to `src/config/hermes-commands.ts`** (new file):
```typescript
import { getSupervisorSummary } from "../services/supervisor-loop.js";
import { listSessions, loadSession } from "../tools/session-tools.js";

export type HermesCommandHandler = (args: string) => string | Promise<string>;

export const HERMES_COMMANDS: Record<string, { handler: HermesCommandHandler; description: string; usage: string }> = {
  status: {
    description: "Show current session status and supervisor overview",
    usage: "/Hermes status",
    handler: async (_args: string) => {
      const summary = getSupervisorSummary();
      const sessions = listSessions();
      return `## Hermes Status

**Supervisor**:
- Open Issues: ${summary.openCount}
- High Risk: ${summary.highRiskCount}

**Sessions**: ${sessions.length} active

${summary.highRiskCount > 0 ? "⚠ WARNING: High-risk issues require attention." : "✓ All clear."}`;
    },
  },
  agents: {
    description: "List available sub-agents and their current status",
    usage: "/Hermes agents",
    handler: async (_args: string) => {
      return `## Available Agents

| Agent | Mode | Purpose |
|-------|------|---------|
| hermes | primary | DevOps Manager — autonomous full-stack |
| analyst | subagent | Requirements → technical specs |
| builder | subagent | One task at a time with TDD |
| planner | subagent | No-placeholder adaptive planning |
| reviewer | subagent | Security + performance + patterns |
| quality-reviewer | subagent | Spec compliance + readability |
| grill | subagent | Adversarial attack testing |
| ripple | subagent | Cascading change analysis |
| drift-verifier | subagent | Phase completion verification |
| debugger | subagent | 4-phase systematic debugging |
| supervisor | subagent | Self-improving supervision loop |

**Total**: 11 agents`;
    },
  },
  memory: {
    description: "Show Hermes memory/session summary",
    usage: "/Hermes memory",
    handler: async (_args: string) => {
      const sessions = listSessions();
      return `## Hermes Memory

**Active Sessions**: ${sessions.length}
**Memory Store**: ~/.hermes/

Use \`list_sessions\` tool for detailed session management.`;
    },
  },
  help: {
    description: "Show available Hermes commands",
    usage: "/Hermes help",
    handler: async (_args: string) => {
      const cmds = Object.entries(HERMES_COMMANDS)
        .map(([name, cmd]) => `- **${name}**: ${cmd.description}\n  \`${cmd.usage}\``)
        .join("\n");
      return `## Hermes Commands\n\n${cmds}`;
    },
  },
};

export function parseHermesCommand(input: string): { command: string; args: string } | null {
  const match = input.match(/^\/hermes\s+(.+)$/i);
  if (!match) return null;
  const parts = match[1].split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1).join(" ");
  return { command, args: args || "" };
}

export async function executeHermesCommand(input: string): Promise<string> {
  const parsed = parseHermesCommand(input);
  if (!parsed) {
    return `Unknown command. Use \`/Hermes help\` for available commands.`;
  }
  const cmd = HERMES_COMMANDS[parsed.command];
  if (!cmd) {
    return `Unknown command: ${parsed.command}. Use \`/Hermes help\` for available commands.`;
  }
  return cmd.handler(parsed.args);
}
```

Then update `src/index.ts` to wire the handler.

**Find (lines 319-329)**:
```typescript
      opencodeConfig.command = {
        Hermes: {
          template: "/Hermes $ARGUMENTS",
          description: "Hermes management commands...",
        },
        Shark: {
          template: "/Shark $ARGUMENTS",
          description: "Shark audit commands...",
        },
      };
```

**Replace with**:
```typescript
      // Hermes commands are handled via chat input parsing
      // /Hermes status, /Hermes agents, /Hermes memory, /Hermes help
      // See: src/config/hermes-commands.ts
      opencodeConfig.command = {
        Hermes: {
          template: "/Hermes $ARGUMENTS",
          description: "Hermes management commands",
        },
        // NOTE: Shark commands belong to shark-agent-plugin, NOT hermes-agent-plugin
      };
```

Also add the import at the top of `src/index.ts`:
```typescript
import { executeHermesCommand } from "./config/hermes-commands.js";
```

And add a command handler hook (add to `composeHandlers` or add a new hook type).

---

## VERIFICATION

```bash
# 1. Verify hermes-commands.ts exists
ls -la v2.3.1-build/src/config/hermes-commands.ts

# 2. Verify Shark command is NOT registered
grep -n "Shark" v2.3.1-build/src/index.ts
# Expected: NO OUTPUT (removed)

# 3. Verify Hermes template still exists
grep -n "Hermes" v2.3.1-build/src/index.ts
# Expected: Hermes template + description

# 4. Verify status command works (unit test)
node -e "
const { HERMES_COMMANDS } = require('./v2.3.1-build/src/config/hermes-commands.js');
console.log('Commands:', Object.keys(HERMES_COMMANDS));
"

# 5. Build succeeds
cd v2.3.1-build && bun build.ts && echo "BUILD_OK"
```

---

## MECHANICAL ENFORCEMENT CHECKLIST

- [ ] `src/config/hermes-commands.ts` exists
- [ ] Contains `HERMES_COMMANDS` object with `status`, `agents`, `memory`, `help`
- [ ] Shark command REMOVED from index.ts
- [ ] Hermes template still present
- [ ] `bun build.ts` exits 0

