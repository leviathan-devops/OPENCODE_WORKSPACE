/**
 * src/config/agent-identity.ts
 *
 * Agent identity system for Hermes Agent Plugin.
 * Distinguishes Hermes agents from vanilla OpenCode agents to prevent context spillover.
 *
 * Pattern matches Spider Agent's isSpiderSubAgent() approach.
 */

import { getCurrentAgent } from "../hooks/agent-state.js";

const HERMES_AGENTS = new Set([
  'hermes',
  'analyst',
  'builder',
  'planner',
  'tdd',
  'reviewer',
  'quality-reviewer',
  'grill',
  'ripple',
  'drift-verifier',
  'explorer',
  'architect',
  'debugger',
  'supervisor',
  'sme',
  'test-engineer',
  'docs',
  'critic',
  'memory',
]);

const VANILLA_AGENTS = new Set([
  'plan',
  'build',
  'general',
  'explore',
]);

const HERMES_PREFIX = 'hermes_';

/**
 * Get active agent name with CLI fallback
 * Use this in hooks instead of input.agent directly
 */
export function getActiveAgent(inputAgent: string | undefined): string | undefined {
  return inputAgent || getCurrentAgent();
}

/**
 * Check if an agent name belongs to the Hermes plugin.
 * Supports both exact names and hermes_ prefix.
 * Also checks CLI fallback via getCurrentAgent().
 */
export function isHermesAgent(agentName: string | undefined): boolean {
  if (!agentName) {
    const current = getCurrentAgent();
    if (current && HERMES_AGENTS.has(current)) return true;
    if (current?.startsWith(HERMES_PREFIX)) return true;
    return false;
  }
  if (HERMES_AGENTS.has(agentName)) return true;
  if (agentName.startsWith(HERMES_PREFIX)) return true;
  return false;
}

/**
 * Check if an agent name is a vanilla OpenCode agent.
 */
export function isVanillaAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  return VANILLA_AGENTS.has(agentName);
}

/**
 * Get the list of all Hermes agent names.
 */
export function getHermesAgents(): string[] {
  return Array.from(HERMES_AGENTS);
}