/**
 * src/config/schema.ts
 * 
 * Zod schemas for config validation.
 * 
 * CUSTOMIZE: Add your own config fields here.
 */

import { z } from 'zod';

// CUSTOMIZE: Define your plugin's configuration schema
export const PluginConfigSchema = z.object({
  // Core settings
  enabled: z.boolean().default(true),
  debug: z.boolean().default(false),
  
  // Agent settings
  agents: z.object({
    architect: z.object({
      model: z.string().default('claude-sonnet-4-20250514'),
      temperature: z.number().min(0).max(2).default(0.7),
    }).optional(),
    coder: z.object({
      model: z.string().default('claude-sonnet-4-20250514'),
      temperature: z.number().min(0).max(2).default(0.3),
    }).optional(),
    reviewer: z.object({
      model: z.string().default('claude-sonnet-4-20250514'),
      temperature: z.number().min(0).max(2).default(0.2),
    }).optional(),
  }).optional(),
  
  // External storage settings
  storage: z.object({
    endpoint: z.string().default('http://localhost:1933'),
    apiKey: z.string().optional(),
    timeoutMs: z.number().default(30000),
    fallbackDir: z.string().optional(),
  }).optional(),
  
  // Tool settings
  tools: z.object({
    healthCheckIntervalMs: z.number().default(60000),
    maxRetries: z.number().default(3),
  }).optional(),
  
  // Hook settings
  hooks: z.object({
    experimentalMessagesTransform: z.boolean().default(true),
    experimentalSystemTransform: z.boolean().default(true),
    sessionCompacting: z.boolean().default(true),
  }).optional(),
});

export type PluginConfig = z.infer<typeof PluginConfigSchema>;

// Config file schema (for loading from disk)
export const ConfigFileSchema = z.object({
  version: z.string().default('1.0.0'),
  plugin: PluginConfigSchema,
});

export type ConfigFile = z.infer<typeof ConfigFileSchema>;
