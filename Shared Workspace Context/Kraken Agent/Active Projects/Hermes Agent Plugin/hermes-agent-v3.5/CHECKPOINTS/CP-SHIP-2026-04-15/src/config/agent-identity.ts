/**
 * src/config/agent-identity.ts
 *
 * Agent identity system for Hermes Agent Plugin.
 * Distinguishes Hermes agents from vanilla OpenCode agents to prevent context spillover.
 *
 * Pattern matches Spider Agent's isSpiderSubAgent() approach.
 */

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

/**
 * Check if an agent name belongs to the Hermes plugin.
 * Returns false for vanilla OpenCode agents (plan, build, general, explore).
 */
export function isHermesAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  return HERMES_AGENTS.has(agentName);
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
