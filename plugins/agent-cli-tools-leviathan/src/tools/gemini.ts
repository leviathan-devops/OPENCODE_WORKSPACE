import { tool as toolFn } from '@opencode-ai/plugin';
import { z } from 'zod';
import { invokeCli, buildGeminiArgs } from '../utils/cli.js';
import { extractGeminiResponse } from '../utils/parse.js';
import { logger } from '../utils/logger.js';

const DAILY_LIMIT = 1000;

export function createGeminiTool() {
  return toolFn({
    description: 'Invoke Google Gemini CLI for coding tasks. Provides 1M token context, search grounding, and structured JSON output. Free tier: 1000 req/day.',
    args: {
      prompt: z.string(),
      model: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro']).default('gemini-2.5-flash'),
      sandbox: z.boolean().default(false),
      outputFormat: z.enum(['json', 'text']).default('json'),
      timeout: z.number().default(120),
    },
    execute: async (args) => {
      logger.debug('Gemini tool invoked', { prompt: args.prompt.substring(0, 50) });

      const cmdArgs = buildGeminiArgs({
        prompt: args.prompt,
        model: args.model,
        sandbox: args.sandbox,
        outputFormat: args.outputFormat,
      });

      logger.debug('Invoking gemini CLI', { args: cmdArgs });

      try {
        const result = await invokeCli('gemini', cmdArgs, { timeout: args.timeout });

        if (result.timedOut) {
          logger.warn('Gemini timed out', { timeout: args.timeout });
          return JSON.stringify({
            success: false,
            error: { code: 'TIMEOUT', message: `Gemini timed out after ${args.timeout}s` },
            metadata: { model: args.model, reqCount: 1, remaining: DAILY_LIMIT - 1 },
          });
        }

        if (result.exitCode !== 0) {
          logger.error('Gemini CLI error', { stderr: result.stderr, exitCode: result.exitCode });
          return JSON.stringify({
            success: false,
            error: { code: 'CLI_ERROR', message: result.stderr || 'Unknown CLI error' },
            metadata: { model: args.model, reqCount: 1, remaining: DAILY_LIMIT - 1 },
          });
        }

        const extracted = extractGeminiResponse(result.stdout);

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
        logger.error('Gemini invocation failed', { error: message });
        return JSON.stringify({
          success: false,
          error: { code: 'INVOCATION_ERROR', message },
          metadata: { model: args.model, reqCount: 0, remaining: 0 },
        });
      }
    },
  });
}
