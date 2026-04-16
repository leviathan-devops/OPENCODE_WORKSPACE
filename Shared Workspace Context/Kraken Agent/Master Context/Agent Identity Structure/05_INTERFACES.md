# Interfaces — Agent Identity Structure

## External Interfaces

### 1. Plugin to OpenCode Interface

```typescript
// How the plugin registers with OpenCode
interface KrakenPlugin {
  name: 'kraken-agent';
  version: string;

  // Hooks for identity injection
  hooks: {
    'session.started': SessionStartedHook;
    'session.ended': SessionEndedHook;
    'tab.toggle': TabToggleHook;
    'compaction.before': CompactionHook;
    'compaction.after': CompactionHook;
  };
}

// Session started hook - primary injection point
interface SessionStartedHook {
  (session: Session): Promise<void>;
  // Loads identity files and injects into session context
}
```

---

### 2. Identity Loader Interface

```typescript
interface IdentityLoader {
  // Load all identity files for a role
  loadForRole(role: string): Promise<IdentityBundle>;

  // Load specific identity file
  loadFile(role: string, file: IdentityFileType): Promise<string>;

  // List available roles
  listRoles(): string[];

  // Check if role exists
  roleExists(role: string): boolean;
}

type IdentityFileType = 'SOUL.md' | 'IDENTITY.md' | 'EXECUTION.md' | 'SPIDER.md' | 'TOOLS.md';
```

---

### 3. Identity Injector Interface

```typescript
interface IdentityInjector {
  // Inject identity into session context
  inject(session: Session, bundle: IdentityBundle): Promise<void>;

  // Re-inject (for reinforcement)
  reinject(session: Session): Promise<void>;

  // Check if injection needed
  shouldInject(session: Session): boolean;
}
```

---

### 4. Model Router Interface

```typescript
interface ModelRouter {
  // Get model for role
  getModelForRole(role: string): string;

  // Get model configuration
  getModelConfig(role: string): ModelConfig;

  // List available models
  listModels(): Map<string, ModelConfig>;
}

interface ModelConfig {
  id: string;
  provider: string;
  contextWindow: number;
  capabilities: string[];
}
```

---

### 5. Identity Cache Interface

```typescript
interface IdentityCache {
  // Get cached identity
  get(role: string): IdentityBundle | null;

  // Cache identity
  set(role: string, bundle: IdentityBundle): void;

  // Invalidate cache
  invalidate(role: string): void;

  // Clear all cache
  clear(): void;

  // Get cache stats
  getStats(): CacheStats;
}

interface CacheStats {
  entries: number;
  hitCount: number;
  missCount: number;
  oldestEntry: string | null;
}
```

---

## Internal Interfaces

### 6. Identity Bundle (Internal)

```typescript
interface IdentityBundle {
  role: string;
  soul: SoulSection;
  identity: IdentitySection;
  execution?: ExecutionSection;
  spider: SpiderSection;
  tools?: ToolsSection;
  metadata: {
    loadedAt: string;
    version: string;
    sourceDir: string;
  };
}

interface SoulSection {
  directives: string[];
  philosophy: string;
  mantra: string;
  antiHallucinationProtocol?: string[];
}

interface IdentitySection {
  title: string;
  role: string;
  expertise: string[];
  workingStyle: string[];
  trackRecord: string[];
  modelAssignment?: string;
}

interface ExecutionSection {
  delegationPhilosophy: string;
  parallelPatterns: ParallelPattern[];
  delegationTriggers: DelegationTrigger[];
  escalationPath: string;
  neverDoDirectly: string[];
}

interface ParallelPattern {
  name: string;
  description: string;
  example: string;
}

interface DelegationTrigger {
  condition: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

interface SpiderSection {
  qualityGates: string[];
  antiHallucinationValidators: string[];
  debugProtocol: string[];
  stagnationDetection: StagnationRule[];
  guardianZones: GuardianZone[];
  evidenceHierarchy: EvidenceRule[];
}

interface StagnationRule {
  failures: number;
  action: string;
}

interface GuardianZone {
  path: string;
  permission: 'allowed' | 'conditional' | 'never';
  reason?: string;
}

interface EvidenceRule {
  level: 'strong' | 'weak' | 'unacceptable';
  examples: string[];
}

interface ToolsSection {
  openCode: ToolDefinition[];
  swarm: ToolDefinition[];
  cluster: ToolDefinition[];
  local?: ToolDefinition[];
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters?: string[];
}
```

---

### 7. Compaction Interface

```typescript
interface IdentityCompaction {
  // Serialize identity for compaction
  serialize(bundle: IdentityBundle): CompactionSnapshot;

  // Deserialize identity from compaction
  deserialize(snapshot: CompactionSnapshot): IdentityBundle;

  // Check if re-injection needed after recovery
  needsReinjection(snapshot: CompactionSnapshot): boolean;
}

interface CompactionSnapshot {
  role: string;
  soul: string;  // Full markdown
  identity: string;
  execution?: string;
  spider: string;
  tools?: string;
  timestamp: string;
  sessionId: string;
}
```

---

## Contract: SOUL.md Format

```typescript
// Contract for SOUL.md content
interface SoulContract {
  // File must start with title
  titlePattern: /^# SOUL\.md — .+$/m;

  // Must contain "You are a X agent" statement
  identityStatement: /You are a .+ agent\./;

  // Must contain Core Directives section
  coreDirectives: /## Core Directives/;

  // Must have at least 3 directives
  minDirectives: 3;

  // Must contain The Mantra
  mantraPattern: /## The Mantra/;
}
```

---

## Contract: IDENTITY.md Format

```typescript
// Contract for IDENTITY.md content
interface IdentityContract {
  // Must have Role section
  roleSection: /## Role/;

  // Must have Expertise section
  expertiseSection: /## Expertise/;

  // Must have Working Style section
  workingStyleSection: /## Working Style/;

  // Expertise must have at least 3 items
  minExpertise: 3;
}
```

---

## Contract: EXECUTION.md Format (Orchestrators)

```typescript
// Contract for EXECUTION.md (orchestrators only)
interface ExecutionContract {
  // Must have Delegation Philosophy
  delegationPhilosophy: /## Delegation Philosophy/;

  // Must have Delegation Triggers
  delegationTriggers: /## Delegation Triggers/;

  // Must have at least 3 triggers
  minTriggers: 3;

  // Should have Never Do Directly
  neverDoDirectly: /## Never Do Directly/;
}
```

---

## Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| `IDENTITY_FILE_NOT_FOUND` | Required identity file missing | Create file or check path |
| `IDENTITY_PARSE_ERROR` | File has invalid markdown | Fix markdown syntax |
| `IDENTITY_INCOMPLETE` | Missing required sections | Add missing sections |
| `INJECTION_FAILED` | Could not inject into context | Check hook registration |
| `CACHE_CORRUPT` | Cache returned invalid data | Clear cache, reload |
| `COMPACTION_FAILED` | Could not serialize identity | Check disk space |