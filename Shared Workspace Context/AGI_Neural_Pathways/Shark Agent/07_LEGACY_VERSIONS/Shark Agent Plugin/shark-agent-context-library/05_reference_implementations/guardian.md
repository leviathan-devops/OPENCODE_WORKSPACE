# Guardian Reference Implementation

From `shark-frankenstein/src/guardian/guardian.ts`.

## Full Implementation

```typescript
import { z } from 'zod';
import * as path from 'path';
import * as fs from 'fs';

// Zone definitions with patterns
const ZONE_PATTERNS = {
  WORKSPACE: [
    // Project workspace directories
  ],
  SANDBOX: [
    '/tmp/shark-sandbox/**',
  ],
  DEVELOPMENT: [
    '~/Projects/**',
    '~/code/**',
    '~/repos/**',
    '~/dev/**',
  ],
  PERSONAL: [
    '~/.ssh/**',
    '~/.aws/**',
    '~/.gcloud/**',
    '~/.env*',
    '~/.netrc',
    '~/.npmrc',
    '~/.git-credentials',
    '~/.config/gcloud/**',
  ],
  CONFIG: [
    '/etc/**',
    '/opt/**',
    '/var/lib/**',
    '/etc/nginx/**',
    '/etc/systemd/**',
  ],
  SYSTEM: [
    '/bin/**',
    '/sbin/**',
    '/usr/bin/**',
    '/usr/sbin/**',
    '/usr/local/bin/**',
    '/usr/local/sbin/**',
    '/proc/**',
    '/sys/**',
    '/dev/**',
  ],
};

type Zone = keyof typeof ZONE_PATTERNS;

type ProtectionLevel = 'STRICT' | 'BALANCED' | 'PERMISSIVE' | 'SANDBOX';

type Policy = 'ALLOW' | 'ALLOW_REDIRECT' | 'DENY';

const POLICY_MATRIX: Record<ProtectionLevel, Record<Zone, Policy>> = {
  STRICT: {
    WORKSPACE: 'ALLOW',
    SANDBOX: 'ALLOW',
    DEVELOPMENT: 'DENY',
    PERSONAL: 'DENY',
    CONFIG: 'DENY',
    SYSTEM: 'DENY',
  },
  BALANCED: {
    WORKSPACE: 'ALLOW',
    SANDBOX: 'ALLOW',
    DEVELOPMENT: 'ALLOW',
    PERSONAL: 'DENY',
    CONFIG: 'DENY',
    SYSTEM: 'DENY',
  },
  PERMISSIVE: {
    WORKSPACE: 'ALLOW',
    SANDBOX: 'ALLOW',
    DEVELOPMENT: 'ALLOW',
    PERSONAL: 'DENY',
    CONFIG: 'DENY',
    SYSTEM: 'DENY',
  },
  SANDBOX: {
    WORKSPACE: 'SANDBOX_REDIRECT',
    SANDBOX: 'ALLOW',
    DEVELOPMENT: 'SANDBOX_REDIRECT',
    PERSONAL: 'DENY',
    CONFIG: 'DENY',
    SYSTEM: 'DENY',
  },
};

// Dangerous command patterns
const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//,                          // rm -rf /
  /rm\s+-rf\s+\/\s+/,                       // rm -rf / /
  /chmod\s+-R\s+777\s+\//,                 // chmod -R 777 /
  />\s*\/etc\/passwd/,                      // > /etc/passwd
  /:\s*(\w+)\s*;?\s*rm\s+-rf/i,            // :();rm -rf
  /fork\s*\(\s*\)\s*;?\s*while\s*\(\s*1\s*\)/, // fork bomb pattern
  /dd\s+if\s*=?\s*\/dev\/zero\s+of\s*=\s*\/dev\/sda/, // Disk wipe
];

const GUARDIAN_VERSION = '1.0.0';

interface GuardianConfig {
  protectionLevel: ProtectionLevel;
  workspacePaths?: string[];
  sandboxDir?: string;
  auditLog?: string;
  enabled?: boolean;
}

interface AuditEntry {
  timestamp: number;
  tool: string;
  path?: string;
  command?: string;
  zone: Zone;
  decision: Policy;
  reason: string | null;
  protectionLevel: ProtectionLevel;
}

function normalizePath(p: string): string {
  return path.normalize(p).replace(/^~\//, process.env.HOME + '/');
}

function matchZone(filePath: string, workspacePaths: string[], sandboxDir: string): Zone {
  const normalized = normalizePath(filePath);

  // Check workspace paths first
  for (const wsPath of workspacePaths) {
    const normalizedWs = normalizePath(wsPath);
    if (normalized.startsWith(normalizedWs) || normalizedWs === normalized) {
      return 'WORKSPACE';
    }
  }

  // Check SANDBOX
  if (normalized.startsWith(sandboxDir)) return 'SANDBOX';

  // Check other zones
  for (const [zone, patterns] of Object.entries(ZONE_PATTERNS)) {
    if (zone === 'WORKSPACE') continue; // Already checked
    for (const pattern of patterns) {
      const normalizedPattern = normalizePath(pattern).replace('**', '');
      if (normalized.startsWith(normalizedPattern) || normalized === normalizedPattern) {
        return zone as Zone;
      }
    }
  }

  // Default to WORKSPACE if within a recognized project structure
  if (normalized.includes('/src/') || normalized.includes('/lib/') || normalized.includes('/tests/')) {
    return 'WORKSPACE';
  }

  return 'WORKSPACE'; // Conservative default
}

function classifyAndDecide(
  filePath: string,
  config: GuardianConfig,
): { zone: Zone; decision: Policy; reason: string | null } {
  const { protectionLevel, workspacePaths = [], sandboxDir = '/tmp/shark-sandbox' } = config;

  const zone = matchZone(filePath, workspacePaths, sandboxDir);
  const decision = POLICY_MATRIX[protectionLevel][zone];

  let reason: string | null = null;
  if (decision === 'DENY') {
    reason = `${zone} zone is protected at ${protectionLevel} level`;
  } else if (decision === 'SANDBOX_REDIRECT') {
    reason = `Redirecting ${zone} write to sandbox`;
  }

  return { zone, decision, reason };
}

export class Guardian {
  private config: Required<GuardianConfig>;
  private auditStream: fs.WriteStream | null = null;

  constructor(config: GuardianConfig) {
    this.config = {
      protectionLevel: config.protectionLevel ?? 'STRICT',
      workspacePaths: config.workspacePaths ?? [],
      sandboxDir: config.sandboxDir ?? '/tmp/shark-sandbox',
      auditLog: config.auditLog ?? '.shark/guardian-audit.jsonl',
      enabled: config.enabled ?? true,
    };

    // Ensure audit log directory exists
    if (this.config.auditLog) {
      const auditDir = path.dirname(this.config.auditLog);
      try {
        if (!fs.existsSync(auditDir)) {
          fs.mkdirSync(auditDir, { recursive: true });
        }
        this.auditStream = fs.createWriteStream(this.config.auditLog, { flags: 'a' });
      } catch {
        // Audit logging is best-effort
        this.auditStream = null;
      }
    }
  }

  checkWrite(filePath: string, tool: string = 'write_file'): { allowed: boolean; zone: Zone; redirect?: string; error?: string } {
    if (!this.config.enabled) {
      return { allowed: true, zone: 'WORKSPACE' };
    }

    const { zone, decision, reason } = classifyAndDecide(filePath, this.config);

    // Log the decision
    this.log({ tool, path: filePath, zone, decision, reason });

    if (decision === 'DENY') {
      return {
        allowed: false,
        zone,
        error: `Guardian: write to ${filePath} denied — ${reason}`,
      };
    }

    if (decision === 'SANDBOX_REDIRECT') {
      // Redirect to sandbox
      const relativePath = filePath.replace(/^[^\/]*\//, ''); // Strip leading ~ or /
      const sandboxPath = path.join(this.config.sandboxDir, relativePath);
      return {
        allowed: true,
        zone,
        redirect: sandboxPath,
      };
    }

    return { allowed: true, zone };
  }

  checkCommand(command: string): { allowed: boolean; zone: Zone; error?: string } {
    if (!this.config.enabled) {
      return { allowed: true, zone: 'WORKSPACE' };
    }

    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        const entry: AuditEntry = {
          timestamp: Date.now(),
          tool: 'terminal',
          command,
          zone: 'SYSTEM',
          decision: 'DENY',
          reason: 'Dangerous command pattern detected',
          protectionLevel: this.config.protectionLevel,
        };
        this.log(entry);
        return {
          allowed: false,
          zone: 'SYSTEM',
          error: `Guardian: dangerous command denied — pattern match: ${pattern.source}`,
        };
      }
    }

    return { allowed: true, zone: 'WORKSPACE' };
  }

  classify(filePath: string): Zone {
    const { zone } = classifyAndDecide(filePath, this.config);
    return zone;
  }

  getPolicy(filePath: string): Policy {
    const { decision } = classifyAndDecide(filePath, this.config);
    return decision;
  }

  getProtectionLevel(): ProtectionLevel {
    return this.config.protectionLevel;
  }

  setProtectionLevel(level: ProtectionLevel): void {
    this.config.protectionLevel = level;
  }

  private log(entry: AuditEntry): void {
    const line = JSON.stringify(entry) + '\n';
    if (this.auditStream) {
      this.auditStream.write(line);
    }
    // Also log to stderr in debug mode
    if (process.env.DEBUG?.includes('guardian')) {
      console.error('[Guardian]', line.trim());
    }
  }

  async close(): Promise<void> {
    if (this.auditStream) {
      await new Promise<void>((resolve) => {
        this.auditStream!.end(() => resolve());
      });
    }
  }
}
```

## Usage as Hook

```typescript
export function createGuardianGateHook(config: GuardianConfig) {
  const guardian = new Guardian(config);

  return async (
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<Record<string, unknown>> => {
    // Only run for Shark agents
    if (!isSharkAgent(context)) return input;

    // Get the path from the tool input
    const path = input.path as string | undefined;
    if (!path) return input; // No path = no check needed

    // Classify the path
    const zone = guardian.classify(path);
    const policy = guardian.getPolicy(path);

    if (policy === 'DENY') {
      throw new Error(
        `Guardian: ${path} is in ${zone} zone — DENY at ${guardian.getProtectionLevel()} level. ` +
        `Available zones: WORKSPACE (your project), SANDBOX (/tmp). ` +
        `Denied zones: PERSONAL (~/.ssh, ~/.aws, ~/.env), CONFIG (/etc), SYSTEM (/bin, /sbin).`,
      );
    }

    if (policy === 'SANDBOX_REDIRECT') {
      // Redirect path to sandbox
      const redirect = path.replace(/^[^\/]*\//, '/tmp/shark-sandbox/');
      input.path = redirect;
      // Log the redirect
    }

    return input;
  };
}
```
