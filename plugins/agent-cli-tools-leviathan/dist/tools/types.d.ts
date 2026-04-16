import { z } from 'zod';
export declare const geminiArgsSchema: z.ZodObject<{
    prompt: z.ZodString;
    model: z.ZodDefault<z.ZodEnum<{
        "gemini-2.5-flash": "gemini-2.5-flash";
        "gemini-2.5-pro": "gemini-2.5-pro";
    }>>;
    sandbox: z.ZodDefault<z.ZodBoolean>;
    outputFormat: z.ZodDefault<z.ZodEnum<{
        json: "json";
        text: "text";
    }>>;
    timeout: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type GeminiArgs = z.infer<typeof geminiArgsSchema>;
export interface GeminiToolResult {
    success: boolean;
    response?: string | object;
    error?: {
        code: 'TIMEOUT' | 'CLI_ERROR' | 'PARSE_ERROR' | 'INVALID_ARGS' | 'INVOCATION_ERROR';
        message: string;
    };
    metadata: {
        model: string;
        tokensUsed?: number;
        reqCount: number;
        remaining: number;
    };
}
export declare const qwenArgsSchema: z.ZodObject<{
    prompt: z.ZodString;
    yolo: z.ZodDefault<z.ZodBoolean>;
    model: z.ZodDefault<z.ZodString>;
    outputFormat: z.ZodDefault<z.ZodEnum<{
        json: "json";
        text: "text";
    }>>;
    timeout: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type QwenArgs = z.infer<typeof qwenArgsSchema>;
export interface QwenToolResult {
    success: boolean;
    response?: string | object;
    error?: {
        code: 'TIMEOUT' | 'CLI_ERROR' | 'PARSE_ERROR' | 'INVALID_ARGS' | 'INVOCATION_ERROR';
        message: string;
    };
    metadata: {
        model: string;
        tokensUsed?: number;
        reqCount: number;
        remaining: number;
    };
}
//# sourceMappingURL=types.d.ts.map