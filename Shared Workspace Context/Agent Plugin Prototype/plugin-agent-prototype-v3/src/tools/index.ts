/**
 * src/tools/index.ts
 * 
 * Tool registry - exports all plugin tools.
 */

import { createHealthCheckTool } from './health-check.js';
import { createMyTool } from './my-tool.js';
import type { PluginConfig } from '../config/schema.js';

export { createHealthCheckTool, createMyTool };

export function createToolRegistry(_config: PluginConfig) {
  return {
    spider_health_check: createHealthCheckTool(),
    spider_agent_task: createMyTool(),
  };
}
