/**
 * V4 Config Loader
 *
 * Loads architecture configuration from .ts or .json files.
 * Also re-exports V3 config loader functions for backward compatibility.
 */

import type { ArchitectureConfig } from '../factory/types.js';

// ============================================================
// V4 Architecture Config Loading
// ============================================================

export async function loadArchitectureConfig(path: string): Promise<ArchitectureConfig> {
  const fs = await import('fs/promises');
  const ext = path.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content) as ArchitectureConfig;
  }

  if (ext === 'ts' || ext === 'js' || ext === 'mjs') {
    const module = await import(path);

    const possibleExports = [
      'default',
      'config',
      'architectureConfig',
      'spiderConfig',
      'sharkConfig',
      'trioConfig',
    ];

    for (const key of possibleExports) {
      if (module[key] && typeof module[key] === 'object') {
        return module[key] as ArchitectureConfig;
      }
    }

    const exports = Object.values(module);
    const config = exports.find(
      (e) => typeof e === 'object' && e !== null && 'name' in e && 'brain' in e,
    );

    if (config) {
      return config as ArchitectureConfig;
    }

    throw new Error(
      `loadArchitectureConfig: no valid ArchitectureConfig found in module "${path}"`,
    );
  }

  throw new Error(
    `loadArchitectureConfig: unsupported file type "${ext}". Expected .ts, .js, .mjs, or .json`,
  );
}

export async function loadArchitectureWithFallback(
  pathOrName: string,
  builtInConfigs: Record<string, ArchitectureConfig>,
): Promise<ArchitectureConfig> {
  if (builtInConfigs[pathOrName]) {
    return builtInConfigs[pathOrName];
  }

  try {
    return await loadArchitectureConfig(pathOrName);
  } catch {
    throw new Error(
      `loadArchitectureWithFallback: "${pathOrName}" is not a built-in config name or a valid config file path. Available built-ins: ${Object.keys(builtInConfigs).join(', ')}`,
    );
  }
}

// ============================================================
// V3 Config Loader (backward compatibility for copied V3 code)
// ============================================================

import { PluginConfigSchema, type PluginConfig } from './schema.js';

const CONFIG_FILE_PATH = '/home/leviathan/.config/opencode/plugins/plugin-agent-config.json';
const ENV_PREFIX = 'PLUGIN_AGENT_';

let cachedConfig: PluginConfig | null = null;

export function loadConfig(): PluginConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  let fileConfig: Record<string, unknown> = {};
  try {
    const fileContent = require('fs').readFileSync(CONFIG_FILE_PATH, 'utf-8');
    fileConfig = JSON.parse(fileContent);
  } catch {
    // No config file found, using defaults
  }

  const envConfig = loadEnvConfig();

  const mergedConfig = {
    ...fileConfig.plugin ?? fileConfig,
    ...envConfig,
  };

  const result = PluginConfigSchema.safeParse(mergedConfig);
  if (!result.success) {
    cachedConfig = PluginConfigSchema.parse({});
  } else {
    cachedConfig = result.data;
  }

  return cachedConfig;
}

function loadEnvConfig(): Partial<PluginConfig> {
  const config: Record<string, unknown> = {};

  if (process.env[`${ENV_PREFIX}ENABLED`]) {
    config.enabled = process.env[`${ENV_PREFIX}ENABLED`] === 'true';
  }
  if (process.env[`${ENV_PREFIX}DEBUG`]) {
    config.debug = process.env[`${ENV_PREFIX}DEBUG`] === 'true';
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
