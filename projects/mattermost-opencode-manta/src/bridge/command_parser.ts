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

const COMMANDS: Record<string, ParsedCommand['type']> = {
  'help': 'help',
  'status': 'status',
  'reset': 'reset',
  'agent': 'agent',
  'model': 'model',
  'chat': 'chat',
  'code': 'code',
  'plan': 'plan',
  'review': 'review',
};

export class CommandParser {
  parse(message: string): ParsedCommand {
    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();

    if (lower === 'help' || lower === '@manta help' || lower === 'manta help') {
      return { type: 'help', raw: trimmed };
    }

    if (lower === 'status' || lower === '@manta status' || lower === 'manta status') {
      return { type: 'status', raw: trimmed };
    }

    if (lower === 'reset' || lower === '@manta reset' || lower === 'manta reset') {
      return { type: 'reset', raw: trimmed };
    }

    const subcommandMatch = lower.match(/^(?:@?\w+\s+)?(\w+)(?:\s+(.+))?$/);

    if (subcommandMatch) {
      const command = subcommandMatch[1];
      const args = subcommandMatch[2]?.trim();

      if (command === 'agent' && args) {
        return { type: 'agent', args, raw: trimmed };
      }

      if (command === 'model' && args) {
        return { type: 'model', args, raw: trimmed };
      }

      const cmdType = COMMANDS[command];
      if (cmdType) {
        return {
          type: cmdType,
          args,
          raw: trimmed,
        };
      }
    }

    return { type: 'chat', args: trimmed, raw: trimmed };
  }

  extractMention(message: string): string | null {
    const match = message.match(/@(\w+)/);
    return match ? match[1] : null;
  }

  stripMention(message: string): string {
    return message.replace(/@\w+\s*/g, '').trim();
  }

  isCommand(message: string): boolean {
    const lower = message.trim().toLowerCase();
    return lower.startsWith('help') ||
           lower.startsWith('status') ||
           lower.startsWith('reset') ||
           lower.startsWith('agent ') ||
           lower.startsWith('model ') ||
           lower.startsWith('code ') ||
           lower.startsWith('plan ') ||
           lower.startsWith('review ') ||
           lower.startsWith('chat ');
  }
}
