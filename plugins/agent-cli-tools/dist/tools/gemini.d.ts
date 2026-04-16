/**
 * src/tools/gemini.ts
 *
 * Gemini CLI tool - wraps gemini CLI as an OpenCode native tool.
 */
export declare function createGeminiTool(): {
    description: string;
    args: {
        prompt: import("zod").ZodString;
        model: import("zod").ZodOptional<import("zod").ZodDefault<import("zod").ZodEnum<{
            "gemini-2.5-flash": "gemini-2.5-flash";
            "gemini-2.5-pro": "gemini-2.5-pro";
        }>>>;
        sandbox: import("zod").ZodOptional<import("zod").ZodDefault<import("zod").ZodBoolean>>;
        outputFormat: import("zod").ZodOptional<import("zod").ZodDefault<import("zod").ZodEnum<{
            json: "json";
            text: "text";
        }>>>;
        timeout: import("zod").ZodOptional<import("zod").ZodDefault<import("zod").ZodNumber>>;
    };
    execute(args: {
        prompt: string;
        model?: "gemini-2.5-flash" | "gemini-2.5-pro" | undefined;
        sandbox?: boolean | undefined;
        outputFormat?: "json" | "text" | undefined;
        timeout?: number | undefined;
    }, context: import("@opencode-ai/plugin").ToolContext): Promise<string>;
};
//# sourceMappingURL=gemini.d.ts.map