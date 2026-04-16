import { tool } from "./create-tool.js";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { getCurrentPhase } from "../hooks/brainstorm-gate.js";
export const checkpoint = tool({
    description: "Create a session checkpoint with git stash + state savepoint",
    args: {
        message: tool.schema.string().describe("Checkpoint description"),
    },
    execute: async (args, context) => {
        const stateDir = resolve(context.worktree, ".hermes", "state");
        if (!existsSync(stateDir)) {
            mkdirSync(stateDir, { recursive: true });
        }
        const checkpointId = `cp_${Date.now()}`;
        const checkpointPath = join(stateDir, `${checkpointId}.json`);
        const state = {
            id: checkpointId,
            message: args.message,
            phase: getCurrentPhase(),
            directory: context.directory,
            worktree: context.worktree,
            timestamp: new Date().toISOString(),
        };
        writeFileSync(checkpointPath, JSON.stringify(state, null, 2));
        return `Checkpoint created: ${checkpointId}
Phase: ${state.phase}
Saved to: ${checkpointPath}`;
    },
});
