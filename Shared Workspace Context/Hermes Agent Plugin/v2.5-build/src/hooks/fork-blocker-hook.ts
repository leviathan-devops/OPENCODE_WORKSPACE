/**
 * Fork Blocker Hook — Block non-fork tools while a Fork is active
 */

import { getForkManager } from "../services/fork-manager.js";

const FORK_ALLOWED_TOOLS = [
  "fork_create",
  "fork_complete", 
  "fork_feedback",
  "episode_list",
  "episode_output",
  "delegate_task",
];

export function createForkBlockerHook() {
  return async (input: { tool: string }, _output: any) => {
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
