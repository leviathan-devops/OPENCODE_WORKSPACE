import { isHermesAgent } from "../config/agent-identity.js";
import { PHASES } from "../config/constants.js";
import { getCurrentPhase } from "./brainstorm-gate.js";
let consecutiveErrors = 0;
let lastErrorTime = 0;
const ERROR_WINDOW_MS = 5 * 60 * 1000;
const ERROR_THRESHOLD = 5;
export function createCompactionHook() {
    return async (input, output) => {
        if (!isHermesAgent(input.agent))
            return;
        const now = Date.now();
        if (now - lastErrorTime > ERROR_WINDOW_MS) {
            consecutiveErrors = 0;
        }
        const currentPhase = getCurrentPhase();
        output.context = output.context || [];
        if (currentPhase !== PHASES.IDLE) {
            output.context.push(`[COMPACTION] Current phase: ${currentPhase}. Session is not idle.`);
        }
        if (consecutiveErrors >= ERROR_THRESHOLD) {
            output.context.push(`[COMPACTION WARNING] ${consecutiveErrors} errors in recent history. Consider checkpointing.`);
        }
    };
}
export function recordError() {
    consecutiveErrors++;
    lastErrorTime = Date.now();
}
