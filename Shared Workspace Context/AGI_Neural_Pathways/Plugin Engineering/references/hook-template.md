# Hook Template

Use this template when implementing a new hook.

---

## Template: Tool Before Hook

```typescript
import type { ToolHook, ToolBeforeInput, ToolBeforeOutput } from '@opencode-ai/plugin';

/**
 * create{ToolName}Hook
 * 
 * @see https://github.com/{org}/{repo}/blob/main/src/hooks/{hook-file}.ts
 */
export function create{ToolName}Hook(config: MyConfig, directory: string): { toolBefore: ToolHook } {
  return {
    toolBefore: async (
      input: ToolBeforeInput,
      output: ToolBeforeOutput
    ): Promise<void> => {
      // input.tool - tool name
      // input.sessionID - session identifier
      // output.args - tool arguments (CAN MODIFY)

      // Skip non-targeted tools
      if (input.tool !== 'TargetTool') {
        return;
      }

      // Validation logic
      const args = output.args as { targetPath?: string };
      if (!args.targetPath) {
        throw new Error('targetPath is required');
      }

      // Path traversal check
      if (args.targetPath.includes('..')) {
        throw new Error('Path traversal not allowed');
      }

      // Blocking logic
      if (shouldBlock(args.targetPath)) {
        throw new Error(`Not allowed to access: ${args.targetPath}`);
      }

      // Modification (optional)
      // output.args = { ...args, resolved: resolvePath(args.targetPath) };
    },
  };
}
```

---

## Template: Tool After Hook

```typescript
import type { ToolHook, ToolAfterInput, ToolAfterOutput } from '@opencode-ai/plugin';

/**
 * create{AfterHookName}Hook
 */
export function create{AfterHookName}Hook(directory: string): { toolAfter: ToolHook } {
  return {
    toolAfter: async (
      input: ToolAfterInput,
      output: ToolAfterOutput
    ): Promise<void> => {
      // input.tool - tool name
      // input.sessionID - session identifier
      // input.args - tool arguments
      // output.output - tool output (CAN READ, NOT MODIFY)
      // output.title - tool title

      // Skip non-targeted tools
      if (input.tool !== 'TargetTool') {
        return;
      }

      // Parse output
      let result: ToolResult;
      try {
        result = JSON.parse(output.output);
      } catch {
        // Not JSON output
        return;
      }

      // Process result
      if (result.success) {
        await persistEvidence(input.sessionID, result);
      }

      // Advisory only - do NOT throw
      if (result.warnings?.length > 0) {
        console.warn(`[hook] Warnings for ${input.tool}:`, result.warnings);
      }
    },
  };
}
```

---

## Template: System Transform Hook

```typescript
import type { SystemTransformHook } from '@opencode-ai/plugin';

export function create{SystemHook}Hook(directory: string): { 
  'experimental.chat.system.transform': SystemTransformHook 
} {
  return {
    'experimental.chat.system.transform': async (
      input: { sessionID?: string; model: Model },
      output: { system: string[] }
    ): Promise<void> => {
      // output.system - array of system prompt lines (CAN MODIFY)

      // Read state
      const state = await readState(directory);

      // Build enhancement
      const enhancement = buildEnhancement(state);

      // Inject into system prompt
      output.system.push(enhancement);
    },
  };
}
```

---

## Template: Messages Transform Hook

```typescript
import type { MessagesTransformHook } from '@opencode-ai/plugin';

export function create{MessagesHook}Hook(): {
  'experimental.chat.messages.transform': MessagesTransformHook
} {
  return {
    'experimental.chat.messages.transform': async (
      input: {},
      output: { messages: Array<{ info: Message; parts: Part[] }> }
    ): Promise<void> => {
      // output.messages - message array (CAN MODIFY)

      for (const msg of output.messages) {
        if (msg.info.role === 'user') {
          // Transform user message
        }
        if (msg.info.role === 'assistant') {
          // Transform assistant message
        }
      }
    },
  };
}
```

---

## Hook Input/Output Types

### ToolBeforeInput

```typescript
{
  tool: string;        // Tool name
  sessionID: string;
  callID: string;
}
```

### ToolBeforeOutput

```typescript
{
  args: any;           // Tool arguments - CAN MODIFY
}
```

### ToolAfterInput

```typescript
{
  tool: string;
  sessionID: string;
  callID: string;
  args: any;
}
```

### ToolAfterOutput

```typescript
{
  title: string;
  output: string;      // Tool output string
  metadata?: any;
}
```

---

## Common Patterns

### Pattern 1: Session State Access

```typescript
import { swarmState } from '../state';

export function createMyHook() {
  return {
    toolBefore: async (input, output) => {
      const session = swarmState.agentSessions.get(input.sessionID);
      if (!session) {
        throw new Error('Session not found');
      }
      // Access session.declaredCoderScope, etc.
    },
  };
}
```

### Pattern 2: State Directory Access

```typescript
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export function createMyHook(directory: string) {
  return {
    toolBefore: async (input, output) => {
      const statePath = path.join(directory, '.myplugin', 'state.json');
      const state = JSON.parse(await readFile(statePath, 'utf-8'));
      // Use state
    },
  };
}
```

### Pattern 3: Safe Hook Wrapper

```typescript
function safeHook<T extends (...args: any[]) => any>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      await fn(...args);
    } catch (error) {
      console.error('[hook error]', error);
      // Don't rethrow - keeps plugin running
    }
  }) as T;
}
```

---

## Validation Checklist

- [ ] Hook returns correct type (toolBefore, toolAfter, etc.)
- [ ] Does NOT throw in after hooks (use console.warn instead)
- [ ] DOES throw in before hooks to block
- [ ] Handles missing session state gracefully
- [ ] Uses safeHook wrapper for production
- [ ] Cleans up resources (file handles, timers)
- [ ] No sensitive data in error messages
