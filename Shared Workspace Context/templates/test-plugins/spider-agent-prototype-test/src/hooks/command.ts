/**
 * src/hooks/command.ts
 * 
 * Slash command hook handler.
 */

import { safeHook } from './utils.js';
import { logger } from '../utils/logger.js';

type AnyHookHandler = (input: any, output: any) => Promise<void>;

export const commandHook: AnyHookHandler = safeHook(
  async (input: { command?: string; args?: string[]; sessionID?: string }, _output: unknown) => {
    if (!input.command || !input.sessionID) return;
    
    const commandName = input.command.toLowerCase().replace(/^\//, '');
    
    logger.debug('Command received', { command: commandName, args: input.args });
    
    switch (commandName) {
      case 'status':
        await handleStatusCommand(input);
        break;
      case 'help':
        await handleHelpCommand(input);
        break;
      default:
        logger.warn('Unknown command', { command: commandName });
    }
  },
  'command.execute.before'
);

async function handleStatusCommand(input: { command?: string; sessionID?: string }): Promise<void> {
  logger.info('Status command executed', { sessionID: input.sessionID });
}

async function handleHelpCommand(input: { command?: string; sessionID?: string }): Promise<void> {
  logger.info('Help command executed', { sessionID: input.sessionID });
}
