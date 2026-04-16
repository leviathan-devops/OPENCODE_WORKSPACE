export interface CliResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    timedOut: boolean;
}
export declare function invokeCli(command: string, args: string[], options?: {
    timeout?: number;
    cwd?: string;
}): Promise<CliResult>;
export declare function buildGeminiArgs(args: {
    prompt: string;
    model?: string;
    sandbox?: boolean;
    outputFormat?: string;
}): string[];
export declare function buildQwenArgs(args: {
    prompt: string;
    yolo?: boolean;
    model?: string;
    outputFormat?: string;
}): string[];
//# sourceMappingURL=cli.d.ts.map