/** Knowledge curator hook for spider-agent v6.17 two-tier knowledge system. */
import type { KnowledgeConfig } from './knowledge-types.js';
/**
 * Check if the input is a write operation targeting an evidence file.
 * Exported for testing purposes only.
 */
export declare function isWriteToEvidenceFile(input: unknown): boolean;
/**
 * Curate and store Spider knowledge entries from lessons.
 * @returns Promise resolving to an object with counts of stored, skipped, and rejected lessons.
 */
export declare function curateAndStoreSpider(lessons: string[], projectName: string, phaseInfo: {
    phase_number: number;
}, directory: string, config: KnowledgeConfig): Promise<{
    stored: number;
    skipped: number;
    rejected: number;
}>;
/**
 * Auto-promote Spider entries based on phase confirmations and age.
 */
export declare function runAutoPromotion(directory: string, config: KnowledgeConfig): Promise<void>;
/**
 * Create the knowledge curator hook.
 * Watches for writes to .Spider/plan.md and extracts lessons from the retrospective section.
 */
export declare function createKnowledgeCuratorHook(directory: string, config: KnowledgeConfig): (input: unknown, output: unknown) => Promise<void>;
