# guardrails

**Type**: Tool Before + Tool After Hook
**Hook Key**: `toolBefore`, `toolAfter`
**Plugin**: Spider Agent
**Purpose**: Validate tool names, arguments, and outputs for blocked patterns

---

## Hook Signature

```typescript
type ToolBeforeHook = (input: ToolInput) => Promise<void>;
type ToolAfterHook = (input: ToolInput, output: ToolOutput) => Promise<void>;
```

---

## Trigger Conditions

| Hook | Fires When |
|------|------------|
| `toolBefore` | Before ANY tool executes |
| `toolAfter` | After EVERY tool completes |

---

## Before Hook (toolBefore)

### Validation Steps

1. **Tool Name Whitelist**
   - Compares tool name against configured whitelist
   - Blocked tools: `bash`, `write`, `edit`, `apply_patch`, `create_file` (unless explicitly allowed)
   - Throws if tool not in whitelist

2. **Argument Sanitization**
   - Scans arguments for adversarial patterns
   - Detects injection attempts in string args
   - Rejects malicious getter chains

3. **Blocked Pattern Detection**
   - Scans for known bad patterns in args
   - Path traversal attempts
   - Command injection patterns

### Throws Behavior

If validation fails, throws `ToolBlockedError`:
```
Tool 'bash' is not allowed. Add to whitelist to enable.
```

---

## After Hook (toolAfter)

### Validation Steps

1. **Output Pattern Scan**
   - Scans tool output for blocked content
   - Detects attempts to exfiltrate data via output
   - Checks for credential patterns in output

2. **Suspicious Activity Logging**
   - Logs if output contains unexpected patterns
   - Emits telemetry event for security review

### Advisory Behavior

Does NOT throw. Logs and emits advisory if concerns found.

---

## Configuration

```typescript
interface GuardrailsConfig {
  blockedTools: string[];
  allowedTools: string[];
  maxOutputSize: number;
  blockedPatterns: RegExp[];
}
```

---

## State Mutations

| Read | Write | Effect |
|------|-------|--------|
| Tool arguments | None | Validates before execution |
| Tool output | Telemetry | Logs suspicious activity |

---

## Source Reference

```typescript
export function createGuardrailsHooks(config: GuardrailsConfig) {
  return {
    toolBefore: async (input) => {
      validateToolName(input.tool);
      validateArgs(input.args);
    },
    toolAfter: async (input, output) => {
      scanOutput(output);
    }
  };
}
```

---

## Related Hooks

- `delegation-gate` — Validates delegation-specific constraints
- `scope-guard` — Validates file scope containment
- `slop-detector` — Detects low-quality code patterns
