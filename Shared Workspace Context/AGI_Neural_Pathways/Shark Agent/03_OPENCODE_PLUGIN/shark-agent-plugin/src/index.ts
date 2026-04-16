import { tool, type Plugin, type PluginInput, type Hooks } from '@opencode-ai/plugin';
import { z } from 'zod';
import { SharkWizard } from './wizard';
import { SafetyStack } from './safety/safety-stack';
import { CoordinatorManager } from './coordinator/coordinator-manager';
import { SharkMode, SharkConfig } from './types/coordinator-types';

const SharkAgentPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  console.error('[SHARK] SharkAgentPlugin v4.8 initializing...');
  const wizard = new SharkWizard();
  const safety = new SafetyStack(input.directory, false);
  const coordinator = new CoordinatorManager({
    mode: null,
    workspacePath: input.directory,
    apiKeys: {
      deepseek: process.env.DEEPSEEK_API_KEY || '',
      glm: process.env.GLM_API_KEY || ''
    },
    options: {
      autoApprove: false,
      verbose: false,
      skipFirewalls: false,
      maxIterations: 10
    }
  });

  return {

    async 'chat.message'(eventInput: any, eventOutput: any): Promise<void> {
      if (wizard.shouldLaunch(eventInput.sessionID)) {
        const mode = await wizard.launch(eventInput.sessionID);
        const config: SharkConfig = {
          mode,
          workspacePath: input.directory,
          apiKeys: {
            deepseek: process.env.DEEPSEEK_API_KEY || '',
            glm: process.env.GLM_API_KEY || ''
          },
          options: {
            autoApprove: false,
            verbose: false,
            skipFirewalls: false,
            maxIterations: 10
          }
        };
        await initializeCoordinator(config);
      }
    },

    async 'tool.execute.before'(input: any, output: any): Promise<void> {
      const result = await safety.checkTool(input.tool, output.args, input.sessionID, input.agent);
      if (!result.allowed) {
        throw new Error(`Safety blocked: ${result.reason}`);
      }
    },

    async 'chat.params'(input: any, output: any): Promise<any> {
      return coordinator.adjustModelParams(input, output);
    },

    tool: {
      shark_toggle: tool({
        description: 'Toggle Shark Mode between Micro and Macro Engineer',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: {} as any,
        execute: async (args: any, context: any) => {
          const newMode = await coordinator.toggle();
          return `Switched to ${newMode === SharkMode.MICRO ? 'Micro' : 'Macro'} mode`;
        }
      })
    }
  };

  async function initializeCoordinator(config: SharkConfig): Promise<void> {
    await coordinator.initialize(config.mode, config.workspacePath);
  }
}

export default SharkAgentPlugin;
export { SharkAgentPlugin };
