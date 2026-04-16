/**
 * Episode Tools — List and retrieve episode history
 */

import { getEpisodeStore } from "../services/episode-store.js";

export const episode_list = {
  name: "episode_list",
  description: "List active and recent episodes",
  args: {
    skillName: { type: "string", required: false, description: "Filter by skill name" },
    limit: { type: "number", required: false, description: "Max results (default: 10)" },
  },
  execute: async (args: { skillName?: string; limit?: number }, _context: any) => {
    const store = getEpisodeStore();
    const episodes = store.getEpisodeHistory(args.skillName ?? "", args.limit ?? 10);
    return JSON.stringify(episodes.map(e => ({
      id: e.id,
      skillName: e.skillName,
      mode: e.mode,
      status: e.status,
      startedAt: new Date(e.startedAt).toISOString(),
      endedAt: e.endedAt ? new Date(e.endedAt).toISOString() : null,
      outputSummary: e.output?.summary?.substring(0, 100),
    })), null, 2);
  },
};

export const episode_output = {
  name: "episode_output",
  description: "Get the full output from a completed episode",
  args: {
    episodeId: { type: "string", description: "Episode ID to retrieve" },
  },
  execute: async (args: { episodeId: string }, _context: any) => {
    const store = getEpisodeStore();
    const episodes = Array.from(store.getAllEpisodes().values());
    const episode = episodes.find(e => e.id === args.episodeId);
    if (!episode?.output) {
      return { error: "Episode not found or still active" };
    }
    return episode.output;
  },
};
