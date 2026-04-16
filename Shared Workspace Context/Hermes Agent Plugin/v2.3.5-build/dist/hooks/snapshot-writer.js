import { isHermesAgent } from "../config/agent-identity.js";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
const SNAPSHOT_DIR = resolve(process.env.HOME ?? "~", ".hermes", "snapshots");
export function createSnapshotWriterHook() {
    return async (input, output) => {
        if (!isHermesAgent(input.agent))
            return;
        const { tool } = input;
        if (tool === "checkpoint" || tool === "phase_complete") {
            if (!existsSync(SNAPSHOT_DIR)) {
                mkdirSync(SNAPSHOT_DIR, { recursive: true });
            }
            const snapshot = {
                id: `snap_${Date.now()}`,
                phase: getPhaseFromOutput(typeof output === 'string' ? output : output.output ?? ''),
                timestamp: new Date().toISOString(),
                summary: typeof output === 'string' ? output.substring(0, 500) : output.output?.substring(0, 500) ?? '',
            };
            const snapshotPath = resolve(SNAPSHOT_DIR, `${snapshot.id}.json`);
            writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
        }
    };
}
function getPhaseFromOutput(output) {
    const match = output.match(/phase[:\s]+(\w+)/i);
    return match ? match[1] : "unknown";
}
