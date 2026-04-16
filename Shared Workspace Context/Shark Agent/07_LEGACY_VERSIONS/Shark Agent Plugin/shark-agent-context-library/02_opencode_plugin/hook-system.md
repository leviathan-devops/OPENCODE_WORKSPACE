# OpenCode Hook System

## Hook Types

OpenCode supports several hook types registered via `api.registerHook(type, handler)`:

### Tool Execution Hooks

```typescript
// Before any tool executes
api.registerHook('tool.execute.before', (input, context) => {
  // Return modified input or throw to block
  return input;
});

// After any tool executes
api.registerHook('tool.execute.after', (input, output, context) => {
  // Return modified output or throw to log
  return output;
});

// Before a specific tool
api.registerHook('tool.execute.before:write_file', (input, context) => {
  // ...
});
```

### Chat Hooks

```typescript
// Transform system prompt
api.registerHook('experimental.chat.system.transform', (prompt, context) => {
  return modifiedPrompt;
});

// Transform all messages
api.registerHook('experimental.chat.messages.transform', (messages, context) => {
  return modifiedMessages;
});
```

### Tool Lifecycle Hooks

```typescript
// After tool schema validation
api.registerHook('tool.validate', (schema, toolName) => {
  return schema;
});

// After tool registers
api.registerHook('tool.registered', (definition) => {
  // ...
});
```

## Before Hook — Input Modification & Blocking

The `tool.execute.before` hook receives:
- `input`: The arguments passed to the tool
- `context`: The `ToolContext`

It can:
1. **Return input unchanged** — tool runs normally
2. **Return modified input** — tool runs with modified args
3. **Throw an error** — tool is blocked, error returned to agent

```typescript
api.registerHook('tool.execute.before', (input, context) => {
  // Block dangerous operations
  if (context.agent.id !== 'shark') return input;
  
  // Check path protection
  if (input.path && isProtectedPath(input.path)) {
    throw new Error(`Guardian: path ${input.path} is protected`);
  }
  
  return input;
});
```

## After Hook — Output Processing

The `tool.execute.after` hook receives:
- `input`: The original arguments
- `output`: The tool's return value (type depends on tool)
- `context`: The `ToolContext`

It can:
1. **Return output unchanged** — normal flow continues
2. **Return modified output** — replaces the tool's output
3. **Throw** — logs error but doesn't block (tool already completed)

```typescript
api.registerHook('tool.execute.after', (input, output, context) => {
  // After write_file, update manifest
  if (input.path?.startsWith('src/')) {
    updateBuildManifest(context.directory, input.path);
  }
  return output;
});
```

## Hook Ordering

Hooks execute in registration order. For `tool.execute.before`:
- Guardian (check paths) should be FIRST
- Phase gate (check state) should be SECOND
- TDD enforcer should be THIRD

```typescript
// Register in order of execution priority
api.registerHook('tool.execute.before', createGuardianGateHook());
api.registerHook('tool.execute.before', createPhaseGateHook());
api.registerHook('tool.execute.before', createTddEnforcerHook());
api.registerHook('tool.execute.before', createScopeGuardHook());
```

For `tool.execute.after`:
- Build manifest hook should be FIRST (to track file writes)
- Claim tracker should be SECOND (to update claim status)
- Anti-hallucination should be LAST (final output scan)

```typescript
api.registerHook('tool.execute.after', createBuildManifestHook());
api.registerHook('tool.execute.after', createClaimTrackerHook());
api.registerHook('tool.execute.after', createAntiHallucinationHook());
```

## Tool Schema

Tools are registered with a schema that OpenCode uses for validation:

```typescript
api.registerTool(
  {
    name: 'phase_status',
    description: 'Get current workflow phase',
    schema: {
      // JSON Schema — OpenCode validates args against this
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  async (args, context) => {
    // args is already validated
    return JSON.stringify(getPhaseStatus(context.directory));
  },
);
```

## Hook Signatures Reference

```typescript
// tool.execute.before
(input: Record<string, unknown>, context: ToolContext): Record<string, unknown> | void

// tool.execute.after
(input: Record<string, unknown>, output: unknown, context: ToolContext): unknown | void

// tool.execute.before:<toolName>
(input: Record<string, unknown>, context: ToolContext): Record<string, unknown> | void

// experimental.chat.system.transform
(prompt: string, context: ToolContext): string

// experimental.chat.messages.transform
(messages: ChatMessage[], context: ToolContext): ChatMessage[]
```

## Error Handling in Hooks

Hooks should NOT throw for expected conditions — use return values or conditional logic:

```typescript
// BAD: Throws for every non-src write in VERIFY phase
api.registerHook('tool.execute.before', (input, context) => {
  if (isVerifyPhase(context.directory) && input.path?.startsWith('src/')) {
    throw new Error('Cannot write to src/ during VERIFY');
  }
});

// GOOD: Block with conditional
api.registerHook('tool.execute.before', (input, context) => {
  if (!isSharkAgent(context)) return input; // Guard
  
  if (isVerifyPhase(context.directory)) {
    const path = input.path ?? '';
    const isSrcWrite = path.startsWith('src/') || path.includes('/src/');
    if (isSrcWrite && !input.justification) {
      throw new Error(
        `Guardian: write to ${path} blocked in VERIFY phase. ` +
        `Phase: ${getCurrentPhase(context.directory)}. ` +
        `Available actions: run_verification, read_file`
      );
    }
  }
  return input;
});
```
