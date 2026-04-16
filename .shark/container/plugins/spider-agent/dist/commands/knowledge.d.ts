/**
 * Handles /Spider knowledge quarantine <id> [reason] command.
 * Moves a knowledge entry to quarantine with optional reason.
 */
export declare function handleKnowledgeQuarantineCommand(directory: string, args: string[]): Promise<string>;
/**
 * Handles /Spider knowledge restore <id> command.
 * Restores a quarantined knowledge entry.
 */
export declare function handleKnowledgeRestoreCommand(directory: string, args: string[]): Promise<string>;
/**
 * Handles /Spider knowledge migrate [directory] command.
 * Triggers one-time migration from .Spider/context.md to .Spider/knowledge.jsonl.
 */
export declare function handleKnowledgeMigrateCommand(directory: string, args: string[]): Promise<string>;
/**
 * Handles /Spider knowledge command (no subcommand) - lists knowledge entries.
 * Lists entries from .Spider/knowledge.jsonl with id, category, confidence, truncated text.
 */
export declare function handleKnowledgeListCommand(directory: string, _args: string[]): Promise<string>;
