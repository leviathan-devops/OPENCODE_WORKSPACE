/**
 * src/agents/index.ts
 * 
 * Agent registry and factory - Spider Agent reference.
 */

import { createArchitectAgent } from './architect.js';
import { createCoderAgent } from './coder.js';
import { createReviewerAgent } from './reviewer.js';
import { createTestEngineerAgent } from './test-engineer.js';
import type { PluginConfig } from '../config/schema.js';

export interface AgentDefinition {
  name: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  tools: string[];
  readOnly?: boolean;
}

export function createAgentRegistry(config: PluginConfig): Record<string, AgentDefinition> {
  const agentConfig = config.agents ?? {};
  
  return {
    architect: createArchitectAgent(agentConfig.architect ?? { model: 'claude-sonnet-4-20250514', temperature: 0.7 }),
    coder: createCoderAgent(agentConfig.coder ?? { model: 'claude-sonnet-4-20250514', temperature: 0.3 }),
    reviewer: createReviewerAgent(agentConfig.reviewer ?? { model: 'claude-sonnet-4-20250514', temperature: 0.2 }),
    test_engineer: createTestEngineerAgent({ model: 'claude-sonnet-4-20250514', temperature: 0.3 }),
  };
}

export type AgentType = 'architect' | 'coder' | 'reviewer' | 'test_engineer' | 'sme';

export const AGENT_PERMISSIONS: Record<AgentType, { read: boolean; write: boolean; execute: boolean }> = {
  architect: { read: true, write: true, execute: true },
  coder: { read: true, write: true, execute: true },
  reviewer: { read: true, write: false, execute: false },
  test_engineer: { read: true, write: true, execute: false },
  sme: { read: true, write: false, execute: false },
};
