/**
 * src/tools/index.ts
 *
 * Tool registry - exports all CLI tools.
 */
import { createGeminiTool } from './gemini.js';
import { createQwenTool } from './qwen.js';
export { createGeminiTool, createQwenTool };
export declare function createToolRegistry(): {
    gemini: {
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
    qwen: {
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
};
//# sourceMappingURL=index.d.ts.map