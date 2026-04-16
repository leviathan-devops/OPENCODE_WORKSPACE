/**
 * src/tools/health-check.ts
 * 
 * Health check tool - pre-flight connectivity verification.
 */

import { tool as toolFn } from '@opencode-ai/plugin';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { getConfig } from '../config/loader.js';
import { HEALTH_CHECK_TIMEOUT_MS } from '../config/constants.js';

interface HealthStatus {
  healthy: boolean;
  endpoint: string;
  latencyMs: number;
  timestamp: number;
  cached: boolean;
}

let cachedHealth: HealthStatus | null = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 30000;

export async function checkPrimaryStorageHealth(force = false): Promise<HealthStatus> {
  if (!force && cachedHealth && Date.now() - lastCheckTime < CACHE_TTL_MS) {
    return { ...cachedHealth, cached: true };
  }
  
  const config = getConfig();
  const endpoint = config.storage?.endpoint ?? 'http://localhost:1933';
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
    
    const response = await fetch(`${endpoint}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    const latencyMs = Date.now() - startTime;
    const healthy = response.ok;
    
    cachedHealth = { healthy, endpoint, latencyMs, timestamp: Date.now(), cached: false };
    lastCheckTime = Date.now();
    
    logger.debug('Health check result', { healthy, latencyMs, endpoint });
    
    return cachedHealth;
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    
    logger.warn('Health check failed', { endpoint, error: errorMsg });
    
    cachedHealth = { healthy: false, endpoint, latencyMs, timestamp: Date.now(), cached: false };
    lastCheckTime = Date.now();
    
    return cachedHealth;
  }
}

export function createHealthCheckTool() {
  return toolFn({
    description: 'Check if the plugin storage service is healthy',
    args: {
      force: z.boolean().optional(),
    },
    execute: async (args: { force?: boolean }) => {
      const force = args.force === true;
      const health = await checkPrimaryStorageHealth(force);
      
      const result = {
        status: health.healthy ? 'healthy' : 'unhealthy',
        endpoint: health.endpoint,
        latencyMs: health.latencyMs,
        cached: health.cached,
        timestamp: new Date(health.timestamp).toISOString(),
      };
      
      return JSON.stringify(result);
    },
  });
}
