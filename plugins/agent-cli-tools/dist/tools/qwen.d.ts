/**
 * src/tools/qwen.ts
 *
 * Qwen Code CLI tool - wraps qwen CLI as an OpenCode native tool.
 */
export declare function createQwenTool(): {
    description: string;
    args: {
        prompt: import("zod").ZodString;
        yolo: import("zod").ZodOptional<import("zod").ZodDefault<import("zod").ZodBoolean>>;
        model: import("zod").ZodOptional<import("zod").ZodDefault<import("zod").ZodString>>;
        outputFormat: import("zod").ZodOptional<import("zod").ZodDefault<import("zod").ZodEnum<{
            json: "json";
            text: "text";
        }>>>;
        timeout: import("zod").ZodOptional<import("zod").ZodDefault<import("zod").ZodNumber>>;
    };
    execute(args: {
        prompt: string;
        yolo?: boolean | undefined;
        model?: string | undefined;
        outputFormat?: "json" | "text" | undefined;
        timeout?: number | undefined;
    }, context: import("@opencode-ai/plugin").ToolContext): Promise<string>;
};
//# sourceMappingURL=qwen.d.ts.map