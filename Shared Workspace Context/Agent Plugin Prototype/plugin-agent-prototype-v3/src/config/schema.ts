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
  
  // Coordination settings (for v3)
  coordination: z.object({
    enabled: z.boolean().default(false),
    swarmId: z.string().optional(),
    swarmName: z.string().optional(),
    gates: z.object({
      delegation: z.object({
        policy: z.enum(['strict', 'advisory', 'off']).default('advisory'),
        maxRejections: z.number().default(3),
      }).optional(),
      qa: z.object({
        policy: z.enum(['strict', 'advisory', 'off']).default('advisory'),
      }).optional(),
    }).optional(),
    guardrails: z.object({
      maxDuration: z.number().default(300000),
      idleTimeout: z.number().default(60000),
      errorThreshold: z.number().default(5),
    }).optional(),
    storage: z.object({
      baseDir: z.string().default('.swarm'),
      autoSave: z.boolean().default(true),
    }).optional(),
  }).optional(),
});

export type PluginConfig = z.infer<typeof PluginConfigSchema>;

// Config file schema (for loading from disk)
export const ConfigFileSchema = z.object({
  version: z.string().default('1.0.0'),
  plugin: PluginConfigSchema,
});

export type ConfigFile = z.infer<typeof ConfigFileSchema>;
