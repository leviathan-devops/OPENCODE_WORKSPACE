/**
 * EpisodeStore — Tracks skill execution boundaries and stores episode history
 */

import { generateId } from "../utils/id.js";

export type ExecutionMode = "thread" | "fork" | "teammate";

export interface EpisodeInput {
  trigger: string;
  context: Record<string, any>;
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

class EpisodeStore {
  private episodes: Map<string, Episode> = new Map();
  private activeBySkill: Map<string, string> = new Map(); // skillName -> episodeId
  private maxHistory = 10;
  
  /**
   * Start a new episode for a skill activation
   */
  startEpisode(
    skillName: string,
    input: EpisodeInput,
    mode: ExecutionMode,
    chainId?: string
  ): Episode {
    // End any existing active episode for this skill
    const existingId = this.activeBySkill.get(skillName);
    if (existingId) {
      this.timeoutEpisode(existingId, {
        summary: "Replaced by new episode",
        artifacts: [],
        decisions: [],
        blockers: [{ reason: "replaced", description: "Previous episode replaced" }],
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
  
  /**
   * Mark an episode as completed
   */
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
  
  /**
   * Mark an episode as timed out
   */
  timeoutEpisode(episodeId: string, partialOutput: EpisodeOutput): Episode {
    const episode = this.episodes.get(episodeId);
    if (!episode) throw new Error(`Episode ${episodeId} not found`);
    
    episode.status = "timeout";
    episode.endedAt = Date.now();
    episode.output = partialOutput;
    
    this.activeBySkill.delete(episode.skillName);
    
    return episode;
  }
  
  /**
   * Mark an episode as errored
   */
  errorEpisode(episodeId: string, errorOutput: EpisodeOutput): Episode {
    const episode = this.episodes.get(episodeId);
    if (!episode) throw new Error(`Episode ${episodeId} not found`);
    
    episode.status = "error";
    episode.endedAt = Date.now();
    episode.output = errorOutput;
    
    this.activeBySkill.delete(episode.skillName);
    
    return episode;
  }
  
  /**
   * Get the currently active episode for a skill
   */
  getActiveEpisode(skillName: string): Episode | null {
    const id = this.activeBySkill.get(skillName);
    return id ? (this.episodes.get(id) ?? null) : null;
  }
  
  /**
   * Get episode history for a skill
   */
  getEpisodeHistory(skillName: string, limit = 10): Episode[] {
    return Array.from(this.episodes.values())
      .filter(e => e.skillName === skillName)
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit);
  }
  
  /**
   * Get all outputs for an orchestration chain
   */
  getChainOutputs(chainId: string): EpisodeOutput[] {
    return Array.from(this.episodes.values())
      .filter(e => e.parentChainId === chainId && e.output !== null)
      .sort((a, b) => (a.chainPosition ?? 0) - (b.chainPosition ?? 0))
      .map(e => e.output!);
  }
  
  /**
   * Compress context to ~1KB summary
   */
  private compressContext(output: EpisodeOutput): string {
    const summary = output.summary;
    const decisions = output.decisions.map(d => d.description).join("; ");
    return `Summary: ${summary.substring(0, 500)}. Decisions: ${decisions.substring(0, 500)}`;
  }
  
  /**
   * Prune old episodes beyond maxHistory per skill
   */
  private pruneOldEpisodes(): void {
    const bySkill = new Map<string, Episode[]>();
    
    for (const ep of this.episodes.values()) {
      const list = bySkill.get(ep.skillName) ?? [];
      list.push(ep);
      bySkill.set(ep.skillName, list);
    }
    
    for (const [, eps] of bySkill) {
      if (eps.length > this.maxHistory) {
        const sorted = eps.sort((a, b) => b.startedAt - a.startedAt);
        for (const old of sorted.slice(this.maxHistory)) {
          this.episodes.delete(old.id);
        }
      }
    }
  }
  
  // For testing
  getAllEpisodes(): Map<string, Episode> {
    return new Map(this.episodes);
  }
}

// Singleton instance
let episodeStoreInstance: EpisodeStore | null = null;

export function getEpisodeStore(): EpisodeStore {
  if (!episodeStoreInstance) {
    episodeStoreInstance = new EpisodeStore();
  }
  return episodeStoreInstance;
}


