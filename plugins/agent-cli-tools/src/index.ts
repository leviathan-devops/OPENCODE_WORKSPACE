/**
 * src/index.ts
 *
 * Agent CLI Tools - OpenCode Plugin Entry Point
 *
 * Exposes Gemini CLI and Qwen Code as native OpenCode tools.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { createToolRegistry } from './tools/index.js';
import { logger } from './utils/logger.js';

const PLUGIN_NAME = 'AgentCLITools';
const PLUGIN_VERSION = '1.0.0';

export default async function AgentCLITools(): Promise<Hooks> {
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
