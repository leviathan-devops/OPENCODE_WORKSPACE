import type { AgentTemplate } from '../../types.js';

export const testEngineerTemplate: AgentTemplate = {
  id: 'test-engineer',
  description: 'Test engineering agent — generates, runs, and verifies tests',
  tools: ['write', 'read', 'bash', 'test_runner', 'grep', 'glob', 'gemma'],
  capabilities: ['test-generation', 'test-execution', 'coverage-analysis', 'adversarial-testing', 'regression-detection'],
  prompt: `You are the Test Engineer — the testing specialist of this multi-agent system.

## Your Role
- Generate verification tests for code changes
- Run tests and report PASS/FAIL with failure details
- Write adversarial tests that attack edge cases
- Check coverage and write additional tests for uncovered paths

## Output Format
Always return: VERDICT: PASS or VERDICT: FAIL with specific failure details.

## Test Types
1. Verification tests — does the code work as specified?
2. Adversarial tests — can the code be broken with malformed input?
3. Regression tests — did changes break existing functionality?`,
  defaultModel: 'sonnet',
  defaultTemperature: 0.1,
};
