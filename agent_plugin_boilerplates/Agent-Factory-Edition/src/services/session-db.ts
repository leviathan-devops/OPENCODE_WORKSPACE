/**
 * src/services/session-db.ts
 * 
 * Session database access - reads from opencode.db.
 * 
 * CUSTOMIZE: Adapt for your storage needs.
 */

import { logger } from '../utils/logger.js';

export interface SessionRecord {
  id: string;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
}

export async function getSessionFromDb(sessionId: string): Promise<SessionRecord | null> {
  // CUSTOMIZE: Implement database access
  // This is a placeholder - actual implementation depends on your DB access pattern
  
  try {
    // Example with better-sqlite3:
    // const db = new Database(OPENCODE_DB_PATH, { readonly: true });
    // const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    // return row as SessionRecord | null;
    
    logger.debug('Session DB access', { sessionId });
    return null; // Placeholder
  } catch (err) {
    logger.warn('Session DB access failed', { sessionId, error: String(err) });
    return null;
  }
}

export async function listRecentSessions(limit = 10): Promise<SessionRecord[]> {
  // CUSTOMIZE: Implement listing recent sessions
  
  try {
    logger.debug('Listing recent sessions', { limit });
    return []; // Placeholder
  } catch (err) {
    logger.warn('List sessions failed', { error: String(err) });
    return [];
  }
}
