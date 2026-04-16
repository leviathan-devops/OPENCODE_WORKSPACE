/**
 * Handles /Spider close command - closes the Spider by archiving evidence,
 * writing retrospectives for in-progress phases, and clearing session state.
 * Must be idempotent - safe to run multiple times.
 */
export declare function handleCloseCommand(directory: string, _args: string[]): Promise<string>;
