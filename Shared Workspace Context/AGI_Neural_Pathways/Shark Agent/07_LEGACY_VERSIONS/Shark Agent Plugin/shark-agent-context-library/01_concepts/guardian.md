# Guardian — Zone-Based Path Protection

## Purpose

Guardian is Shark's file system firewall. It classifies every file operation by **zone** and enforces a **policy** before the operation executes. It runs as the **first** `tool.execute.before` hook, before any other hook or tool logic.

## Zone Classification

Each path in the system belongs to exactly one zone:

| Zone | Patterns | Default Policy | Override |
|------|----------|---------------|---------|
| WORKSPACE | Project dir + subdirs | ALLOW | None |
| SANDBOX | `/tmp/shark-sandbox/*` | ALLOW | SANDBOX_REDIRECT |
| DEVELOPMENT | `~/Projects/`, `~/code/`, `~/repos/` | ALLOW (BALANCED) | STRICT/PERMISSIVE |
| PERSONAL | `~/.ssh/`, `~/.aws/`, `~/.gcloud/`, `~/.env*` | DENY | None |
| CONFIG | `/etc/`, systemd units | DENY | None |
| SYSTEM | `/bin/`, `/sbin/`, `/usr/bin/`, `/proc/`, `/sys/` | DENY (absolute) | None |

### Policy Levels

| Level | Workspace | Dev Dirs | Personal | Config | System |
|-------|-----------|----------|----------|--------|--------|
| STRICT | ✓ Write | ✗ | ✗ | ✗ | ✗ |
| BALANCED | ✓ Write | ✓ Write | ✗ | ✗ | ✗ |
| PERMISSIVE | ✓ Write | ✓ Write | ✗ | ✗ | ✗ |
| SANDBOX | ✓ Write | ✗ | ✗ | ✗ | ✗ (all → sandbox) |

## How Guardian Works

1. **Classify**: Take the path from the tool call (`write_file`, `patch`, `terminal`)
2. **Match zone**: Find the zone using pattern matching
3. **Check policy**: Look up the zone's policy for the current protection level
4. **Enforce**:
   - `ALLOW` → pass through
   - `ALLOW_REDIRECT` → pass through but log redirect
   - `DENY` → block with error message explaining why
   - `SANDBOX_REDIRECT` → rewrite path to `/tmp/shark-sandbox/` + original subpath

## Protected Operations

Guardian intercepts these operations:

| Tool | Patterns Checked |
|------|----------------|
| `write_file` | Destination path |
| `patch` | Destination path |
| `terminal` | `rm -rf`, `mv` to personal dirs, `cp` to config dirs |
| `read_file` | Path (warn only, don't block) |

## Audit Log

Every Guardian decision is logged to `.shark/guardian-audit.jsonl`:

```jsonl
{"timestamp":1743773452,"tool":"write_file","path":"/home/user/.ssh/id_rsa","zone":"PERSONAL","decision":"DENY","reason":"Personal SSH directory","protectionLevel":"STRICT"}
{"timestamp":1743773453,"tool":"write_file","path":"/home/user/project/src/auth.ts","zone":"WORKSPACE","decision":"ALLOW","reason":null,"protectionLevel":"STRICT"}
{"timestamp":1743773454,"tool":"terminal","command":"rm -rf /etc/nginx","zone":"CONFIG","decision":"DENY","reason":"System config directory","protectionLevel":"STRICT"}
```

## Hook Integration

Guardian runs as `createGuardianGateHook()` in the `tool.execute.before` hook chain. It must be **first** — before `phaseGateHook`, `tddEnforcerHook`, or any other hook that might write files.

```typescript
// hooks/tool.execute.before (ordered)
export const toolExecuteBeforeHooks = [
  createGuardianGateHook({ protectionLevel: 'STRICT' }),   // ← FIRST
  createPhaseGateHook(),                                     // ← SECOND
  createTddEnforcerHook(),
  createScopeGuardHook(),
  // ... other hooks
];
```

## Configuration

Guardian is configured in `shark-config.ts`:

```typescript
guardian: {
  protectionLevel: 'STRICT',  // STRICT | BALANCED | PERMISSIVE | SANDBOX
  workspacePaths: [
    '~/Projects/*',
    '~/code/*',
  ],
  sandboxDir: '/tmp/shark-sandbox',
  auditLog: '.shark/guardian-audit.jsonl',
}
```

## Key Implementation Notes

1. **Path normalization**: Use `path.normalize()` before classification to prevent path traversal attacks (`../../../etc/passwd`)
2. **Workspace is always allowed**: The project directory (`context.directory`) is always in the WORKSPACE zone
3. **DENY is final**: A DENY decision cannot be overridden by any other hook or tool
4. **Terminal commands**: Guardian also intercepts `terminal` and checks the command string for dangerous patterns (`rm -rf /`, format string attacks)
