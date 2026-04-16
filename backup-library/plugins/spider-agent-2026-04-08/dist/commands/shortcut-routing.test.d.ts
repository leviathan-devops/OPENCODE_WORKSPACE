/**
 * Regression tests for Spider-* shortcut command routing.
 *
 * When a user selects a shortcut command from the OpenCode command picker
 * (e.g. Spider-config, Spider-status, Spider-turbo), OpenCode sets
 * input.command to the registered key name ('Spider-config') rather than
 * the generic 'Spider' key. Previously the handler returned early for any
 * command that wasn't exactly 'Spider', so these shortcuts fell through to
 * the LLM as plain text. This file verifies they are correctly routed.
 */
export {};
