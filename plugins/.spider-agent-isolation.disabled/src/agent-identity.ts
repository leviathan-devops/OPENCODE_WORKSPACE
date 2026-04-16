/**
 * Agent Identity — spider isolation wrapper
 */

const SPIDER_AGENTS = new Set(['spider', 'architect', 'coder', 'reviewer', 'test-engineer', 'sme', 'designer', 'explorer']);
const SPIDER_PREFIX = 'spider_';
const VANILLA_AGENTS = new Set(['plan', 'build', 'general', 'explore']);

export function isSpiderAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  if (SPIDER_AGENTS.has(agentName)) return true;
  if (agentName.startsWith(SPIDER_PREFIX)) return true;
  return false;
}

export function isVanillaAgent(agentName: string | undefined): boolean {
  return VANILLA_AGENTS.has(agentName ?? '');
}