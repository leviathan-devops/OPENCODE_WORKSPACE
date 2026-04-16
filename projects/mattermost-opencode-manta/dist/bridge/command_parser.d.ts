/**
 * Command Parser
 *
 * Parses @mention commands from Mattermost messages.
 */
export interface ParsedCommand {
    type: 'help' | 'status' | 'reset' | 'agent' | 'model' | 'chat' | 'code' | 'plan' | 'review' | 'unknown';
    args?: string;
    raw: string;
}
export declare class CommandParser {
    parse(message: string): ParsedCommand;
    extractMention(message: string): string | null;
    stripMention(message: string): string;
    isCommand(message: string): boolean;
}
//# sourceMappingURL=command_parser.d.ts.map