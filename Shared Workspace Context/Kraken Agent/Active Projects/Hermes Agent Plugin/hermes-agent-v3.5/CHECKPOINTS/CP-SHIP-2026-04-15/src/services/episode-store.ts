import { generateId } from "../utils/id.js";

export type ExecutionMode = "thread" | "fork" | "teammate";

export interface EpisodeInput {
  trigger: string;
  context: Record<string, unknown>;
}

export interface EpisodeOutput {
  summary: string;
  artifacts: string[];
  decisions: { description: string }[];
  blockers: { reason: string; description: string }[];
}

export interface Episode {
  id: string;
  skillName: string;
  mode: ExecutionMode;
  parentChainId: string | null;
  status: "active" | "completed" | "timeout" | "error";
  startedAt: number;
  endedAt: number | null;
  input: EpisodeInput;
  output: EpisodeOutput | null;
  contextSnapshot: string;
  chainPosition: number | null;
}

let episodeStore: EpisodeStore | null = null;

export function getEpisodeStore(): EpisodeStore {
  if (!episodeStore) {
    episodeStore = new EpisodeStore();
  }
  return episodeStore;
}

export class EpisodeStore {
  private episodes: Map<string, Episode> = new Map();
  private activeBySkill: Map<string, string> = new Map();
  private maxHistory = 10;

  startEpisode(
    skillName: string,
    input: EpisodeInput,
    mode: ExecutionMode,
    chainId?: string
  ): Episode {
    const existingId = this.activeBySkill.get(skillName);
    if (existingId) {
      this.timeoutEpisode(existingId, {
        summary: "Replaced by new episode",
        artifacts: [],
        decisions: [],
        blockers: [
          { reason: "replaced", description: "Previous episode replaced" },
        ],
      });
    }

    const episode: Episode = {
      id: generateId(),
      skillName,
      mode,
      parentChainId: chainId ?? null,
      status: "active",
      startedAt: Date.now(),
      endedAt: null,
      input,
      output: null,
      contextSnapshot: "",
      chainPosition: null,
    };

    this.episodes.set(episode.id, episode);
    this.activeBySkill.set(skillName, episode.id);

    return episode;
  }

  completeEpisode(episodeId: string, output: EpisodeOutput): Episode {
    const episode = this.episodes.get(episodeId);
    if (!episode) throw new Error(`Episode ${episodeId} not found`);

    episode.status = "completed";
    episode.endedAt = Date.now();
    episode.output = output;
    episode.contextSnapshot = this.compressContext(output);

    this.activeBySkill.delete(episode.skillName);
    this.pruneOldEpisodes();

    return episode;
  }

  timeoutEpisode(episodeId: string, partialOutput: EpisodeOutput): Episode {
    const episode = this.episodes.get(episodeId);
    if (!episode) throw new Error(`Episode ${episodeId} not found`);

    episode.status = "timeout";
    episode.endedAt = Date.now();
    episode.output = partialOutput;
    episode.contextSnapshot = this.compressContext(partialOutput);

    this.activeBySkill.delete(episode.skillName);
    this.pruneOldEpisodes();

    return episode;
  }

  errorEpisode(episodeId: string, error: string): Episode {
    const episode = this.episodes.get(episodeId);
    if (!episode) throw new Error(`Episode ${episodeId} not found`);

    episode.status = "error";
    episode.endedAt = Date.now();
    episode.output = {
      summary: `Error: ${error}`,
      artifacts: [],
      decisions: [],
      blockers: [
        { reason: "error", description: error },
      ],
    };

    this.activeBySkill.delete(episode.skillName);
    this.pruneOldEpisodes();

    return episode;
  }

  getActiveEpisode(skillName: string): Episode | null {
    const episodeId = this.activeBySkill.get(skillName);
    if (!episodeId) return null;
    return this.episodes.get(episodeId) ?? null;
  }

  getEpisode(episodeId: string): Episode | null {
    return this.episodes.get(episodeId) ?? null;
  }

  getEpisodeHistory(skillName: string, limit = 10): Episode[] {
    const episodes = Array.from(this.episodes.values())
      .filter((e) => e.skillName === skillName)
      .sort((a, b) => b.startedAt - a.startedAt);
    return episodes.slice(0, limit);
  }

  getChainEpisodes(chainId: string): Episode[] {
    return Array.from(this.episodes.values())
      .filter((e) => e.parentChainId === chainId)
      .sort((a, b) => (a.chainPosition ?? 0) - (b.chainPosition ?? 0));
  }

  private compressContext(output: EpisodeOutput): string {
    const parts: string[] = [output.summary];
    if (output.artifacts.length) {
      parts.push(`Artifacts: ${output.artifacts.length}`);
    }
    if (output.blockers.length) {
      parts.push(`Blockers: ${output.blockers.length}`);
    }
    return parts.join(" | ");
  }

  private pruneOldEpisodes(): void {
    if (this.episodes.size <= this.maxHistory) return;

    const sorted = Array.from(this.episodes.values()).sort(
      (a, b) => b.startedAt - a.startedAt
    );

    const toDelete = sorted.slice(this.maxHistory);
    for (const episode of toDelete) {
      this.episodes.delete(episode.id);
    }
  }

  reset(): void {
    this.episodes.clear();
    this.activeBySkill.clear();
  }
}
