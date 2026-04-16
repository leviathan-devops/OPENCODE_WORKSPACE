export interface ParseResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    rawText?: string;
}
export declare function parseJsonOutput<T = unknown>(output: string): ParseResult<T>;
export declare function extractGeminiResponse(output: string): ParseResult;
export declare function extractQwenResponse(output: string): ParseResult;
//# sourceMappingURL=parse.d.ts.map