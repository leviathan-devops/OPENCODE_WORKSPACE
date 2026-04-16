export enum ProtectionLevel {
  STRICT = 'strict',
  BALANCED = 'balanced',
  PERMISSIVE = 'permissive',
  SANDBOX = 'sandbox',
}

export enum ModificationDecision {
  ALLOW = 'allow',
  DENY = 'deny',
  BACKUP_THEN_ALLOW = 'backup_then_allow',
  SANDBOX_REDIRECT = 'sandbox_redirect',
}

export enum ZoneType {
  WORKSPACE = 'workspace',
  SANDBOX = 'sandbox',
  SYSTEM = 'system',
  PERSONAL = 'personal',
  DEVELOPMENT = 'development',
}

export interface SafetyCheck {
  blocked: boolean;
  reason?: string;
  warnings: string[];
}

export interface FirewallStats {
  totalChecks: number;
  blocked: number;
  warnings: number;
  allowed: number;
}

export interface StagnationStats {
  totalFailures: number;
  uniqueTools: number;
  recentAlerts: string[];
}

export interface GuardianConfig {
  enabled: boolean;
  level: ProtectionLevel;
  workspacePath: string;
  sandboxPath: string;
}

export default SafetyCheck;
