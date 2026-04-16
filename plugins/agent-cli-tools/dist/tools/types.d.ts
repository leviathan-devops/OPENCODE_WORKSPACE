/**
 * src/tools/types.ts
 *
 * Zod schemas and TypeScript types for Gemini and Qwen CLI tools.
 */
import { z } from 'zod';
export declare const ERROR_CODES: {
    readonly TIMEOUT: "TIMEOUT";
    readonly CLI_ERROR: "CLI_ERROR";
    readonly PARSE_ERROR: "PARSE_ERROR";
    readonly INVALID_ARGS: "INVALID_ARGS";
    readonly INVOCATION_ERROR: "INVOCATION_ERROR";
};
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export declare const OutputFormatSchema: z.ZodEnum<{
    json: "json";
    text: "text";
}>;
export type OutputFormat = z.infer<typeof OutputFormatSchema>;
export declare const CliErrorSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
}, z.core.$strip>;
export type CliError = z.infer<typeof CliErrorSchema>;
export declare const CliMetadataSchema: z.ZodObject<{
    model: z.ZodString;
    tokensUsed: z.ZodOptional<z.ZodNumber>;
    reqCount: z.ZodOptional<z.ZodNumber>;
    remaining: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type CliMetadata = z.infer<typeof CliMetadataSchema>;
export declare const GeminiArgsSchema: z.ZodObject<{
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
export type GeminiArgs = z.infer<typeof GeminiArgsSchema>;
export declare const GeminiResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    response: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{}, z.core.$loose>]>>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>>;
    metadata: z.ZodObject<{
        model: z.ZodString;
        tokensUsed: z.ZodOptional<z.ZodNumber>;
        reqCount: z.ZodOptional<z.ZodNumber>;
        remaining: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type GeminiResult = z.infer<typeof GeminiResultSchema>;
export declare const QwenArgsSchema: z.ZodObject<{
    prompt: z.ZodString;
    yolo: z.ZodDefault<z.ZodBoolean>;
    model: z.ZodDefault<z.ZodString>;
    outputFormat: z.ZodDefault<z.ZodEnum<{
        json: "json";
        text: "text";
    }>>;
    timeout: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type QwenArgs = z.infer<typeof QwenArgsSchema>;
export declare const QwenResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    response: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{}, z.core.$loose>]>>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>>;
    metadata: z.ZodObject<{
        model: z.ZodString;
        tokensUsed: z.ZodOptional<z.ZodNumber>;
        reqCount: z.ZodOptional<z.ZodNumber>;
        remaining: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type QwenResult = z.infer<typeof QwenResultSchema>;
//# sourceMappingURL=types.d.ts.map