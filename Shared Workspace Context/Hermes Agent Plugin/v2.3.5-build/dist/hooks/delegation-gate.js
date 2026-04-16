import { isHermesAgent } from "../config/agent-identity.js";
import { QA_AGENTS } from "../config/constants.js";
import { existsSync, readFileSync } from "fs";
import { resolve, join } from "path";
export function createDelegationGateHook() {
    return async (input, output) => {
        if (!isHermesAgent(input.agent))
            return;
        const { tool, sessionID } = input;
        if (tool === "complete_task" || tool === "update_task_status") {
            const args = output.args;
            const taskId = args?.taskId ?? "";
            const status = args?.status ?? "";
            if (status === "complete" || status === "done") {
                const reviewerApproved = checkReviewerApproval(taskId, sessionID, input.worktree);
                if (!reviewerApproved) {
                    // BLOCK enforcement — not just annotation
                    output.blocked = true;
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
function checkReviewerApproval(taskId, sessionId, worktree) {
    // Method 1: Check SessionDB for reviewerApproved metadata
    if (worktree) {
        const sessionPath = join(worktree, ".hermes", "sessions", `${taskId}.json`);
        if (existsSync(sessionPath)) {
            try {
                const session = JSON.parse(readFileSync(sessionPath, "utf-8"));
                if (session?.metadata?.reviewerApproved === true) {
                    return true;
                }
            }
            catch {
                // Session file exists but is invalid — fall through to file check
            }
        }
    }
    // Method 2: Check for approval file written by @reviewer or @quality-reviewer tools
    const homeDir = process.env.HOME ?? "~";
    const approvalPath = resolve(homeDir, ".hermes", "approvals", `${taskId}.json`);
    if (existsSync(approvalPath)) {
        try {
            const approval = JSON.parse(readFileSync(approvalPath, "utf-8"));
            if (approval?.reviewerApproved === true || approval?.approved === true) {
                return true;
            }
        }
        catch {
            // Approval file exists but is invalid
        }
    }
    return false;
}
