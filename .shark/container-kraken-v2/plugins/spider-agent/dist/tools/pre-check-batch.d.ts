/**
 * Pre-Check Batch Tool
 * Runs 4 verification tools in parallel: lint, secretscan, sast-scan, quality-budget
 * Returns unified result with gates_passed status
 */
import { tool } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import type { LintResult } from './lint';
import type { QualityBudgetResult } from './quality-budget';
import type { SastScanFinding, SastScanResult } from './sast-scan';
import type { SecretscanErrorResult, SecretscanResult } from './secretscan';
export interface PreCheckBatchInput {
    /** List of specific files to check (optional) */
    files?: string[];
    /** Directory to scan */
    directory: string;
    /** SAST severity threshold (default: medium) */
    sast_threshold?: 'low' | 'medium' | 'high' | 'critical';
    /** Optional plugin config */
    config?: PluginConfig;
}
export interface ToolResult<T> {
    /** Whether the tool was executed */
    ran: boolean;
    /** Tool result if successful */
    result?: T;
    /** Error message if failed */
    error?: string;
    /** Duration in milliseconds */
    duration_ms: number;
}
export interface PreCheckBatchResult {
    /** Overall gate status: true if all security gates pass */
    gates_passed: boolean;
    /** Lint tool result */
    lint: ToolResult<LintResult>;
    /** Secretscan tool result */
    secretscan: ToolResult<SecretscanResult | SecretscanErrorResult>;
    /** SAST scan tool result */
    sast_scan: ToolResult<SastScanResult>;
    /** Quality budget tool result */
    quality_budget: ToolResult<QualityBudgetResult>;
    /** Total duration in milliseconds */
    total_duration_ms: number;
    /** Pre-existing SAST findings on unchanged lines, requiring reviewer triage */
    sast_preexisting_findings?: SastScanFinding[];
}
/**
 * Parse unified diff output (with -U0) to extract added/modified line numbers per file.
 * Returns a Map from normalised file path → Set of changed line numbers.
 */
export declare function parseDiffLineRanges(diffOutput: string): Map<string, Set<number>>;
/**
 * Get changed line ranges for the current branch vs its base.
 * Tries three strategies in order:
 * 1. merge-base diff against main/master (captures all branch changes, works after commit)
 * 2. HEAD~1 (single-commit diff, works after commit)
 * 3. HEAD (unstaged/staged changes, works before commit)
 * Returns null if git is unavailable or no changes found.
 */
export declare function getChangedLineRanges(directory: string): Promise<Map<string, Set<number>> | null>;
/**
 * Classify SAST findings as "new" (on changed lines) or "pre-existing" (unchanged lines).
 * A finding is "new" if its file+line intersects the changed line ranges from git diff.
 * If line ranges cannot be determined (git unavailable), all findings are treated as new (fail-closed).
 */
export declare function classifySastFindings(findings: SastScanFinding[], changedLineRanges: Map<string, Set<number>> | null, directory: string): {
    newFindings: SastScanFinding[];
    preexistingFindings: SastScanFinding[];
};
/**
 * Run all 4 pre-check tools in parallel with concurrency limit
 * @param input - The pre-check batch input
 * @param workspaceDir - Optional workspace directory for traversal validation (defaults to directory param or process.cwd())
 */
export declare function runPreCheckBatch(input: PreCheckBatchInput, workspaceDir?: string, contextDir?: string): Promise<PreCheckBatchResult>;
/**
 * Pre-check batch tool - runs 4 verification tools in parallel
 * Returns unified result with gates_passed status
 */
export declare const pre_check_batch: ReturnType<typeof tool>;
