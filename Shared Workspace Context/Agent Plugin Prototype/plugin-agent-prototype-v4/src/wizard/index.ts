/**
 * V4.1 Wizard Module
 *
 * Architecture Elicitation Wizard — natural language interface for building
 * multi-orchestrator agent systems.
 *
 * Usage:
 *   import { elicitArchitecture, extractFromQandA } from './wizard';
 *
 *   // Interactive CLI mode
 *   const result = await elicitArchitecture("I want a coding assistant with a planner and an executor");
 *
 *   // Programmatic mode with pre-collected answers
 *   const result = extractFromQandA("idea", [
 *     { questionId: 'brain_type', answer: 'dual' },
 *     { questionId: 'orchestrator_names', answer: 'Planner, Executor' },
 *     // ...
 *   ]);
 *
 *   // Then feed through factory
 *   const instance = await createV4Instance({ customConfig: result.config });
 */

export * from './types.js';
export * from './engine.js';
export * from './cli.js';
