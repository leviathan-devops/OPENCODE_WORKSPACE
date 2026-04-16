/**
 * src/tools/qwen.ts
 *
 * Qwen Code CLI tool - wraps qwen CLI as an OpenCode native tool.
 */

import { tool as toolFn } from '@opencode-ai/plugin';
import { QwenArgsSchema, ERROR_CODES, type QwenArgs, type QwenResult } from './types.js';
import { invokeCli } from '../utils/cli.js';
import { parseJsonOutput } from '../utils/parse.js';
import { logger } from '../utils/logger.js';

export function createQwenTool() {
  return toolFn({
    description: 'Invoke Qwen Code CLI for autonomous code generation and review',
    args: {
      prompt: QwenArgsSchema.shape.prompt,
      yolo: QwenArgsSchema.shape.yolo.optional(),
      model: QwenArgsSchema.shape.model.optional(),
      outputFormat: QwenArgsSchema.shape.outputFormat.optional(),
      timeout: QwenArgsSchema.shape.timeout.optional(),
    },
    execute: async (args: Partial<QwenArgs>): Promise<string> => {
      const parsed = QwenArgsSchema.safeParse(args);
      if (!parsed.success) {
        const result: QwenResult = {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_ARGS,
            message: parsed.error.issues.map((e: any) => e.message).join(', '),
          },
          metadata: { model: args.model ?? 'qwen3-coder' },
        };
        return JSON.stringify(result);
      }

      const { prompt, yolo, model, outputFormat, timeout } = parsed.data;

      const cliArgs: string[] = ['-p', prompt];
      if (yolo) cliArgs.push('--yolo');
      if (model !== 'qwen3-coder') cliArgs.push('-m', model);
      if (outputFormat === 'json') cliArgs.push('--output-format', 'json');

      logger.info('Invoking Qwen CLI', { model, yolo, timeout });

      const cliResult = await invokeCli({
        command: 'qwen',
        args: cliArgs,
        timeoutMs: timeout * 1000,
      });

      if (cliResult.error) {
        const result: QwenResult = {
          success: false,
          error: cliResult.error,
          metadata: { model },
        };
        return JSON.stringify(result);
      }

      if (outputFormat === 'json') {
        const parsed_output = parseJsonOutput(cliResult.stdout);
        if (!parsed_output.success) {
          const result: QwenResult = {
            success: false,
            error: parsed_output.error,
            metadata: { model },
          };
          return JSON.stringify(result);
        }
        const result: QwenResult = {
          success: true,
          response: parsed_output.data as string | Record<string, unknown>,
          metadata: { model },
        };
        return JSON.stringify(result);
      }

      const result: QwenResult = {
        success: true,
        response: cliResult.stdout,
        metadata: { model },
      };
      return JSON.stringify(result);
    },
  });
}
