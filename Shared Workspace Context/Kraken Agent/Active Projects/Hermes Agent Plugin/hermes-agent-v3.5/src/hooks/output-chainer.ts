import type { EpisodeOutput } from "../services/episode-store.js";
import { isHermesAgent } from "../config/agent-identity.js";
import { existsSync } from "fs";
import { join } from "path";

export function createOutputChainerHook() {
  return async (
    input: { previousOutput: EpisodeOutput; nextSkill: string; agent?: string; directory?: string },
    output: { chainedInput: string }
  ) => {
    if (!isHermesAgent(input.agent ?? "")) {
      return;
    }

    const baseDir = input.directory ?? process.cwd();
    if (!existsSync(join(baseDir, ".hermes"))) {
      return;
    }

    const prev = input.previousOutput;

    let chained = prev.summary;

    if (prev.artifacts?.length) {
      chained += `\n\nArtifacts created:\n${prev.artifacts.map((a) => `- ${a}`).join("\n")}`;
    }

    if (prev.blockers?.length) {
      chained += `\n\nBlockers (${prev.blockers.length}):\n${prev.blockers.map((b) => `- ${b.description}`).join("\n")}`;
    }

    if (prev.decisions?.length) {
      chained += `\n\nDecisions:\n${prev.decisions.map((d) => `- ${d.description}`).join("\n")}`;
    }

    output.chainedInput = chained;
  };
}
