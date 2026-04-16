# TODO: Rename "architect" to "spider_architect" in spider-agent

## Background

The spider-agent plugin defines an "architect" agent which collides with the
"architect" agent in hermes-agent. This causes plugin hook conflicts where
context gets mixed between plugins.

## Required Actions

1. **Rename all "architect" references to "spider_architect"** in:
   - `src/agents/architect.ts` → rename to `src/agents/spider-architect.ts`
   - `src/config/constants.ts` - AGENT_TOOL_MAP['architect'] → AGENT_TOOL_MAP['spider_architect']
   - `src/config/constants.ts` - DEFAULT_AGENT_PROFILES.architect → DEFAULT_AGENT_PROFILES.spider_architect
   - All hook files that reference "architect" agent name
   - All prompt files referencing architect

2. **Update isSpiderSubAgent()** to include "spider_architect" in the spider agents list:
   ```typescript
   const spiderAgents = [
     "spider", "coder", "reviewer", "test_engineer",
     "explorer", "sme", "critic", "docs", "designer",
     "spider_architect"  // ADD THIS
   ];
   ```

3. **Update hook compatibility** - Ensure all hooks properly check `isSpiderSubAgent()` 
   before applying spider-specific logic. Hooks should NOT apply to vanilla agents
   (plan, build, general, explore) or agents from other plugins.

4. **Cross-plugin hook safety** - Add defensive checks in hooks that run on 
   `experimental.chat.system.transform` and similar global hooks. These hooks
   MUST verify the agent belongs to their plugin before modifying context.

## Verification

After renaming, run:
- Vanilla agents (plan, build, general, explore) should work without spider hooks
- hermes-agent "architect" should work without spider hooks  
- spider-agent "spider_architect" should work independently

## Priority: HIGH

This collision is blocking all OpenCode agents from functioning properly.
