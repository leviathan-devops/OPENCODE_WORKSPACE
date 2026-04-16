/**
 * OpenCode Watchdog Plugin
 *
 * Monitors for:
 * 1. Runaway loops - processes with >90% CPU for >5 minutes
 * 2. Orphaned subagents - child processes of dead parents consuming resources
 *
 * Safe: Only kills processes matching criteria, leaves active sessions alone.
 */
import type { PluginInput, Hooks } from '@opencode-ai/plugin';
export default function OpenCodeWatchdog(_input: PluginInput): Promise<Hooks>;
//# sourceMappingURL=index.d.ts.map