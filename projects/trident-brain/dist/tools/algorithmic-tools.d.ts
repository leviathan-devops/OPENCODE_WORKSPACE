/**
 * Trident Tools - ALGORITHMIC CORE
 *
 * Uses algorithmic classifiers, model is ONLY for reading code.
 * ALL theatrical code patterns are explicitly BANNED and constitute CRITICAL SYSTEM FAILURE.
 */
import type { ToolContext } from '@opencode-ai/plugin';
interface TridentState {
    mode: string;
    target: string;
    depth: number;
    artifacts: Map<string, string>;
    initialized: boolean;
    lastError?: string;
}
export declare function createTridentTools(state: TridentState): {
    'trident-audit': {
        description: string;
        args: {
            target: import("zod").ZodOptional<import("zod").ZodString>;
            depth: import("zod").ZodOptional<import("zod").ZodNumber>;
            skipBuild: import("zod").ZodOptional<import("zod").ZodBoolean>;
            skipTest: import("zod").ZodOptional<import("zod").ZodBoolean>;
        };
        execute(args: {
            target?: string | undefined;
            depth?: number | undefined;
            skipBuild?: boolean | undefined;
            skipTest?: boolean | undefined;
        }, context: ToolContext): Promise<string>;
    };
    'trident-status': {
        description: string;
        args: {};
        execute(args: Record<string, never>, context: ToolContext): Promise<string>;
    };
    'trident-report': {
        description: string;
        args: {
            format: import("zod").ZodOptional<import("zod").ZodString>;
            severity: import("zod").ZodOptional<import("zod").ZodString>;
        };
        execute(args: {
            format?: string | undefined;
            severity?: string | undefined;
        }, context: ToolContext): Promise<string>;
    };
    'trident-fix': {
        description: string;
        args: {
            severity: import("zod").ZodOptional<import("zod").ZodString>;
        };
        execute(args: {
            severity?: string | undefined;
        }, context: ToolContext): Promise<string>;
    };
};
export {};
