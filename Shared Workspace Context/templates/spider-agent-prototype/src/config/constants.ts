/**
 * src/config/constants.ts
 * 
 * Magic numbers, thresholds, and cooldowns.
 * 
 * CUSTOMIZE: Tune these values for your use case.
 */

// Session tracking
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
export const MAX_MESSAGES_PER_SESSION = 10000;
export const MAX_TOOLS_PER_SESSION = 5000;

// Agent delegation
export const MAX_DELEGATION_DEPTH = 5;
export const DELEGATION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_CODER_REVISIONS = 5;

// Tool execution
export const TOOL_TIMEOUT_MS = 60 * 1000; // 1 minute
export const HEALTH_CHECK_INTERVAL_MS = 60 * 1000; // 1 minute
export const HEALTH_CHECK_TIMEOUT_MS = 5000; // 5 seconds

// Retry settings
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_INITIAL_DELAY_MS = 1000;
export const DEFAULT_MAX_DELAY_MS = 30000;
export const RETRY_BACKOFF_MULTIPLIER = 2;

// Storage
export const FALLBACK_DIR = '/home/leviathan/.local/share/plugin-agent'; // CUSTOMIZE
export const MAX_FALLBACK_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const FALLBACK_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// Logging
export const DEFAULT_LOG_LEVEL = 'info';
export const DEBUG_LOG_LEVEL = 'debug';

// Hook timing
export const HOOK_EXECUTION_TIMEOUT_MS = 5000; // 5 seconds max for hook execution
export const EARLY_RETURN_LOG_THRESHOLD_MS = 100; // Log if hook returns within this time

// State machine
export const PHASES = ['clarify', 'discover', 'plan', 'execute', 'phase-wrap'] as const;
export type Phase = typeof PHASES[number];
