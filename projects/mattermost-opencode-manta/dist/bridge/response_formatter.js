/**
 * Response Formatter
 *
 * Formats OpenCode responses for Mattermost, handling markdown,
 * code blocks, and message chunking.
 */
const MAX_MESSAGE_LENGTH = 4000;
const CODE_BLOCK_PATTERN = /```(\w*)\n([\s\S]*?)```/g;
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;
const ITALIC_PATTERN = /\*([^*]+)\*/g;
export class ResponseFormatter {
    format(text) {
        let formatted = text;
        formatted = this.formatCodeBlocks(formatted);
        formatted = this.formatBold(formatted);
        formatted = this.formatItalic(formatted);
        formatted = this.formatLists(formatted);
        formatted = this.formatHeaders(formatted);
        formatted = this.formatLinks(formatted);
        return formatted.trim();
    }
    formatCodeBlocks(text) {
        return text.replace(CODE_BLOCK_PATTERN, (_match, lang, code) => {
            return `\`\`\`${lang}\n${code}\`\`\``;
        });
    }
    formatBold(text) {
        return text.replace(BOLD_PATTERN, '**$1**');
    }
    formatItalic(text) {
        return text.replace(ITALIC_PATTERN, '*$1*');
    }
    formatLists(text) {
        const lines = text.split('\n');
        const formatted = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
                formatted.push('• ' + trimmed.substring(2));
            }
            else if (/^\d+\.\s/.test(trimmed)) {
                formatted.push(trimmed);
            }
            else {
                formatted.push(line);
            }
        }
        return formatted.join('\n');
    }
    formatHeaders(text) {
        return text.replace(/^###\s+(.+)$/gm, '### $1')
            .replace(/^##\s+(.+)$/gm, '## $1')
            .replace(/^#\s+(.+)$/gm, '# $1');
    }
    formatLinks(text) {
        return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1]($2)');
    }
    chunk(text) {
        if (text.length <= MAX_MESSAGE_LENGTH) {
            return [text];
        }
        const chunks = [];
        const lines = text.split('\n');
        let currentChunk = '';
        let inCodeBlock = false;
        for (const line of lines) {
            if (line.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
            }
            const potentialChunk = currentChunk ? `${currentChunk}\n${line}` : line;
            if (potentialChunk.length > MAX_MESSAGE_LENGTH) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = line;
                }
                else {
                    chunks.push(line.substring(0, MAX_MESSAGE_LENGTH - 3) + '...');
                    currentChunk = '';
                }
            }
            else {
                currentChunk = potentialChunk;
            }
        }
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        return chunks;
    }
    formatError(error) {
        return `**Error:** ${this.format(error)}`;
    }
    formatSuccess(message) {
        return `**Success:** ${this.format(message)}`;
    }
    formatCode(code, language) {
        if (language) {
            return `\`\`\`${language}\n${code}\n\`\`\``;
        }
        return `\`\`\`\n${code}\n\`\`\``;
    }
    formatInlineCode(code) {
        return `\`${code}\``;
    }
    escapeMattermostSpecial(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}
//# sourceMappingURL=response_formatter.js.map