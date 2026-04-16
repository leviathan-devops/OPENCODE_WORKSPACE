import { QA_AGENTS } from "../config/constants.js";
import { existsSync } from "fs";
import { resolve } from "path";
export function createDelegationGateHook() {
    return async (input, output) => {
        const { tool, sessionID } = input;
        if (tool === "complete_task" || tool === "update_task_status") {
            const args = output.args;
            const taskId = args?.taskId ?? "";
            const status = args?.status ?? "";
            if (status === "complete" || status === "done") {
                const reviewerApproved = checkReviewerApproval(taskId, sessionID);
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
function checkReviewerApproval(taskId, sessionId) {
    // Check for approval file written by @reviewer or @quality-reviewer tools
    // Approval files live in ~/.hermes/approvals/
    const homeDir = process.env.HOME ?? "~";
    const approvalPath = resolve(homeDir, ".hermes", "approvals", `${taskId}.json`);
    return existsSync(approvalPath);
}
