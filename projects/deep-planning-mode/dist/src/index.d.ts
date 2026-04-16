/**
 * DEEP PLANNING MODE - Plugin Entry
 *
 * Natural language parsing, command handlers, and hooks.
 * Follows Trident v3.0 architecture pattern.
 */
import { Finding } from '../context-library/patterns';
import { PlanData } from '../context-library/templates';
export interface ModeState {
    mode: 'idle' | 'planning' | 'analyzing' | 'validating';
    currentPlan: PlanData | null;
    context: string;
    lastError?: string;
    lastFindings: Finding[];
}
export interface CommandResult {
    success: boolean;
    output: string;
    state: ModeState;
}
export declare function routeCommand(message: string, context?: string): Promise<CommandResult>;
export declare function getToolBlockingHook(): {
    name: string;
    handler: (input: any, output: any) => Promise<void>;
};
export declare function getChatHook(): {
    name: string;
    handler: (input: any, output: any) => Promise<void>;
};
export declare function getState(): ModeState;
export declare function resetState(): void;
export declare function setPlan(plan: PlanData): void;
export declare const plugin: {
    name: string;
    version: string;
    description: string;
    commands: {
        'deep-plan': (message: string, context?: string) => Promise<CommandResult>;
        'analyze-deps': (context: string) => Promise<CommandResult>;
        'risk-analysis': (context: string) => Promise<CommandResult>;
        checkpoint: () => Promise<CommandResult>;
        'validate-plan': () => Promise<CommandResult>;
        'show-constraints': () => Promise<CommandResult>;
        'show-dependencies': () => Promise<CommandResult>;
    };
    hooks: {
        name: string;
        handler: (input: any, output: any) => Promise<void>;
    }[];
};
export default plugin;
//# sourceMappingURL=index.d.ts.map