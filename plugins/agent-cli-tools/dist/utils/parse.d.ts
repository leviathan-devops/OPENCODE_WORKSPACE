/**
 * src/utils/parse.ts
 *
 * JSON output parser for CLI tool responses.
 */
export interface ParseResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}
export declare function parseJsonOutput<T = unknown>(output: string): ParseResult<T>;
//# sourceMappingURL=parse.d.ts.map