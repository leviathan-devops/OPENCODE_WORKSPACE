/**
 * Output Chain Hook — Pre-process episode output before feeding to next step
 */

import type { EpisodeOutput } from "../services/episode-store.js";

export function createOutputChainerHook() {
  return async (
    input: { previousOutput: EpisodeOutput; nextSkill: string },
    output: { chainedInput: string }
  ) => {
    const prev = input.previousOutput;
    
    let chained = prev.summary;
    
    // Add artifact list if next step needs context
    if (prev.artifacts?.length) {
      chained += `\n\nArtifacts created:\n${prev.artifacts.map(a => `- ${a}`).join("\n")}`;
    }
    
    // Add blockers as warnings
    if (prev.blockers?.length) {
      chained += `\n\nBlockers (${prev.blockers.length}):\n${prev.blockers.map(b => `- ${b.description}`).join("\n")}`;
    }
    
    // Add decisions made
    if (prev.decisions?.length) {
      chained += `\n\nDecisions:\n${prev.decisions.map(d => `- ${d.description}`).join("\n")}`;
    }
    
    output.chainedInput = chained;
  };
}
