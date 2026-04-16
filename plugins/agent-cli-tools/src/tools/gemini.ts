/**
 * src/tools/gemini.ts
 *
 * Gemini CLI tool - wraps gemini CLI as an OpenCode native tool.
 */

import { tool as toolFn } from '@opencode-ai/plugin';
import { GeminiArgsSchema, ERROR_CODES, type GeminiArgs, type GeminiResult } from './types.js';
import { invokeCli } from '../utils/cli.js';
import { parseJsonOutput } from '../utils/parse.js';
import { logger } from '../utils/logger.js';

export function createGeminiTool() {
  return toolFn({
    description: 'Invoke Gemini CLI for code analysis, review, and generation',
    args: {
      prompt: GeminiArgsSchema.shape.prompt,
      model: GeminiArgsSchema.shape.model.optional(),
      sandbox: GeminiArgsSchema.shape.sandbox.optional(),
      outputFormat: GeminiArgsSchema.shape.outputFormat.optional(),
      timeout: GeminiArgsSchema.shape.timeout.optional(),
    },
    execute: async (args: Partial<GeminiArgs>): Promise<string> => {
      const parsed = GeminiArgsSchema.safeParse(args);
      if (!parsed.success) {
        const result: GeminiResult = {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_ARGS,
            message: parsed.error.issues.map((e: any) => e.message).join(', '),
          },
          metadata: { model: args.model ?? 'gemini-2.5-flash' },
        };
        return JSON.stringify(result);
      }

      const { prompt, model, sandbox, outputFormat, timeout } = parsed.data;

      const cliArgs: string[] = ['-p', prompt];
      if (model !== 'gemini-2.5-flash') cliArgs.push('-m', model);
      if (sandbox) cliArgs.push('-s');
      if (outputFormat === 'json') cliArgs.push('--output-format', 'json');

      logger.info('Invoking Gemini CLI', { model, sandbox, timeout });

      const cliResult = await invokeCli({
        command: 'gemini',
        args: cliArgs,
        timeoutMs: timeout * 1000,
      });

      if (cliResult.error) {
        const result: GeminiResult = {
          success: false,
          error: cliResult.error,
          metadata: { model },
        };
        return JSON.stringify(result);
      }

      if (outputFormat === 'json') {
        const parsed_output = parseJsonOutput(cliResult.stdout);
        if (!parsed_output.success) {
          const result: GeminiResult = {
            success: false,
            error: parsed_output.error,
            metadata: { model },
          };
          return JSON.stringify(result);
        }
        const result: GeminiResult = {
          success: true,
          response: parsed_output.data as string | Record<string, unknown>,
          metadata: { model },
        };
        return JSON.stringify(result);
      }

      const result: GeminiResult = {
        success: true,
        response: cliResult.stdout,
        metadata: { model },
      };
      return JSON.stringify(result);
    },
  });
}
