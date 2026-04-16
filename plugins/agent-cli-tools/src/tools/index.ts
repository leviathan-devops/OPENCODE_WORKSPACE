/**
 * src/tools/index.ts
 *
 * Tool registry - exports all CLI tools.
 */

import { createGeminiTool } from './gemini.js';
import { createQwenTool } from './qwen.js';

export { createGeminiTool, createQwenTool };

export function createToolRegistry() {
  return {
    gemini: createGeminiTool(),
    qwen: createQwenTool(),
  };
}
