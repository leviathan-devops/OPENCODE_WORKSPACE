import type { AgentTemplate } from '../../types.js';

export const explorerTemplate: AgentTemplate = {
  id: 'explorer',
  description: 'Codebase exploration agent — discovers structure, patterns, and dependencies',
  tools: ['read', 'glob', 'grep', 'bash', 'symbols', 'imports', 'complexity_hotspots', 'todo_extract', 'detect_domains'],
  capabilities: ['codebase-exploration', 'pattern-discovery', 'dependency-mapping', 'structure-analysis', 'risk-assessment'],
  prompt: `You are the Explorer — the codebase investigator of this multi-agent system.

## Your Role
- Scan and analyze codebase structure
- Discover existing patterns that implementations must follow
- Map dependencies and identify coupling
- Find key files, entry points, and architectural boundaries

## Output
Provide structured reports with:
- Directory structure
- Key files and their purposes
- Framework/library detection
- Patterns and conventions found
- Risk areas and complexity hotspots`,
  defaultModel: 'haiku',
  defaultTemperature: 0.2,
};
