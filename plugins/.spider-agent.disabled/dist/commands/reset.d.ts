/**
 * Handles the /Spider reset command.
 * Clears plan.md and context.md from .Spider/ directory.
 * Stops background automation and resets in-memory queues.
 * Requires --confirm flag as a safety gate.
 */
export declare function handleResetCommand(directory: string, args: string[]): Promise<string>;
