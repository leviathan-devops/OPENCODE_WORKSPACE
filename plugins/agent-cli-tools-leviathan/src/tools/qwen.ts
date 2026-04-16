import { tool as toolFn } from '@opencode-ai/plugin';
import { z } from 'zod';
import { invokeCli, buildQwenArgs } from '../utils/cli.js';
import { extractQwenResponse } from '../utils/parse.js';
import { logger } from '../utils/logger.js';

const DAILY_LIMIT = 1000;

export function createQwenTool() {
  return toolFn({
    description: 'Invoke Qwen Code CLI for coding tasks. Provides autonomous mode (--yolo), optimized code models, and structured JSON output. Free tier: 1000 req/day.',
    args: {
      prompt: z.string(),
      yolo: z.boolean().default(false),
      model: z.string().default('qwen3-coder'),
      outputFormat: z.enum(['json', 'text']).default('json'),
      timeout: z.number().default(120),
    },
    execute: async (args) => {
      logger.debug('Qwen tool invoked', { prompt: args.prompt.substring(0, 50) });

      const cmdArgs = buildQwenArgs({
        prompt: args.prompt,
        yolo: args.yolo,
        model: args.model,
        outputFormat: args.outputFormat,
      });

      logger.debug('Invoking qwen CLI', { args: cmdArgs });

      try {
        const result = await invokeCli('qwen', cmdArgs, { timeout: args.timeout });

        if (result.timedOut) {
          logger.warn('Qwen timed out', { timeout: args.timeout });
          return JSON.stringify({
            success: false,
            error: { code: 'TIMEOUT', message: `Qwen timed out after ${args.timeout}s` },
            metadata: { model: args.model, reqCount: 1, remaining: DAILY_LIMIT - 1 },
          });
        }

        if (result.exitCode !== 0) {
          logger.error('Qwen CLI error', { stderr: result.stderr, exitCode: result.exitCode });
          return JSON.stringify({
            success: false,
            error: { code: 'CLI_ERROR', message: result.stderr || 'Unknown CLI error' },
            metadata: { model: args.model, reqCount: 1, remaining: DAILY_LIMIT - 1 },
          });
        }

        const extracted = extractQwenResponse(result.stdout);

        if (!extracted.success) {
          return JSON.stringify({
            success: false,
            error: { code: 'PARSE_ERROR', message: extracted.error || 'Failed to parse output' },
            metadata: { model: args.model, reqCount: 1, remaining: DAILY_LIMIT - 1 },
          });
        }

        return JSON.stringify({
          success: true,
          response: extracted.data,
          metadata: { model: args.model, reqCount: 1, remaining: DAILY_LIMIT - 1 },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Qwen invocation failed', { error: message });
        return JSON.stringify({
          success: false,
          error: { code: 'INVOCATION_ERROR', message },
          metadata: { model: args.model, reqCount: 0, remaining: 0 },
        });
      }
    },
  });
}
