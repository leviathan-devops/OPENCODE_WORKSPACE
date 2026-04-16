/**
 * Handles the /Spider promote command.
 * Manually promotes lessons to hive knowledge.
 *
 * Usage:
 * - /Spider promote "<lesson text>" — Promote direct text
 * - /Spider promote --category <category> "<lesson text>" — Promote with category
 * - /Spider promote --from-Spider <lesson-id> — Promote from existing Spider lesson
 */
export declare function handlePromoteCommand(directory: string, args: string[]): Promise<string>;
