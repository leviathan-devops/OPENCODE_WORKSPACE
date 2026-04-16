/**
 * Session snapshot reader for Spider Agent plugin.
 * Reads .Spider/session/state.json and rehydrates spiderState on plugin init.
 */
import type { AgentSessionState } from '../state';
import type { SerializedAgentSession, SnapshotData } from './snapshot-writer';
/**
 * Transient session fields that must be reset on rehydration.
 * Centralised here to keep the reset logic DRY and auditable.
 */
export declare const TRANSIENT_SESSION_FIELDS: ReadonlyArray<{
    name: string;
    resetValue: unknown;
}>;
/**
 * Deserialize a SerializedAgentSession back to AgentSessionState.
 * Handles Map/Set conversion and migration safety defaults.
 */
export declare function deserializeAgentSession(s: SerializedAgentSession): AgentSessionState;
/**
 * Read the snapshot file from .Spider/session/state.json.
 * Returns null if file doesn't exist, parse fails, or version is wrong.
 * NEVER throws - always returns null on any error.
 */
export declare function readSnapshot(directory: string): Promise<SnapshotData | null>;
/**
 * Rehydrate spiderState from a SnapshotData object.
 * Clears existing maps first, then populates from snapshot.
 * Does NOT touch activeToolCalls or pendingEvents (remain at defaults).
 */
export declare function rehydrateState(snapshot: SnapshotData): Promise<void>;
/**
 * Load snapshot from disk and rehydrate spiderState.
 * Called on plugin init to restore state from previous session.
 * NEVER throws - swallows any errors silently.
 */
export declare function loadSnapshot(directory: string): Promise<void>;
