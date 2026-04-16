/**
 * src/config/loader.ts
 * 
 * Configuration loader with environment variable resolution.
 * 
 * CUSTOMIZE: Change CONFIG_FILE_PATH to your plugin's config location.
 */

import { PluginConfigSchema, type PluginConfig } from './schema.js';
import { logger } from '../utils/logger.js';

const CONFIG_FILE_PATH = '/home/leviathan/.config/opencode/plugins/plugin-agent-config.json'; // CUSTOMIZE
const ENV_PREFIX = 'PLUGIN_AGENT_'; // CUSTOMIZE: Match your plugin name

let cachedConfig: PluginConfig | null = null;

export function loadConfig(): PluginConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Step 1: Try to load from config file
  let fileConfig: Record<string, unknown> = {};
  try {
    const fileContent = require('fs').readFileSync(CONFIG_FILE_PATH, 'utf-8');
    fileConfig = JSON.parse(fileContent);
    logger.debug('Loaded config from file', { path: CONFIG_FILE_PATH });
  } catch (err) {
    logger.debug('No config file found, using defaults', { path: CONFIG_FILE_PATH });
  }

  // Step 2: Merge with environment variables
  const envConfig = loadEnvConfig();

  // Step 3: Merge file config with env config (env takes precedence)
  const mergedConfig = {
    ...fileConfig.plugin ?? fileConfig,
    ...envConfig,
  };

  // Step 4: Validate and parse
  const result = PluginConfigSchema.safeParse(mergedConfig);
  if (!result.success) {
    logger.warn('Config validation failed, using defaults', {
      errors: result.error.issues.map(i => i.message),
    });
    cachedConfig = PluginConfigSchema.parse({}); // Return defaults
  } else {
    cachedConfig = result.data;
  }

  logger.info('Config loaded', { 
    enabled: cachedConfig.enabled,
    debug: cachedConfig.debug,
    hasStorage: !!cachedConfig.storage,
  });

  return cachedConfig;
}

function loadEnvConfig(): Partial<PluginConfig> {
  const config: Record<string, unknown> = {};

  // CUSTOMIZE: Add your own env var mappings
  if (process.env[`${ENV_PREFIX}ENABLED`]) {
    config.enabled = process.env[`${ENV_PREFIX}ENABLED`] === 'true';
  }
  if (process.env[`${ENV_PREFIX}DEBUG`]) {
    config.debug = process.env[`${ENV_PREFIX}DEBUG`] === 'true';
  }
  if (process.env[`${ENV_PREFIX}STORAGE_ENDPOINT`]) {
    config.storage = {
      ...(config.storage as Record<string, unknown> || {}),
      endpoint: process.env[`${ENV_PREFIX}STORAGE_ENDPOINT`],
    };
  }
  if (process.env[`${ENV_PREFIX}STORAGE_API_KEY`]) {
    config.storage = {
      ...(config.storage as Record<string, unknown> || {}),
      apiKey: process.env[`${ENV_PREFIX}STORAGE_API_KEY`],
    };
  }

  return config;
}

export function clearConfigCache(): void {
  cachedConfig = null;
}

export function getConfig(): PluginConfig {
  if (!cachedConfig) {
    return loadConfig();
  }
  return cachedConfig;
}
