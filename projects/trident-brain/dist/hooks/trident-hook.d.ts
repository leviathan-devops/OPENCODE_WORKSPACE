/**
 * Trident Brain Hooks - AUDIT MODE
 *
 * Simplified hook system for Trident Code Review Mode.
 */
import type { Hooks } from '@opencode-ai/plugin';
import type { ModeCoordinator, ModeType } from '../shared/mode-coordinator.js';
export interface TridentState {
    currentMode: ModeType | null;
    currentLayer: number;
    iteration: string;
    target: string;
    depth: number;
    artifacts: Map<string, string>;
    auditActive: boolean;
}
export interface TridentHooksOptions {
    coordinator: ModeCoordinator;
    state: TridentState;
}
export declare function createTridentHooks(options: TridentHooksOptions): Partial<Hooks>;
export declare function createTridentState(): TridentState;
