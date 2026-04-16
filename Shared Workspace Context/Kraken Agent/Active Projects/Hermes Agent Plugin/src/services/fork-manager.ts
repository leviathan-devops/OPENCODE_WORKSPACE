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
  context: Record<string, unknown>;
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

let forkManager: ForkManager | null = null;

export function getForkManager(): ForkManager {
  if (!forkManager) {
    forkManager = new ForkManager();
  }
  return forkManager;
}

export class ForkManager {
  private activeFork: ForkContext | null = null;
  private forkHistory: ForkContext[] = [];
  private maxHistory = 5;

  startFork(skillName: string, input: EpisodeInput, timeoutMs = 300000): ForkContext {
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

  sendFeedback(forkId: string, feedback: string): void {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} is not active`);
    }
    this.activeFork.accumulatedOutput += `\nUser: ${feedback}`;
    this.activeFork.lastActivityAt = Date.now();
  }

  completeFork(forkId: string, output: EpisodeOutput): EpisodeOutput {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} is not active`);
    }

    this.activeFork.state = "completed";
    this.activeFork.partialOutput = output;

    const compressedSummary = this.compressOutput();
    const result: EpisodeOutput = {
      summary: compressedSummary || output.summary,
      artifacts: output.artifacts,
      decisions: output.decisions,
      blockers: output.blockers,
    };

    this.forkHistory.push({ ...this.activeFork });
    if (this.forkHistory.length > this.maxHistory) {
      this.forkHistory.shift();
    }

    this.activeFork = null;
    return result;
  }

  timeoutFork(forkId: string): EpisodeOutput {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} is not active`);
    }

    const partial: EpisodeOutput = {
      summary: `Fork timed out after ${this.activeFork.timeoutMs}ms`,
      artifacts: [],
      decisions: [],
      blockers: [
        {
          reason: "timeout",
          description: `Fork '${this.activeFork.skillName}' timed out after ${this.activeFork.timeoutMs}ms`,
        },
      ],
    };

    return this.completeFork(forkId, partial);
  }

  autoCompleteStaleFork(reason: string): void {
    if (!this.activeFork) return;

    const partial: EpisodeOutput = {
      summary: `Auto-completed: ${reason}`,
      artifacts: [],
      decisions: [],
      blockers: [
        {
          reason: "auto_complete",
          description: `Fork '${this.activeFork.skillName}' auto-completed due to: ${reason}`,
        },
      ],
    };

    this.activeFork.state = "completed";
    this.completeFork(this.activeFork.id, partial);
  }

  isActive(): boolean {
    return this.activeFork !== null;
  }

  getActiveFork(): ForkContext | null {
    return this.activeFork;
  }

  getForkHistory(): ForkContext[] {
    return this.forkHistory;
  }

  private compressOutput(): string {
    if (!this.activeFork) return "";
    const transcript = this.activeFork.accumulatedOutput;
    return transcript.length > 2000
      ? transcript.substring(0, 2000) + "... [truncated]"
      : transcript;
  }

  reset(): void {
    this.activeFork = null;
    this.forkHistory = [];
  }
}
