import { getSupervisorSummary } from "../services/supervisor-loop.js";
import { listSessions } from "../tools/session-tools.js";

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
