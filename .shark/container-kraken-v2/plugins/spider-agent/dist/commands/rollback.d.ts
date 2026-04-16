/**
 * Handle /Spider rollback command
 * Restores .Spider/ state from a checkpoint using direct overwrite
 */
export declare function handleRollbackCommand(directory: string, args: string[]): Promise<string>;
