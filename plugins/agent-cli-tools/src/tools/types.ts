/**
 * src/tools/types.ts
 *
 * Zod schemas and TypeScript types for Gemini and Qwen CLI tools.
 */

import { z } from 'zod';

// ─── Error Codes ──────────────────────────────────────────────────────────────

export const ERROR_CODES = {
  TIMEOUT: 'TIMEOUT',
  CLI_ERROR: 'CLI_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  INVALID_ARGS: 'INVALID_ARGS',
  INVOCATION_ERROR: 'INVOCATION_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ─── Shared Types ─────────────────────────────────────────────────────────────

export const OutputFormatSchema = z.enum(['json', 'text']);
export type OutputFormat = z.infer<typeof OutputFormatSchema>;

export const CliErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type CliError = z.infer<typeof CliErrorSchema>;

export const CliMetadataSchema = z.object({
  model: z.string(),
  tokensUsed: z.number().optional(),
  reqCount: z.number().optional(),
  remaining: z.number().optional(),
});
export type CliMetadata = z.infer<typeof CliMetadataSchema>;

// ─── Gemini ───────────────────────────────────────────────────────────────────

export const GeminiArgsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.enum([
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-3.1-pro-preview',
        'gemini-3.1-flash-lite-preview',
        'gemini-3.1-pro',
        'gemini-3.1-flash-lite',
        'gemini-3-pro-preview',
        'gemini-3-flash-preview',
      ]).default('gemini-2.5-flash'),
  sandbox: z.boolean().default(false),
  outputFormat: OutputFormatSchema.default('json'),
  timeout: z.number().min(1).max(600).default(120),
});
export type GeminiArgs = z.infer<typeof GeminiArgsSchema>;

export const GeminiResultSchema = z.object({
  success: z.boolean(),
  response: z.union([z.string(), z.object({}).passthrough()]).optional(),
  error: CliErrorSchema.optional(),
  metadata: CliMetadataSchema,
});
export type GeminiResult = z.infer<typeof GeminiResultSchema>;

// ─── Qwen ─────────────────────────────────────────────────────────────────────

export const QwenArgsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  yolo: z.boolean().default(false),
  model: z.string().default('qwen3-coder'),
  outputFormat: OutputFormatSchema.default('json'),
  timeout: z.number().min(1).max(600).default(120),
});
export type QwenArgs = z.infer<typeof QwenArgsSchema>;

export const QwenResultSchema = z.object({
  success: z.boolean(),
  response: z.union([z.string(), z.object({}).passthrough()]).optional(),
  error: CliErrorSchema.optional(),
  metadata: CliMetadataSchema,
});
export type QwenResult = z.infer<typeof QwenResultSchema>;
