import { createGeminiTool } from './gemini.js';
import { createQwenTool } from './qwen.js';

export { createGeminiTool, createQwenTool };

export function createToolRegistry() {
  return {
    gemini: createGeminiTool(),
    qwen: createQwenTool(),
  };
}
