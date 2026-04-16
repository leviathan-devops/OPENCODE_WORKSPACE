/**
 * V4 Brain Factory
 *
 * Creates single, dual, or trio brain configurations.
 */

import type {
  BrainType,
  BrainConfig,
  SingleBrainConfig,
  DualBrainConfig,
  TrioBrainConfig,
  BrainInstance,
  BrainHierarchy,
  ValidationResult,
} from './types.js';

export class BrainFactory {
  create(config: BrainConfig): BrainInstance {
    switch (config.type) {
      case 'single':
        return this.createSingleBrain(config as SingleBrainConfig);
      case 'dual':
        return this.createDualBrain(config as DualBrainConfig);
      case 'trio':
        return this.createTrioBrain(config as TrioBrainConfig);
      default:
        throw new Error(
          `BrainFactory.create: unknown brain type "${(config as BrainConfig).type}". Expected 'single', 'dual', or 'trio'.`,
        );
    }
  }

  createSingleBrain(config: SingleBrainConfig): BrainInstance {
    const validation = this.validate(config);
    if (!validation.valid) {
      throw new Error(
        `BrainFactory.createSingleBrain: validation failed — ${validation.errors.join(', ')}`,
      );
    }

    const hierarchy: BrainHierarchy = {
      level: 0,
      children: [],
    };

    return {
      type: 'single',
      primary: config.orchestrator,
      all: [config.orchestrator],
      hierarchy,
      syncMode: 'none',
    };
  }

  createDualBrain(config: DualBrainConfig): BrainInstance {
    const validation = this.validate(config);
    if (!validation.valid) {
      throw new Error(
        `BrainFactory.createDualBrain: validation failed — ${validation.errors.join(', ')}`,
      );
    }

    const orchestratorIds = Object.keys(config.orchestrators);
    const primary = orchestratorIds[0];

    const hierarchy: BrainHierarchy = {
      level: 0,
      children: orchestratorIds.slice(1).map((id) => ({
        type: 'dual' as BrainType,
        primary: id,
        all: [id],
        hierarchy: { level: 1, children: [], parent: primary },
      })),
    };

    return {
      type: 'dual',
      primary,
      all: orchestratorIds,
      hierarchy,
      workflows: config.workflows,
      syncMode: config.syncMode,
    };
  }

  createTrioBrain(config: TrioBrainConfig): BrainInstance {
    const validation = this.validate(config);
    if (!validation.valid) {
      throw new Error(
        `BrainFactory.createTrioBrain: validation failed — ${validation.errors.join(', ')}`,
      );
    }

    const orchestratorIds = Object.keys(config.orchestrators);
    const primary = orchestratorIds[0];

    const hierarchy: BrainHierarchy = {
      level: 0,
      children: orchestratorIds.slice(1).map((id) => ({
        type: 'trio' as BrainType,
        primary: id,
        all: [id],
        hierarchy: { level: 1, children: [], parent: primary },
      })),
    };

    return {
      type: 'trio',
      primary,
      all: orchestratorIds,
      hierarchy,
      workflows: config.workflows,
      syncMode: config.syncMode,
    };
  }

  validate(config: BrainConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.type) errors.push('Brain config must have a type');
    if (!config.name) errors.push('Brain config must have a name');

    if (config.type === 'single') {
      const single = config as SingleBrainConfig;
      if (!single.orchestrator)
        errors.push('Single brain config must have an orchestrator');
    }

    if (config.type === 'dual') {
      const dual = config as DualBrainConfig;
      if (!dual.orchestrators || Object.keys(dual.orchestrators).length !== 2)
        errors.push('Dual brain config must have exactly 2 orchestrators');
      if (!dual.syncMode) warnings.push('Dual brain syncMode not specified, defaulting to shared-state');
    }

    if (config.type === 'trio') {
      const trio = config as TrioBrainConfig;
      if (!trio.orchestrators || Object.keys(trio.orchestrators).length !== 3)
        errors.push('Trio brain config must have exactly 3 orchestrators');
      if (!trio.syncMode) warnings.push('Trio brain syncMode not specified, defaulting to shared-state');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
