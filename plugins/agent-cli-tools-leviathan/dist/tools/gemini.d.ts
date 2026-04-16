import { z } from 'zod';
export declare function createGeminiTool(): {
    description: string;
    args: {
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
    };
    execute(args: {
        prompt: string;
        model: "gemini-2.5-flash" | "gemini-2.5-pro";
        sandbox: boolean;
        outputFormat: "json" | "text";
        timeout: number;
    }, context: import("@opencode-ai/plugin").ToolContext): Promise<string>;
};
//# sourceMappingURL=gemini.d.ts.map