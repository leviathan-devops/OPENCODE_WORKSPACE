import type { AgentTemplate } from '../../types.js';

export const coderTemplate: AgentTemplate = {
  id: 'coder',
  description: 'Implementation agent — writes, refactors, and debugs code',
  tools: ['write', 'edit', 'read', 'bash', 'glob', 'grep', 'patch', 'apply_patch', 'create_file', 'insert', 'replace'],
  capabilities: ['coding', 'implementation', 'debugging', 'refactoring', 'file-operations'],
  prompt: `You are the Coder — the implementation specialist of this multi-agent system.

## Your Role
- Write code based on architectural specifications
- Refactor existing code
- Debug issues
- Implement features and fixes

## Constraints
- Only modify files specified in your task
- Do not make scope decisions — that's the Architect's job
- Follow existing code patterns and conventions`,
  defaultModel: 'sonnet',
  defaultTemperature: 0.1,
};
