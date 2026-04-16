/**
 * V4 Agent Factory Edition - Main Entry Point
 * 
 * Meta-configurable agent architecture system.
 * Create custom architectures (Spider, Hermes, Shark, etc.) through configuration files.
 */

export { ArchitectureFactory } from './factory/ArchitectureFactory';
export { BrainFactory } from './factory/BrainFactory';
export { ClusterFactory } from './factory/ClusterFactory';
export { AgentFactory } from './factory/AgentFactory';
export { WorkflowFactory } from './factory/WorkflowFactory';
export { CoordinationFactory } from './factory/CoordinationFactory';

export type {
  // Architecture types
  ArchitectureConfig,
  BrainConfig,
  ClusterConfig,
  AgentConfig,
  WorkflowConfig,
  WorkflowPhase,
  WorkflowGate,
  GateCriteria,
  CoordinationConfig,
  
  // Factory types
  ArchitectureFactoryOptions,
  CreateArchitectureOptions,
  
  // Instance types
  ArchitectureInstance,
  BrainInstance,
  ClusterInstance,
  AgentInstance,
  WorkflowInstance,
  CoordinationInstance
} from './types/architecture';

/**
 * Create a new architecture instance
 * 
 * @example
 * ```typescript
 * import { createArchitecture } from './src';
 * 
 * // Create Spider architecture
 * const spider = await createArchitecture({
 *   config: './ARCHITECTURES/spider.json'
 * });
 * 
 * // Create custom architecture
 * const custom = await createArchitecture({
 *   config: {
 *     id: 'my-architecture',
 *     name: 'My Custom Architecture',
 *     version: 'v4',
 *     // ... configuration
 *   }
 * });
 * ```
 */
export async function createArchitecture(options: CreateArchitectureOptions): Promise<ArchitectureInstance> {
  const factory = new ArchitectureFactory();
  return await factory.createArchitecture(options);
}

/**
 * Quick start: Create Spider architecture
 */
export async function createSpiderArchitecture(context: any = {}): Promise<ArchitectureInstance> {
  return await createArchitecture({
    config: './ARCHITECTURES/spider.json',
    context,
    initializeCoordination: true
  });
}

/**
 * Quick start: Create Hermes architecture
 */
export async function createHermesArchitecture(context: any = {}): Promise<ArchitectureInstance> {
  return await createArchitecture({
    config: './ARCHITECTURES/hermes.json',
    context,
    initializeCoordination: true
  });
}

/**
 * Quick start: Create Shark architecture
 */
export async function createSharkArchitecture(context: any = {}): Promise<ArchitectureInstance> {
  return await createArchitecture({
    config: './ARCHITECTURES/shark.json',
    context,
    initializeCoordination: true
  });
}

/**
 * Get available architecture examples
 */
export function getAvailableArchitectures(): string[] {
  return ['spider', 'hermes', 'shark'];
}

/**
 * Load architecture configuration
 */
export async function loadArchitectureConfig(id: string): Promise<any> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const configPath = path.join(__dirname, '..', 'ARCHITECTURES', `${id}.json`);
  const content = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(content);
}

// Default export
export default {
  createArchitecture,
  createSpiderArchitecture,
  createHermesArchitecture,
  createSharkArchitecture,
  getAvailableArchitectures,
  loadArchitectureConfig,
  
  // Factories
  ArchitectureFactory,
  BrainFactory,
  ClusterFactory,
  AgentFactory,
  WorkflowFactory,
  CoordinationFactory
};