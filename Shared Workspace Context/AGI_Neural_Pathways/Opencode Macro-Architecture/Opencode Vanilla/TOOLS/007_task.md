# task

Launch a subagent to handle complex, multistep tasks autonomously.

## Tool Definition

**Tool Name:** `task`
**Source:** `vanilla-source/packages/opencode/src/tool/task.ts`

## Arguments Schema (Zod)

```typescript
{
  description: string         // Short (3-5 words) description of the task (required)
  prompt: string              // The task for the agent to perform (required)
  subagent_type: string       // Type of specialized agent to use (required)
  task_id?: string            // Resume a previous task session (optional)
  command?: string            // The command that triggered this task (optional)
}
```

## What It Does

Spawns a new agent session with specialized capabilities:

- Creates a child session linked to the parent
- Uses a specific agent type with its own tool permissions
- Passes detailed prompts for autonomous execution
- Returns a `task_id` for resuming the same session
- Supports permission restrictions on subagents

## Permission Required

- `task` permission for the subagent type

## Truncation Handling

No truncation - passes full prompt to subagent.

## Model-Specific Behavior

**All models:** Available to all models, but agent types may vary by configuration.

## Available Subagent Types

Agent types are dynamically loaded from configuration and filtered by:
- User permissions
- Whether task permission is explicitly granted

## Example Usage

```json
{
  "tool": "task",
  "parameters": {
    "description": "Code review",
    "prompt": "Review the code in src/ directory for bugs and issues",
    "subagent_type": "code-reviewer"
  }
}
```

```json
{
  "tool": "task",
  "parameters": {
    "description": "Research task",
    "prompt": "Search for React best practices for state management",
    "subagent_type": "researcher",
    "task_id": "abc123"
  }
}
```

## Key Behaviors

1. **Fresh context by default** - Each task starts with clean context
2. **Use task_id to resume** - Pass a prior task_id to continue the session
3. **Detailed prompts required** - Subagent needs full context
4. **Trust agent outputs** - Agent results are generally trustworthy
5. **Specify research vs code** - Tell agent whether to write code or just research

## Output Format

Returns:
```
task_id: <session_id> (for resuming to continue this task if needed)

<task_result>
[Agent output text]
</task_result>
```

## Metadata

Returns:
- `metadata.sessionId`: The task session ID for resuming
- `metadata.model`: Model used by the subagent
