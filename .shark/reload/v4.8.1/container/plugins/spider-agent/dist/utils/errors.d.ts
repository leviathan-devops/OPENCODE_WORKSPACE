/**
 * Base error class for all Spider errors.
 * Includes a machine-readable `code` and a user-facing `guidance` string.
 */
export declare class SpiderError extends Error {
    readonly code: string;
    readonly guidance: string;
    constructor(message: string, code: string, guidance: string);
}
/**
 * Error thrown when configuration loading or validation fails.
 */
export declare class ConfigError extends SpiderError {
    constructor(message: string, guidance: string);
}
/**
 * Error thrown when a hook execution fails.
 */
export declare class HookError extends SpiderError {
    constructor(message: string, guidance: string);
}
/**
 * Error thrown when a tool execution fails.
 */
export declare class ToolError extends SpiderError {
    constructor(message: string, guidance: string);
}
/**
 * Error thrown when CLI operations fail.
 */
export declare class CLIError extends SpiderError {
    constructor(message: string, guidance: string);
}
