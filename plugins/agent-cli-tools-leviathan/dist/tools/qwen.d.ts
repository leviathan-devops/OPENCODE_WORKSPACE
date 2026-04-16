import { z } from 'zod';
export declare function createQwenTool(): {
    description: string;
    args: {
        prompt: z.ZodString;
        yolo: z.ZodDefault<z.ZodBoolean>;
        model: z.ZodDefault<z.ZodString>;
        outputFormat: z.ZodDefault<z.ZodEnum<{
            json: "json";
            text: "text";
        }>>;
        timeout: z.ZodDefault<z.ZodNumber>;
    };
    execute(args: {
        prompt: string;
        yolo: boolean;
        model: string;
        outputFormat: "json" | "text";
        timeout: number;
    }, context: import("@opencode-ai/plugin").ToolContext): Promise<string>;
};
//# sourceMappingURL=qwen.d.ts.map