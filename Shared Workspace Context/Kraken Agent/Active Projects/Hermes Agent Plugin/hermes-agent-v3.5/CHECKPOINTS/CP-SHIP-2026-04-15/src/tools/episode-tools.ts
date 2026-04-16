import { getEpisodeStore, type EpisodeOutput } from "../services/episode-store.js";

export const episodeList = {
  name: "episode_list",
  description: "List episodes for a skill",
  args: {
    skillName: { type: "string", description: "Skill name to list episodes for" },
    limit: { type: "number", description: "Maximum number of episodes to return", required: false },
  },
  execute: async (
    args: { skillName: string; limit?: number },
    _context: any
  ) => {
    const store = getEpisodeStore();
    const episodes = store.getEpisodeHistory(args.skillName, args.limit ?? 10);
    return {
      skillName: args.skillName,
      count: episodes.length,
      episodes: episodes.map((e) => ({
        id: e.id,
        status: e.status,
        mode: e.mode,
        startedAt: new Date(e.startedAt).toISOString(),
        endedAt: e.endedAt ? new Date(e.endedAt).toISOString() : null,
        chainPosition: e.chainPosition,
      })),
    };
  },
};

export const episodeOutput = {
  name: "episode_output",
  description: "Get the output of a specific episode",
  args: {
    episodeId: { type: "string", description: "Episode ID to get output for" },
  },
  execute: async (args: { episodeId: string }, _context: any) => {
    const store = getEpisodeStore();
    const episode = store.getEpisode(args.episodeId);
    if (!episode) {
      return { error: `Episode not found: ${args.episodeId}` };
    }
    if (!episode.output) {
      return { error: `Episode not yet complete: ${args.episodeId}` };
    }
    return {
      episodeId: episode.id,
      skillName: episode.skillName,
      status: episode.status,
      output: episode.output,
    };
  },
};

export const episodeSummary = {
  name: "episode_summary",
  description: "Get a compressed summary of recent episodes",
  args: {
    skillName: { type: "string", description: "Skill name to summarize" },
  },
  execute: async (args: { skillName: string }, _context: any) => {
    const store = getEpisodeStore();
    const episodes = store.getEpisodeHistory(args.skillName, 5);
    const summaries = episodes.map((e) => {
      if (e.output) {
        return `[${e.status}] ${e.output.summary.substring(0, 100)}`;
      }
      return `[${e.status}] No output yet`;
    });
    return {
      skillName: args.skillName,
      recentCount: episodes.length,
      summaries,
    };
  },
};
