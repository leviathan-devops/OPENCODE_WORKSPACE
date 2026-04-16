import { z } from 'zod';

export const AgentSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  capabilities: z.array(z.string()),
  constraints: z.array(z.string()),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.any())
  })),
  personality: z.object({
    tone: z.string(),
    communicationStyle: z.string(),
    expertiseLevel: z.string()
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const BuildConfigSchema = z.object({
  agentId: z.string(),
  environment: z.enum(['development', 'staging', 'production']),
  resources: z.object({
    memory: z.number(),
    cpu: z.number(),
    timeout: z.number()
  }),
  dependencies: z.array(z.string()),
  testConfig: z.object({
    unitTests: z.boolean(),
    integrationTests: z.boolean(),
    e2eTests: z.boolean()
  })
});

export const TaskSchema = z.object({
  id: z.string(),
  type: z.enum(['code-generation', 'testing', 'deployment', 'monitoring']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  dependencies: z.array(z.string()),
  status: z.enum(['pending', 'in-progress', 'completed', 'failed']),
  result: z.any().optional(),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional()
});

export type AgentSpec = z.infer<typeof AgentSpecSchema>;
export type BuildConfig = z.infer<typeof BuildConfigSchema>;
export type Task = z.infer<typeof TaskSchema>;