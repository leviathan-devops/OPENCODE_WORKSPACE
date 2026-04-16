/**
 * Fork Tools — Create, complete, and send feedback to Forks
 */

import { getForkManager, type EpisodeOutput } from "../services/fork-manager.js";

export const fork_create = {
  name: "fork_create",
  description: "Create a new Fork session (blocking subagent)",
  args: {
    skill: { type: "string", description: "Skill name to invoke as Fork" },
    input: { type: "string", description: "Input to pass to the skill" },
    timeout: { type: "number", description: "Timeout in ms (default: 300000)", required: false },
  },
  execute: async (args: { skill: string; input: string; timeout?: number }, _context: any) => {
    const fm = getForkManager();
    const fork = fm.startFork(args.skill, { trigger: args.input, context: {} }, args.timeout);
    return { forkId: fork.id, status: "active", skill: args.skill };
  },
};

export const fork_complete = {
  name: "fork_complete",
  description: "Complete an active Fork and return its output",
  args: {
    forkId: { type: "string", description: "The Fork ID to complete" },
    summary: { type: "string", description: "Summary of what the Fork accomplished" },
    artifacts: { type: "array", items: { type: "string" }, required: false },
    decisions: { type: "array", items: { type: "string" }, required: false },
    blockers: { type: "array", items: { type: "string" }, required: false },
  },
  execute: async (args: {
    forkId: string;
    summary: string;
    artifacts?: string[];
    decisions?: string[];
    blockers?: string[];
  }, _context: any) => {
    const fm = getForkManager();
    const output: EpisodeOutput = {
      summary: args.summary,
      artifacts: args.artifacts ?? [],
      decisions: (args.decisions ?? []).map(d => ({ description: d })),
      blockers: (args.blockers ?? []).map(b => ({ reason: "manual", description: b })),
    };
    return fm.completeFork(args.forkId, output);
  },
};

export const fork_feedback = {
  name: "fork_feedback",
  description: "Send user input to an active Fork",
  args: {
    forkId: { type: "string", description: "The Fork ID to send feedback to" },
    message: { type: "string", description: "User message to route to Fork" },
  },
  execute: async (args: { forkId: string; message: string }, _context: any) => {
    const fm = getForkManager();
    fm.sendFeedback(args.forkId, args.message);
    return { status: "feedback_sent", forkId: args.forkId };
  },
};
