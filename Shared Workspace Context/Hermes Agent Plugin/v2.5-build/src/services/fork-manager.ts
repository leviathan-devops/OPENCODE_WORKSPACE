/**
 * ForkManager — Synchronous, blocking subagent execution
 * 
 * A Fork blocks the orchestrator and takes over the UI.
 * Only one Fork can be active at a time.
 * If a new Fork is requested while one is active, the old is auto-completed.
 */

import { generateId } from "../utils/id.js";

export type ForkState = "idle" | "active" | "waiting_input" | "completing" | "completed";

export interface ForkContext {
  id: string;
  skillName: string;
  state: ForkState;
  startedAt: number;
  lastActivityAt: number;
  input: EpisodeInput;
  accumulatedOutput: string;
  partialOutput: EpisodeOutput | null;
  timeoutMs: number;
}

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

export interface Blocker {
  reason: string;
  description: string;
}

class ForkManager {
  private activeFork: ForkContext | null = null;
  private forkHistory: ForkContext[] = [];
  private maxHistory = 5;
  
  /**
   * Start a new Fork — blocks orchestrator until complete
   */
  startFork(skillName: string, input: EpisodeInput, timeoutMs = 300000): ForkContext {
    // Auto-complete stale Fork if one is already active
    if (this.activeFork) {
      this.autoCompleteStaleFork("New Fork requested");
    }
    
    const context: ForkContext = {
      id: generateId(),
      skillName,
      state: "active",
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
      input,
      accumulatedOutput: "",
      partialOutput: null,
      timeoutMs,
    };
    
    this.activeFork = context;
    return context;
  }
  
  /**
   * Send user input to the active Fork
   */
  sendFeedback(forkId: string, feedback: string): void {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} is not active`);
    }
    this.activeFork.accumulatedOutput += `\nUser: ${feedback}`;
    this.activeFork.lastActivityAt = Date.now();
  }
  
  /**
   * Complete a Fork and return its compressed output
   */
  completeFork(forkId: string, output: EpisodeOutput): EpisodeOutput {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} is not active`);
    }
    
    this.activeFork.state = "completed";
    this.activeFork.partialOutput = output;
    
    // Compress accumulated output
    const compressedSummary = this.compressOutput();
    const result: EpisodeOutput = {
      summary: compressedSummary || output.summary,
      artifacts: output.artifacts ?? [],
      decisions: output.decisions ?? [],
      blockers: output.blockers ?? [],
    };
    
    // Move to history
    this.forkHistory.push({ ...this.activeFork });
    if (this.forkHistory.length > this.maxHistory) {
      this.forkHistory.shift();
    }
    
    this.activeFork = null;
    return result;
  }
  
  /**
   * Timeout a stuck Fork
   */
  timeoutFork(forkId: string): EpisodeOutput {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} is not active`);
    }
    
    const partial: EpisodeOutput = {
      summary: `Fork timed out after ${this.activeFork.timeoutMs}ms`,
      artifacts: [],
      decisions: [],
      blockers: [{
        reason: "timeout",
        description: `Fork '${this.activeFork.skillName}' timed out after ${this.activeFork.timeoutMs}ms`,
      }],
    };
    
    return this.completeFork(forkId, partial);
  }
  
  /**
   * Auto-complete a stale Fork (when new Fork is requested)
   */
  autoCompleteStaleFork(reason: string): void {
    if (!this.activeFork) return;
    
    const partial: EpisodeOutput = {
      summary: `Auto-completed: ${reason}`,
      artifacts: [],
      decisions: [],
      blockers: [{
        reason: "auto_complete",
        description: `Fork '${this.activeFork.skillName}' auto-completed due to: ${reason}`,
      }],
    };
    
    this.completeFork(this.activeFork.id, partial);
  }
  
  /**
   * Check if a Fork is currently active
   */
  isActive(): boolean {
    return this.activeFork !== null;
  }
  
  /**
   * Get the currently active Fork context
   */
  getActiveFork(): ForkContext | null {
    return this.activeFork;
  }
  
  /**
   * Get Fork execution history
   */
  getForkHistory(): ForkContext[] {
    return [...this.forkHistory];
  }
  
  /**
   * Compress accumulated chat output to ~2KB
   */
  private compressOutput(): string {
    if (!this.activeFork) return "";
    const transcript = this.activeFork.accumulatedOutput;
    if (transcript.length > 2000) {
      return transcript.substring(0, 2000) + "... [truncated]";
    }
    return transcript;
  }
}

// Singleton instance
let forkManagerInstance: ForkManager | null = null;

export function getForkManager(): ForkManager {
  if (!forkManagerInstance) {
    forkManagerInstance = new ForkManager();
  }
  return forkManagerInstance;
}


