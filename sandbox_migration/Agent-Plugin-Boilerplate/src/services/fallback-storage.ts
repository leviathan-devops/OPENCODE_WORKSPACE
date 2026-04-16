/**
 * src/services/fallback-storage.ts
 * 
 * Dual-write storage with local disk fallback.
 * Key pattern from Hive Mind failure log - NEVER lose data.
 * 
 * CUSTOMIZE: Adapt file paths and storage structure.
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger.js';
import { FALLBACK_DIR, MAX_FALLBACK_FILE_SIZE } from '../config/constants.js';
import type { ExternalApiClient } from './external-api.js';

export interface WriteResult {
  ok: boolean;
  location: string;
  fallback: boolean;
  error?: string;
}

export class FallbackStorage {
  constructor(
    private primary: ExternalApiClient,
    private localDir: string = FALLBACK_DIR,
  ) {}

  async write(key: string, content: string): Promise<WriteResult> {
    // Validate content size
    if (content.length > MAX_FALLBACK_FILE_SIZE) {
      logger.warn('Content too large for fallback', { key, size: content.length });
      return { ok: false, location: '', fallback: false, error: 'Content too large' };
    }

    // Try primary storage first
    try {
      const result = await this.primary.upload(key, content);
      if (result.ok) {
        logger.debug('Primary storage write success', { key });
        return { ok: true, location: `primary:${key}`, fallback: false };
      }
    } catch (err) {
      logger.error('Primary storage write failed', { key, error: String(err) });
    }

    // Fallback to local disk
    return this.writeToLocal(key, content);
  }

  async read(key: string): Promise<{ ok: boolean; content?: string; source: 'primary' | 'fallback' | 'none'; error?: string }> {
    // Try primary first
    try {
      const result = await this.primary.download(key);
      if (result.ok && result.content) {
        return { ok: true, content: result.content, source: 'primary' };
      }
    } catch (err) {
      logger.debug('Primary read failed, trying fallback', { key });
    }

    // Try fallback
    const fallbackResult = await this.readFromLocal(key);
    if (fallbackResult.ok && fallbackResult.content) {
      return { ...fallbackResult, source: 'fallback' as const };
    }

    return { ok: false, source: 'none', error: 'Not found in primary or fallback' };
  }

  private async writeToLocal(key: string, content: string): Promise<WriteResult> {
    try {
      const localPath = this.getLocalPath(key);
      const dir = path.dirname(localPath);
      
      // Ensure directory exists
      fs.mkdirSync(dir, { recursive: true });
      
      // Write file atomically (write to temp, then rename)
      const tmpPath = `${localPath}.tmp`;
      fs.writeFileSync(tmpPath, content, 'utf-8');
      fs.renameSync(tmpPath, localPath);
      
      logger.info('Fallback storage write success', { key, location: localPath });
      return { ok: true, location: localPath, fallback: true };
    } catch (err) {
      const error = String(err);
      logger.error('Fallback storage write failed', { key, error });
      return { ok: false, location: '', fallback: true, error };
    }
  }

  private async readFromLocal(key: string): Promise<{ ok: boolean; content?: string; error?: string }> {
    try {
      const localPath = this.getLocalPath(key);
      if (!fs.existsSync(localPath)) {
        return { ok: false };
      }
      const content = fs.readFileSync(localPath, 'utf-8');
      return { ok: true, content };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }

  private getLocalPath(key: string): string {
    // Sanitize key to prevent path traversal
    const sanitized = key.replace(/\.\./g, '_').replace(/[<>:"|?*]/g, '_');
    return path.join(this.localDir, sanitized);
  }

  async cleanup(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    // Clean up fallback files older than maxAgeMs
    let cleaned = 0;
    const now = Date.now();

    try {
      if (!fs.existsSync(this.localDir)) return 0;

      const files = fs.readdirSync(this.localDir);
      for (const file of files) {
        const filePath = path.join(this.localDir, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      }
    } catch (err) {
      logger.warn('Fallback cleanup failed', { error: String(err) });
    }

    return cleaned;
  }
}
