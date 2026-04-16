/**
 * Response Formatter
 *
 * Formats OpenCode responses for Mattermost, handling markdown,
 * code blocks, and message chunking.
 */
export declare class ResponseFormatter {
    format(text: string): string;
    private formatCodeBlocks;
    private formatBold;
    private formatItalic;
    private formatLists;
    private formatHeaders;
    private formatLinks;
    chunk(text: string): string[];
    formatError(error: string): string;
    formatSuccess(message: string): string;
    formatCode(code: string, language?: string): string;
    formatInlineCode(code: string): string;
    escapeMattermostSpecial(text: string): string;
}
//# sourceMappingURL=response_formatter.d.ts.map