/**
 * V3 Config Schema (compatibility layer for copied V3 code)
 */

import { z } from 'zod';

export const ConfigSchema = z.object({
  enabled: z.boolean().default(true),
  debug: z.boolean().default(false),
  coordination: z.object({
    enabled: z.boolean().default(false),
    swarmId: z.string().default('plugin-v4'),
    swarmName: z.string().default('Plugin Agent v4'),
    gates: z.record(z.string(), z.unknown()).optional(),
    guardrails: z.record(z.string(), z.unknown()).optional(),
    storage: z.object({
      baseDir: z.string().default('./.spider'),
      autoSave: z.boolean().default(true),
    }).optional(),
  }).optional(),
  storage: z.object({
    baseDir: z.string().default('./.spider'),
    endpoint: z.string().optional(),
    apiKey: z.string().optional(),
    timeoutMs: z.number().optional(),
    tools: z.array(z.string()).optional(),
  }).optional(),
  tools: z.object({
    maxRetries: z.number().optional(),
  }).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

// V3-compatible aliases
export const PluginConfigSchema = ConfigSchema;
export type PluginConfig = Config;
