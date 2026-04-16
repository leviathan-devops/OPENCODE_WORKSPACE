# SHARK Architecture Documentation

## Overview
SHARK (Secure Hardware-Aware Runtime Kernel) is an architectural enforcement layer integrated into opencode that provides 9 firewalls against common AI agent failures.

## Firewall Architecture

### Firewalls 1-2: Guardian Protection
**Purpose**: Prevent writes to PERSONAL/SYSTEM paths
**Implementation**: `src/guardian/index.ts`
```typescript
classifyZone(filePath, workspacePath) → { zone: ZoneType, reason: string }
safeWrite(filePath, content, workspacePath) → GuardianResult
```
**Zones**:
- `WORKSPACE`: Allowed (within project)
- `SYSTEM`: Blocked (/etc, /bin, /usr, etc.)
- `PERSONAL`: Blocked (~/.ssh, ~/.aws, ~/.env, etc.)
- `DEVELOPMENT`: Allowed (general dev paths)

### Firewall 4: Mock Mode Detection
**Purpose**: Detect "I would run..." theatrical patterns
**Implementation**: `src/validation/mock-detector.ts`
```typescript
detectMockMode(content) → { isMock: boolean, reason?: string }
validateToolArgs(tool, args) → { isMock: boolean, reason?: string }
```
**Patterns**: `I would run`, `should work`, `in a real environment`, `mock mode`, etc.

### Firewall 5: Theatrical Code Detection
**Purpose**: Detect unused functions, excessive nesting
**Implementation**: `src/validation/theatrical-detector.ts`
```typescript
detectTheatricalCode(source) → { isTheatrical: boolean, issues: TheatricalCodeIssue[] }
```
**Checks**:
- Unused non-exported functions
- Nesting depth > 4 levels
- Unreachable code patterns

### Firewall 6: Style Guide Enforcement
**Purpose**: Enforce single-word naming convention
**Implementation**: `src/validation/style-enforcer.ts`
```typescript
validateCodeStyle(code) → { isValid: boolean, reason?: string }
```
**Rules**:
- Single-word identifiers only (max 2 words for technical terms)
- Technical terms allowed: `XMLHttpRequest`, `HTMLElement`, etc.
- No camelCase compounds when single word is clear

### Firewall 7: Repo Root Test Prevention
**Purpose**: Prevent `npm test` from repo root
**Implementation**: `src/validation/test-enforcer.ts`
```typescript
detectRepoRootTests(args) → { isRepoRoot: boolean, reason?: string }
```
**Patterns**: `npm test`, `yarn test`, `pnpm test`, `bun test`, `jest`, `vitest`, `mocha`

### Firewall 9: Documentation Validation
**Purpose**: Block theatrical documentation
**Implementation**: `src/validation/doc-validator.ts`
```typescript
validateDocumentation(content) → { isValid: boolean, issues: string[] }
```
**Patterns**: `this would work`, `in a real scenario`, `for demonstration purposes`, `TODO:`, `FIXME:`, `not yet implemented`

## Integration Points

### 1. Tool Execution Pipeline (`src/tool/tool.ts`)
```typescript
// Line 82-91: Added to Tool.define()
const enforcement = await enforceSharkArchitecture({
  tool: id,
  args,
  sessionID: ctx.sessionID,
  workspacePath: Instance.directory
}, getAuditLogger())

if (!enforcement.allowed) {
  throw new Error(`SHARK Firewall [${enforcement.firewall}]: ${enforcement.reason}`)
}
```

### 2. Central Orchestrator (`src/enforcement/enforcer.ts`)
```typescript
export async function enforceSharkArchitecture(
  params: EnforcementParams,
  logger: AuditLogger
): Promise<EnforcementResult>
```

### 3. Audit Logging (`src/enforcement/audit-logger.ts`)
```typescript
class AuditLogger {
  constructor(workspacePath: string)
  async log(entry: AuditEntry): Promise<void>
  getEntries(): AuditEntry[]
  async getEntriesFromFile(): Promise<AuditEntry[]>
}
```
**Log Location**: `.shark/audit.log` in workspace

## CLI Commands

### `shark` Command (`src/cli/cmd/shark.ts`)
```bash
# Show help
shark --help

# Run setup wizard
shark --wizard

# Test specific firewall (1-9)
shark --test-firewall 4

# Show audit log
shark --audit-log

# Enable/disable enforcement
shark --enable
shark --disable
```

### Integration with `opencode`
```bash
# Standard opencode with SHARK enforcement
opencode shark --enable
opencode run "write test file"

# Or use shark directly
shark --enable
```

## Data Flow

```
User Command → opencode CLI → Session Processor → Tool Execution
                                      ↓
                            enforceSharkArchitecture()
                                      ↓
                    ┌─────────────────────────────────┐
                    │        9 Firewalls              │
                    │ 1-2. Guardian (paths)          │
                    │ 4. Mock mode detection         │
                    │ 5. Theatrical code detection   │
                    │ 6. Style guide enforcement     │
                    │ 7. Repo root test prevention   │
                    │ 9. Documentation validation    │
                    └─────────────────────────────────┘
                                      ↓
                            { allowed: boolean, ... }
                                      ↓
                    ┌─────────────────────────────────┐
                    │ if (!allowed) → Error          │
                    │ if (allowed)  → Execute tool   │
                    └─────────────────────────────────┘
                                      ↓
                            AuditLogger.log(entry)
```

## Configuration

### Environment Variables
```bash
SHARK_DISABLED=1  # Disable all enforcement
OPENCODE_BIN_PATH=/path/to/binary  # Custom binary location
```

### Directory Structure
```
./
├── .shark/
│   ├── audit.log          # Audit entries
│   └── config.json        # Future configuration
├── src/
│   ├── enforcement/       # Central orchestrator
│   ├── guardian/         # Path protection
│   ├── validation/       # 5 validation modules
│   └── cli/cmd/shark.ts  # CLI command
└── test/enforcement/     # Test suite
```

## Testing Strategy

### Unit Tests
```bash
bun test test/enforcement/enforcer.test.ts
```

### Integration Tests
```bash
# Test each firewall
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 1
```

### Manual Tests
```bash
# Try to write to protected path (should block)
echo "test" | ./dist/opencode-linux-x64/bin/opencode run "write /etc/test"

# Try mock mode (should block)
echo "I would run npm install" | ./dist/opencode-linux-x64/bin/opencode run

# Check audit log
./dist/opencode-linux-x64/bin/opencode shark --audit-log
```

## Performance Considerations

### Optimizations
1. **Lazy initialization**: Audit logger created on first use
2. **Fast path checks**: Guardian checks before content analysis
3. **Content thresholds**: Theatrical detection only on >100 chars
4. **Cached results**: Zone classification caching (future)

### Monitoring
- Audit log size growth
- Tool execution latency
- Memory usage of validation modules

## Extension Points

### Adding New Firewalls
1. Create validation module in `src/validation/`
2. Add to `src/enforcement/enforcer.ts`
3. Update `SHARKCommand` test cases
4. Add unit tests

### Custom Rules
Future: Load rules from `.shark/config.json`
```json
{
  "firewalls": {
    "guardian": {
      "allowedPaths": ["/custom/path"],
      "blockedPaths": ["/another/path"]
    }
  }
}
```

## Security Notes

### Guardian Protection
- Blocks writes to `~/.ssh/`, `~/.aws/`, `~/.env*`
- Blocks reads from `SYSTEM` paths
- Uses platform-specific critical path lists

### Audit Log Security
- JSON format with timestamps
- No sensitive data in logs
- Local file storage only

### Fail-Safe Design
- Enforcement errors don't crash tool execution
- Audit logging continues even if file write fails
- Default to ALLOW if enforcement system fails