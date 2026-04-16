/**
 * TRIDENT BRAIN - ALGORITHMIC PLUGIN
 *
 * Algorithmic-First Design:
 * - Model is ONLY for reading code (via fs operations)
 * - ALL intelligence is ALGORITHMIC (regex classifiers)
 * - NO behavioral prompts - pure pattern matching
 * - NO theatrical code - all patterns are BANNED and generate CRITICAL findings
 *
 * Natural language interface via chat.message hook.
 */
import type { PluginInput, Hooks } from '@opencode-ai/plugin';
export default function TridentBrainPlugin(input: PluginInput): Promise<Hooks>;
