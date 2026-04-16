# Error Handling — Agent Identity Structure

## Error Categories

### 1. File System Errors

| Error | Cause | Response |
|-------|-------|----------|
| `IDENTITY_DIR_NOT_FOUND` | `identity/` directory doesn't exist | Create directory structure, log warning |
| `IDENTITY_FILE_NOT_FOUND` | Specific file missing (e.g., SOUL.md) | Log error, attempt fallback identity |
| `PERMISSION_DENIED` | Cannot read identity files | Log error, abort injection |
| `FILE_CORRUPTED` | File read returns invalid content | Log error, attempt fallback |

### 2. Parse Errors

| Error | Cause | Response |
|-------|-------|----------|
| `SOUL_PARSE_ERROR` | SOUL.md doesn't match expected format | Log parse error, use minimal SOUL |
| `IDENTITY_PARSE_ERROR` | IDENTITY.md missing required sections | Log parse error, use minimal IDENTITY |
| `MARKDOWN_MALFORMED` | General markdown parsing failure | Attempt recovery, log warning |

### 3. Injection Errors

| Error | Cause | Response |
|-------|-------|----------|
| `INJECTION_FAILED` | Cannot inject into session context | Retry once, then fail gracefully |
| `CONTEXT_TOO_LARGE` | Identity makes context exceed limits | Truncate identity, prioritize SOUL |
| `HOOK_NOT_REGISTERED` | session.started hook not available | Log warning, identity not injected |

### 4. Cache Errors

| Error | Cause | Response |
|-------|-------|----------|
| `CACHE_MISS` | Requested role not in cache | Load from disk, cache result |
| `CACHE_CORRUPT` | Cached data invalid | Clear cache, reload |
| `CACHE_FULL` | Cache memory limit exceeded | Evict oldest entries |

### 5. Compaction Errors

| Error | Cause | Response |
|-------|-------|----------|
| `COMPACTION_SERIALIZE_FAIL` | Cannot serialize identity | Log error, skip identity in compaction |
| `COMPACTION_DESERIALIZE_FAIL` | Cannot restore from snapshot | Log error, fresh start with identity |
| `SNAPSHOT_CORRUPT` | Checksum mismatch on recovery | Log error, fresh start |

---

## Fallback Strategies

### Fallback Chain

```
┌─────────────────────────────────────────┐
│         TRY: Full Identity               │
│   (SOUL + IDENTITY + EXECUTION + SPIDER) │
└─────────────────┬───────────────────────┘
                  │ Fails
                  ▼
┌─────────────────────────────────────────┐
│      TRY: Core Identity                  │
│     (SOUL + IDENTITY + SPIDER)           │
└─────────────────┬───────────────────────┘
                  │ Fails
                  ▼
┌─────────────────────────────────────────┐
│         TRY: Minimal Identity            │
│           (SOUL.md only)                 │
└─────────────────┬───────────────────────┘
                  │ Fails
                  ▼
┌─────────────────────────────────────────┐
│    USE: Vanilla Agent (no identity)       │
│  (Log error, agent runs without identity) │
└─────────────────────────────────────────┘
```

### Minimal SOUL Fallback

If all identity loading fails, inject this minimal identity:

```markdown
## IDENTITY (FALLBACK)

You are a software engineering agent. Execute tasks assigned to you.
Verify your work before reporting completion.
```

---

## Error Recovery Procedures

### Recovery 1: Identity File Missing

```typescript
async function handleMissingIdentityFile(
  role: string,
  file: IdentityFileType
): Promise<void> {
  const roleDir = `identity/${role}/`;

  // Check if role directory exists
  if (!await dirExists(roleDir)) {
    // Create role directory
    await mkdir(roleDir);
    log.warn(`Created missing identity directory: ${roleDir}`);
  }

  // Check if file exists
  if (!await fileExists(`${roleDir}${file}`)) {
    if (file === 'SOUL.md') {
      // SOUL is critical - create from template
      await createFromTemplate(roleDir, 'SOUL.md', SOUL_TEMPLATE);
      log.warn(`Created missing SOUL.md for role: ${role}`);
    } else {
      // Non-critical files - log but continue
      log.warn(`Optional identity file missing: ${roleDir}${file}`);
    }
  }
}
```

### Recovery 2: Injection Failure

```typescript
async function handleInjectionFailure(
  session: Session,
  error: Error
): Promise<void> {
  log.error(`Identity injection failed: ${error.message}`);

  // Retry once after brief delay
  await sleep(100);

  try {
    await injectIdentity(session);
  } catch (retryError) {
    log.error(`Identity injection retry failed: ${retryError.message}`);

    // Fall back to vanilla agent
    log.warn('Proceeding without identity injection');
    session.state.identity.injected = false;
  }
}
```

### Recovery 3: Cache Corruption

```typescript
function handleCacheCorruption(role: string): void {
  log.warn(`Identity cache corrupted for role: ${role}`);

  // Invalidate corrupted entry
  identityCache.invalidate(role);

  // Reload from disk
  // (Next access will trigger reload)
}
```

---

## Error Monitoring

### Error Metrics

```typescript
interface IdentityMetrics {
  // Error counts by type
  errors: {
    fileNotFound: number;
    parseError: number;
    injectionFailed: number;
    cacheCorrupt: number;
    compactionFailed: number;
  };

  // Fallback usage
  fallbacks: {
    coreIdentity: number;
    minimalSoul: number;
    vanillaAgent: number;
  };

  // Success rate
  successRate: number;

  // Last error
  lastError: {
    type: string;
    message: string;
    timestamp: string;
  } | null;
}
```

### Error Logging Format

```typescript
function logIdentityError(
  error: IdentityError,
  context: { role?: string; sessionId?: string }
): void {
  log.error({
    type: error.type,
    message: error.message,
    role: context.role,
    sessionId: context.sessionId,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
}
```

---

## Graceful Degradation

### What Happens When Identity Fails

| Component | Degradation Behavior |
|-----------|---------------------|
| **SOUL.md missing** | Use minimal SOUL fallback |
| **IDENTITY.md missing** | Use role name only |
| **EXECUTION.md missing** | No delegation guidance (orchestrators less effective) |
| **SPIDER.md missing** | No quality gates (agent may skip verification) |
| **TOOLS.md missing** | Agent uses default tool assumptions |
| **All files missing** | Vanilla agent behavior |

### Monitoring Degraded State

```typescript
function isIdentityDegraded(): boolean {
  const state = session.state.identity;
  return !state.injected || state.fallbackUsed;
}

function getDegradationLevel(): 'none' | 'partial' | 'full' {
  const state = session.state.identity;

  if (!state.activeRole) return 'full';
  if (!state.injected) return 'partial';
  if (state.fallbackUsed) return 'partial';

  return 'none';
}
```

---

## Error Prevention

### Pre-flight Checks

Before session starts, validate identity system:

```typescript
async function preflightCheck(): Promise<PreflightResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check identity directory exists
  if (!await dirExists('identity/')) {
    errors.push('identity/ directory not found');
    return { pass: false, errors, warnings };
  }

  // Check each required role
  for (const role of ['orchestrator', 'planning', 'execution', 'system']) {
    const roleDir = `identity/${role}/`;

    if (!await dirExists(roleDir)) {
      warnings.push(`Role directory missing: ${role}`);
      continue;
    }

    // Check SOUL.md exists (critical)
    if (!await fileExists(`${roleDir}SOUL.md`)) {
      errors.push(`SOUL.md missing for role: ${role}`);
    }

    // Check IDENTITY.md exists (critical)
    if (!await fileExists(`${roleDir}IDENTITY.md`)) {
      warnings.push(`IDENTITY.md missing for role: ${role}`);
    }
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings
  };
}
```