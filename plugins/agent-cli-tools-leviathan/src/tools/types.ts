import { z } from 'zod';

// ============ GEMINI ============

export const geminiArgsSchema = z.object({
  prompt: z.string(),
  model: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro']).default('gemini-2.5-flash'),
  sandbox: z.boolean().default(false),
  outputFormat: z.enum(['json', 'text']).default('json'),
  timeout: z.number().default(120),
});

export type GeminiArgs = z.infer<typeof geminiArgsSchema>;

export interface GeminiToolResult {
  success: boolean;
  response?: string | object;
  error?: {
    code: 'TIMEOUT' | 'CLI_ERROR' | 'PARSE_ERROR' | 'INVALID_ARGS' | 'INVOCATION_ERROR';
    message: string;
  };
  metadata: {
    model: string;
    tokensUsed?: number;
    reqCount: number;
    remaining: number;
  };
}

// ============ QWEN ============

export const qwenArgsSchema = z.object({
  prompt: z.string(),
  yolo: z.boolean().default(false),
  model: z.string().default('qwen3-coder'),
  outputFormat: z.enum(['json', 'text']).default('json'),
  timeout: z.number().default(120),
});

export type QwenArgs = z.infer<typeof qwenArgsSchema>;

export interface QwenToolResult {
  success: boolean;
  response?: string | object;
  error?: {
    code: 'TIMEOUT' | 'CLI_ERROR' | 'PARSE_ERROR' | 'INVALID_ARGS' | 'INVOCATION_ERROR';
    message: string;
  };
  metadata: {
    model: string;
    tokensUsed?: number;
    reqCount: number;
    remaining: number;
  };
}
