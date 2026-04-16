# Tool Template

Use this template when creating a new Spider Agent-style tool.

---

## Template

```typescript
import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';

/**
 * {TOOL_NAME}
 * 
 * {ONE LINE DESCRIPTION}
 * 
 * @see https://github.com/{org}/{repo}/blob/main/src/tools/{tool-name}.ts
 */
export const {tool_name} = tool({
  description: "{Description for LLM - what this tool does}",
  args: {
    // Required arguments
    {arg_name}: z.string().describe("{Description}"),

    // Optional arguments
    {opt_arg}: z.string().optional().describe("{Optional description}"),

    // Enum arguments
    {enum_arg}: z.enum(['option1', 'option2']).describe("{Enum description}"),
  },
  execute: async (
    args: { arg_name: string; opt_arg?: string; enum_arg?: 'option1' | 'option2' },
    context: ToolContext
  ): Promise<string> => {
    // Destructure for safety
    const { arg_name, opt_arg, enum_arg } = args;

    // Access context properties
    const { directory, sessionID, agent, worktree } = context;

    // Implementation
    try {
      const result = await doSomething(arg_name, { optional: opt_arg });

      return JSON.stringify({
        success: true,
        data: result,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
});
```

---

## ToolContext Properties

| Property | Type | Description |
|----------|------|-------------|
| `sessionID` | `string` | Current session identifier |
| `messageID` | `string` | Current message identifier |
| `agent` | `string` | Active agent name |
| `directory` | `string` | Working directory |
| `worktree` | `string` | Project root |
| `abort` | `AbortSignal` | Cancellation signal |
| `metadata` | `Record<string, unknown>` | Custom metadata |
| `ask` | `AskFunction` | Prompt user for input |

---

## Common Patterns

### Pattern 1: File-based State

```typescript
execute: async (args, context) => {
  const statePath = path.join(context.directory, '.myplugin', 'state.json');
  const state = JSON.parse(await readFile(statePath, 'utf-8'));
  
  // Modify state
  state[args.key] = args.value;
  
  // Persist
  await writeFile(statePath, JSON.stringify(state, null, 2));
  
  return JSON.stringify({ success: true });
}
```

### Pattern 2: Git Operations

```typescript
execute: async (args, context) => {
  const result = await Bun.spawn({
    cmd: ['git', 'diff', '--stat', 'HEAD'],
    cwd: context.directory,
  });
  
  const output = await new Response(result.stdout).text();
  return JSON.stringify({ diff: output });
}
```

### Pattern 3: Tool Composition

```typescript
execute: async (args, context) => {
  // Call other tools via context
  // Or delegate to subagent
  return JSON.stringify({ success: true });
}
```

---

## Validation Checklist

- [ ] Zod schema matches args destructuring
- [ ] Tool name is snake_case in code, referenced correctly
- [ ] Returns JSON string (always)
- [ ] Error handling with try/catch
- [ ] No sensitive data in error messages
- [ ] Path traversal checks on file operations
- [ ] Appropriate timeout for long operations
