import { z } from 'zod';
import { AgentSpecSchema, BuildConfigSchema, TaskSchema } from './types.js';

export function validateAgentSpec(data: unknown) {
  return AgentSpecSchema.safeParse(data);
}

export function validateBuildConfig(data: unknown) {
  return BuildConfigSchema.safeParse(data);
}

export function validateTask(data: unknown) {
  return TaskSchema.safeParse(data);
}

export class ValidationError extends Error {
  constructor(public errors: z.ZodError) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}