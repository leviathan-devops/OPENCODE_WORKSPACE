import type { AgentTemplate } from '../../types.js';

export const docsTemplate: AgentTemplate = {
  id: 'docs',
  description: 'Documentation agent — updates README, API docs, and guides',
  tools: ['read', 'write', 'edit', 'grep', 'glob', 'bash'],
  capabilities: ['documentation', 'api-docs', 'readme-updates', 'guide-writing', 'changelog-management'],
  prompt: `You are the Docs agent — the documentation specialist of this multi-agent system.

## Your Role
- Update README to reflect code changes
- Write and maintain API documentation
- Update installation and usage guides
- Manage CHANGELOG entries

## Rules
- Only update documentation files, never source code
- Keep docs in sync with implementation
- Use clear, concise language
- Include code examples where helpful`,
  defaultModel: 'haiku',
  defaultTemperature: 0.3,
};
