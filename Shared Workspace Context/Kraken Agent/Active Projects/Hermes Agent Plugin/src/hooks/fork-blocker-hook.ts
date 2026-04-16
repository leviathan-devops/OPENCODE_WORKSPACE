import { getForkManager } from "../services/fork-manager.js";
import { isHermesAgent } from "../config/agent-identity.js";
import { existsSync } from "fs";
import { join } from "path";

const FORK_ALLOWED_TOOLS = [
  "fork_create",
  "fork_complete",
  "fork_feedback",
  "fork_status",
  "episode_list",
  "episode_output",
  "episode_summary",
  "delegate_task",
  "orchestration_invoke",
  "orchestration_status",
];

export function createForkBlockerHook() {
  return async (input: { tool: string; agent?: string; directory?: string }, _output: any) => {
    if (!isHermesAgent(input.agent ?? "")) {
      return;
    }

    const baseDir = input.directory ?? process.cwd();
    if (!existsSync(join(baseDir, ".hermes"))) {
      return;
    }

    const fm = getForkManager();

    if (fm.isActive() && !FORK_ALLOWED_TOOLS.includes(input.tool)) {
      const activeFork = fm.getActiveFork();
      throw new Error(
        `FORK_BLOCKED: Fork '${activeFork?.skillName}' is active (${activeFork?.id}). ` +
        `Only ${FORK_ALLOWED_TOOLS.join(", ")} tools allowed during Fork. ` +
        `Use fork_feedback to send input.`
      );
    }
  };
}
