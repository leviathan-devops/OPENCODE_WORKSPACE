# Testing Strategy — Agent Identity Structure

## Unit Tests

### Test: Identity Loader

```typescript
describe('IdentityLoader', () => {
  describe('loadForRole', () => {
    it('should load all identity files for valid role', async () => {
      const loader = new IdentityLoader('test-data/identity');
      const bundle = await loader.loadForRole('orchestrator');

      expect(bundle).toBeDefined();
      expect(bundle.role).toBe('orchestrator');
      expect(bundle.soul).toBeDefined();
      expect(bundle.identity).toBeDefined();
      expect(bundle.execution).toBeDefined();
      expect(bundle.spider).toBeDefined();
    });

    it('should throw for non-existent role', async () => {
      const loader = new IdentityLoader('test-data/identity');

      await expect(loader.loadForRole('nonexistent'))
        .rejects.toThrow('Role not found');
    });

    it('should handle missing optional files gracefully', async () => {
      const loader = new IdentityLoader('test-data/identity');
      const bundle = await loader.loadForRole('minimal');

      // TOOLS.md is optional
      expect(bundle.tools).toBeUndefined();
    });
  });

  describe('listRoles', () => {
    it('should return all available roles', async () => {
      const loader = new IdentityLoader('test-data/identity');
      const roles = await loader.listRoles();

      expect(roles).toContain('orchestrator');
      expect(roles).toContain('planning');
      expect(roles).toContain('execution');
    });
  });
});
```

### Test: SOUL.md Parser

```typescript
describe('SoulParser', () => {
  it('should parse valid SOUL.md', () => {
    const content = readFile('identity/orchestrator/SOUL.md');
    const soul = SoulParser.parse(content);

    expect(soul.directives).toHaveLength(5);
    expect(soul.mantra).toBeTruthy();
  });

  it('should reject SOUL.md missing identity statement', () => {
    const content = '# SOUL.md\n\nNo identity statement.';

    expect(() => SoulParser.parse(content))
      .toThrow('Missing identity statement');
  });

  it('should require minimum directives', () => {
    const content = `
# SOUL.md — Test

You are a test agent.

## Core Directives
1. Only one directive
`;

    expect(() => SoulParser.parse(content))
      .toThrow('Minimum 3 directives required');
  });
});
```

### Test: Identity Cache

```typescript
describe('IdentityCache', () => {
  let cache: IdentityCache;

  beforeEach(() => {
    cache = new IdentityCache();
  });

  it('should store and retrieve identity', () => {
    const bundle = createMockIdentityBundle('test');
    cache.set('test', bundle);

    expect(cache.get('test')).toEqual(bundle);
  });

  it('should return null for missing role', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('should invalidate cached entry', () => {
    cache.set('test', createMockIdentityBundle('test'));
    cache.invalidate('test');

    expect(cache.get('test')).toBeNull();
  });

  it('should clear all entries', () => {
    cache.set('test1', createMockIdentityBundle('test1'));
    cache.set('test2', createMockIdentityBundle('test2'));
    cache.clear();

    expect(cache.getStats().entries).toBe(0);
  });
});
```

---

## Integration Tests

### Test: Full Identity Injection Flow

```typescript
describe('Identity Injection Flow', () => {
  it('should inject identity on session start', async () => {
    // Setup
    const session = createMockSession();
    const loader = new IdentityLoader('test-data/identity');
    const injector = new IdentityInjector(loader);

    // Execute
    await injector.inject(session, 'orchestrator');

    // Verify
    expect(session.context.systemPrompt)
      .toContain('You ARE the Kraken orchestrator');
    expect(session.state.identity.injected).toBe(true);
  });

  it('should persist identity across compaction', async () => {
    // Setup
    const session = createMockSession();
    await injector.inject(session, 'orchestrator');

    // Simulate compaction
    const snapshot = serializeIdentity(session.state.identity);

    // Simulate recovery
    const recovered = deserializeIdentity(snapshot);
    session.state.identity = recovered;

    // Verify
    expect(session.state.identity.activeRole).toBe('orchestrator');
    expect(session.state.identity.injected).toBe(true);
  });
});
```

### Test: Sub-Agent Identity

```typescript
describe('Sub-Agent Identity', () => {
  it('should load correct identity when spawning sub-agent', async () => {
    const loader = new IdentityLoader('test-data/identity');
    const bundle = await loader.loadForRole('planning');

    expect(bundle.identity.role).toContain('Planning');
    expect(bundle.execution).toBeDefined();
  });
});
```

---

## Behavioral Tests

### Test: Orchestrator Delegates

```typescript
describe('Orchestrator Delegation Behavior', () => {
  it('should delegate when task requires 3+ files', async () => {
    const session = createSessionWithIdentity('orchestrator');
    const task = {
      description: 'Build user authentication system',
      files: ['auth.ts', 'login.ts', 'logout.ts', 'session.ts']
    };

    const result = await orchestrator.handleTask(task);

    expect(result.delegations).toHaveLength(1);
    expect(result.delegations[0].task).toBe('Build user authentication');
  });

  it('should NOT delegate for simple single-file task', async () => {
    const session = createSessionWithIdentity('orchestrator');
    const task = {
      description: 'Fix typo in README',
      files: ['README.md']
    };

    const result = await orchestrator.handleTask(task);

    // May or may not delegate - this is a judgment call
    // The key is it SHOULD consider delegation
    expect(result.consideredDelegation).toBe(true);
  });
});
```

---

## Identity Verification Tests

### Test: Identity Content Requirements

```typescript
describe('Identity Content Verification', () => {
  const requiredSoulElements = [
    'You are a',       // Identity statement
    'Core Directives',  // Section header
    'EXECUTE',          // Directive content
    'The Mantra'        // Required closing
  ];

  const requiredIdentityElements = [
    '## Role',
    '## Expertise',
    '## Working Style'
  ];

  it('all SOUL.md files should have required elements', async () => {
    const loader = new IdentityLoader('identity');
    const roles = await loader.listRoles();

    for (const role of roles) {
      const bundle = await loader.loadForRole(role);

      for (const element of requiredSoulElements) {
        expect(bundle.soul.raw).toContain(element);
      }
    }
  });

  it('all IDENTITY.md files should have required elements', async () => {
    const loader = new IdentityLoader('identity');
    const roles = await loader.listRoles();

    for (const role of roles) {
      const bundle = await loader.loadForRole(role);

      for (const element of requiredIdentityElements) {
        expect(bundle.identity.raw).toContain(element);
      }
    }
  });
});
```

---

## Test Fixtures

### Mock Identity Bundle

```typescript
function createMockIdentityBundle(role: string): IdentityBundle {
  return {
    role,
    soul: {
      directives: [
        'EXECUTE, don't simulate',
        'VERIFY everything',
        'FAIL FAST'
      ],
      philosophy: 'Test philosophy',
      mantra: 'Test mantra'
    },
    identity: {
      title: `Test ${role}`,
      role: `Test ${role} agent`,
      expertise: ['Testing', 'Verification'],
      workingStyle: ['One task at a time'],
      trackRecord: []
    },
    execution: {
      delegationPhilosophy: 'Delegate when appropriate',
      parallelPatterns: [],
      delegationTriggers: [],
      escalationPath: 'Escalate to lead',
      neverDoDirectly: []
    },
    spider: {
      qualityGates: [],
      antiHallucinationValidators: [],
      debugProtocol: [],
      stagnationDetection: [],
      guardianZones: [],
      evidenceHierarchy: []
    },
    metadata: {
      loadedAt: new Date().toISOString(),
      version: '1.0.0',
      sourceDir: `identity/${role}/`
    }
  };
}
```

---

## Test Coverage Goals

| Component | Coverage Target |
|-----------|----------------|
| IdentityLoader | 90% |
| IdentityInjector | 85% |
| IdentityCache | 95% |
| SOUL.md Parser | 90% |
| IDENTITY.md Parser | 85% |
| Compaction/Recovery | 80% |
| Fallback Logic | 70% |