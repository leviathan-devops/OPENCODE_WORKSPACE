import { getEpisodeStore } from "../services/episode-store.js";
import { isHermesAgent } from "../config/agent-identity.js";
import { existsSync } from "fs";
import { join } from "path";

export function createEpisodeTrackerHook() {
  return async (
    input: {
      action: "start" | "complete" | "timeout" | "error";
      skillName: string;
      agent?: string;
      directory?: string;
    },
    output: { episodeId?: string; status: string }
  ) => {
    if (!isHermesAgent(input.agent ?? "")) {
      return;
    }

    const baseDir = input.directory ?? process.cwd();
    if (!existsSync(join(baseDir, ".hermes"))) {
      return;
    }

    const store = getEpisodeStore();

    switch (input.action) {
      case "start": {
        const episode = store.startEpisode(
          input.skillName,
          { trigger: "", context: {} },
          "thread"
        );
        output.episodeId = episode.id;
        output.status = "started";
        break;
      }
      case "complete": {
        output.status = "completed";
        break;
      }
      case "timeout": {
        output.status = "timeout";
        break;
      }
      case "error": {
        output.status = "error";
        break;
      }
    }
  };
}
