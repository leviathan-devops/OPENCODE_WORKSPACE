/**
 * src/services/external-api.ts
 * 
 * External API client with retry and fallback.
 */

import axios, { type AxiosInstance } from 'axios';
import { getConfig } from '../config/loader.js';
import { logger } from '../utils/logger.js';
import { withRetry, isRetryableError } from '../utils/retry.js';

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;

export interface ExternalApiClient {
  upload: (key: string, content: string) => Promise<{ ok: boolean; id?: string; error?: string }>;
  download: (key: string) => Promise<{ ok: boolean; content?: string; error?: string }>;
  search: (query: string, limit?: number) => Promise<{ ok: boolean; results?: unknown[]; error?: string }>;
  health: () => Promise<boolean>;
}

export function createExternalApiClient(): ExternalApiClient {
  const config = getConfig();
  const endpoint = config.storage?.endpoint ?? 'http://localhost:1933';
  const apiKey = config.storage?.apiKey;
  const timeout = config.storage?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = config.tools?.maxRetries ?? DEFAULT_MAX_RETRIES;

  const client: AxiosInstance = axios.create({
    baseURL: endpoint,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
    },
  });

  return {
    async upload(key: string, content: string) {
      return withRetry(async () => {
        const response = await client.post('/api/v1/resources', {
          name: key,
          content,
        });
        return { ok: true, id: response.data.id };
      }, {
        maxAttempts: maxRetries,
        retryCondition: isRetryableError,
      }).catch(err => {
        logger.error('Upload failed', { key, error: String(err) });
        return { ok: false, error: String(err) };
      }) as Promise<{ ok: boolean; id?: string; error?: string }>;
    },

    async download(key: string) {
      return withRetry(async () => {
        const response = await client.get(`/api/v1/resources/${key}`);
        return { ok: true, content: response.data.content };
      }, {
        maxAttempts: maxRetries,
        retryCondition: isRetryableError,
      }).catch(err => {
        logger.error('Download failed', { key, error: String(err) });
        return { ok: false, error: String(err) };
      }) as Promise<{ ok: boolean; content?: string; error?: string }>;
    },

    async search(query: string, limit = 10) {
      return withRetry(async () => {
        const response = await client.post('/api/v1/search/find', {
          query,
          limit,
        });
        return { ok: true, results: response.data.results };
      }, {
        maxAttempts: maxRetries,
        retryCondition: isRetryableError,
      }).catch(err => {
        logger.error('Search failed', { query, error: String(err) });
        return { ok: false, error: String(err) };
      }) as Promise<{ ok: boolean; results?: unknown[]; error?: string }>;
    },

    async health() {
      try {
        const response = await client.get('/health');
        return response.status === 200;
      } catch {
        return false;
      }
    },
  };
}
