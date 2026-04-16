import type { Hooks } from "@opencode-ai/plugin";

interface ActivityEntry {
  tool: string;
  agent: string;
  timestamp: number;
  success: boolean;
}

const recentActivity: ActivityEntry[] = [];
const ACTIVITY_WINDOW_MS = 5 * 60 * 1000;
const MAX_ACTIVITY_ENTRIES = 1000;

export function createActivityHook(): NonNullable<Hooks["tool.execute.after"]> {
  return async (input, output) => {
    const { tool, sessionID } = input;
    const { output: toolOutput } = output;

    const entry: ActivityEntry = {
      tool,
      agent: sessionID,
      timestamp: Date.now(),
      success: !toolOutput.includes("error") && !toolOutput.includes("fail"),
    };

    recentActivity.push(entry);

    while (recentActivity.length > MAX_ACTIVITY_ENTRIES) {
      recentActivity.shift();
    }
  };
}

export function getRecentActivity(agent?: string): ActivityEntry[] {
  const cutoff = Date.now() - ACTIVITY_WINDOW_MS;
  return recentActivity.filter(
    (e) => e.timestamp > cutoff && (!agent || e.agent === agent)
  );
}
