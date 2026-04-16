import { createGeminiTool } from './gemini.js';
import { createQwenTool } from './qwen.js';
export { createGeminiTool, createQwenTool };
export declare function createToolRegistry(): {
    gemini: {
        description: string;
        args: {
            prompt: import("zod").ZodString;
            model: import("zod").ZodDefault<import("zod").ZodEnum<{
                "gemini-2.5-flash": "gemini-2.5-flash";
                "gemini-2.5-pro": "gemini-2.5-pro";
            }>>;
            sandbox: import("zod").ZodDefault<import("zod").ZodBoolean>;
            outputFormat: import("zod").ZodDefault<import("zod").ZodEnum<{
                json: "json";
                text: "text";
            }>>;
            timeout: import("zod").ZodDefault<import("zod").ZodNumber>;
        };
        execute(args: {
            prompt: string;
            model: "gemini-2.5-flash" | "gemini-2.5-pro";
            sandbox: boolean;
            outputFormat: "json" | "text";
            timeout: number;
        }, context: import("@opencode-ai/plugin").ToolContext): Promise<string>;
    };
    qwen: {
        description: string;
        args: {
            prompt: import("zod").ZodString;
            yolo: import("zod").ZodDefault<import("zod").ZodBoolean>;
            model: import("zod").ZodDefault<import("zod").ZodString>;
            outputFormat: import("zod").ZodDefault<import("zod").ZodEnum<{
                json: "json";
                text: "text";
            }>>;
            timeout: import("zod").ZodDefault<import("zod").ZodNumber>;
        };
        execute(args: {
            prompt: string;
            yolo: boolean;
            model: string;
            outputFormat: "json" | "text";
            timeout: number;
        }, context: import("@opencode-ai/plugin").ToolContext): Promise<string>;
    };
};
//# sourceMappingURL=index.d.ts.map