/**
 * Trident Tools - AUDIT CAPABLE
 *
 * Tools for Trident Brain Code Review Mode.
 * - /audit or /audit this to trigger
 * - Container execution via shell
 * - Writes to TRIDENT_CODE_REVIEW.md
 */
import type { ToolContext } from '@opencode-ai/plugin';
import type { TridentState } from '../hooks/trident-hook.js';
import type { ModeCoordinator } from '../shared/mode-coordinator.js';
import { CodeReviewMode } from '../modes/code-review/index.js';
export interface TridentToolsOptions {
    state: TridentState;
    coordinator: ModeCoordinator;
    codeReviewMode: CodeReviewMode;
}
export declare function createTridentTools(options: TridentToolsOptions): {
    'trident-status': {
        description: string;
        args: {};
        execute(args: Record<string, never>, context: ToolContext): Promise<string>;
    };
    'trident-audit': {
        description: string;
        args: {
            target: import("zod").ZodOptional<import("zod").ZodString>;
            depth: import("zod").ZodOptional<import("zod").ZodNumber>;
            container: import("zod").ZodOptional<import("zod").ZodString>;
            testCommand: import("zod").ZodOptional<import("zod").ZodString>;
            buildCommand: import("zod").ZodOptional<import("zod").ZodString>;
        };
        execute(args: {
            target?: string | undefined;
            depth?: number | undefined;
            container?: string | undefined;
            testCommand?: string | undefined;
            buildCommand?: string | undefined;
        }, context: ToolContext): Promise<string>;
    };
    'trident-report': {
        description: string;
        args: {
            format: import("zod").ZodOptional<import("zod").ZodString>;
            save: import("zod").ZodOptional<import("zod").ZodBoolean>;
        };
        execute(args: {
            format?: string | undefined;
            save?: boolean | undefined;
        }, context: ToolContext): Promise<string>;
    };
    'trident-gate': {
        description: string;
        args: {
            action: import("zod").ZodOptional<import("zod").ZodString>;
        };
        execute(args: {
            action?: string | undefined;
        }, context: ToolContext): Promise<string>;
    };
    'trident-fix': {
        description: string;
        args: {
            severity: import("zod").ZodOptional<import("zod").ZodString>;
            format: import("zod").ZodOptional<import("zod").ZodString>;
        };
        execute(args: {
            severity?: string | undefined;
            format?: string | undefined;
        }, context: ToolContext): Promise<string>;
    };
};
