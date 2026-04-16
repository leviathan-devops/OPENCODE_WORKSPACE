/**
 * src/utils/cli.ts
 *
 * Generic CLI invocation wrapper using child_process.spawn.
 */
import { type ErrorCode } from '../tools/types.js';
export interface CliResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    error?: {
        code: ErrorCode;
        message: string;
    };
}
export interface InvokeCliOptions {
    command: string;
    args: string[];
    timeoutMs: number;
    cwd?: string;
}
export declare function invokeCli(options: InvokeCliOptions): Promise<CliResult>;
//# sourceMappingURL=cli.d.ts.map