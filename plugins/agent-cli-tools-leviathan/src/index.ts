import type { Hooks } from '@opencode-ai/plugin';
import { createToolRegistry } from './tools/index.js';
import { logger } from './utils/logger.js';

const PLUGIN_NAME = 'AgentCliTools-Leviathan';
const PLUGIN_VERSION = '0.1.0';

export default async function AgentCliTools(): Promise<Hooks> {
  logger.info(`${PLUGIN_NAME} v${PLUGIN_VERSION} initializing`);

  const tools = createToolRegistry();

  logger.info(`${PLUGIN_NAME} initialized`, {
    toolCount: Object.keys(tools).length,
    tools: Object.keys(tools),
  });

  return {
    tool: tools,
  };
}
