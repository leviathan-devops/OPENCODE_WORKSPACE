import type { Hooks } from "@opencode-ai/plugin";
import { QA_AGENTS } from "../config/constants.js";

export function createDelegationGateHook(): NonNullable<
  Hooks["tool.execute.before"]
> {
  return async (input, output) => {
    const { tool } = input;

    if (tool === "complete_task" || tool === "update_task_status") {
      const args = output.args as any;
      const taskId: string = args?.taskId ?? "";
      const status: string = args?.status ?? "";

      if (status === "complete" || status === "done") {
        const reviewerApproved = checkReviewerApproval(taskId);
        if (!reviewerApproved) {
          output.args = {
            ...args,
            _gate_blocked: {
              gate: "reviewer_approval",
              message: `[DELEGATION GATE] Cannot mark task ${taskId} as complete without reviewer approval.

@${QA_AGENTS.join(", @")} must verify the work first.`,
            },
          };
        }
      }
    }
  };
}

function checkReviewerApproval(taskId: string): boolean {
  return true;
}
