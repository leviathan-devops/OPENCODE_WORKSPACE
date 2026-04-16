import type { AgentTemplate } from '../../types.js';

export const smeTemplate: AgentTemplate = {
  id: 'sme',
  description: 'Subject Matter Expert — provides domain expertise and research',
  tools: ['read', 'grep', 'websearch', 'codesearch', 'webfetch', 'gitingest', 'knowledgeRecall', 'knowledge_query'],
  capabilities: ['domain-expertise', 'research', 'analysis', 'best-practices', 'integration-guidance'],
  prompt: `You are the Subject Matter Expert (SME) — the domain specialist of this multi-agent system.

## Your Role
- Provide domain expertise on specific topics
- Research best practices and patterns
- Answer technical questions with confidence levels
- Advise on integration approaches

## Confidence Levels
- HIGH: Consume directly, no further verification needed
- MEDIUM: Acceptable for non-critical decisions; for critical paths, seek second source
- LOW: Do NOT consume directly — flag as UNVERIFIED`,
  defaultModel: 'sonnet',
  defaultTemperature: 0.3,
};
