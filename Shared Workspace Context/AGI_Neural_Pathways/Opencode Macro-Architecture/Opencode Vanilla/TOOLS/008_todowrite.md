# todowrite

Create and manage a structured task list for tracking coding session progress.

## Tool Definition

**Tool Name:** `todowrite`
**Source:** `vanilla-source/packages/opencode/src/tool/todo.ts`

## Arguments Schema (Zod)

```typescript
{
  todos: array                // Array of Todo objects (required)
}
```

Each Todo object contains:
```typescript
{
  status: "pending" | "in_progress" | "completed" | "cancelled"
  content: string             // Description of the task
  priority?: number           // Priority level
}
```

## What It Does

Manages a persistent todo list for the current session:

- Create, update, and delete todo items
- Track progress with status states
- Organize complex multistep tasks
- Mark items as pending, in_progress, completed, or cancelled

## Permission Required

- `todowrite` permission with pattern `*`

## Truncation Handling

No truncation - writes full todo list.

## Model-Specific Behavior

**All models:** Available to all models

## When to Use

**Use for:**
- Complex multistep tasks (3+ distinct steps)
- Non-trivial tasks requiring careful planning
- User explicitly requests a todo list
- User provides multiple tasks
- After completing a task, mark it complete and add follow-ups

**Don't use for:**
- Single, straightforward tasks
- Trivial tasks (< 3 steps)
- Purely conversational or informational requests

## Example Usage

```json
{
  "tool": "todowrite",
  "parameters": {
    "todos": [
      {"status": "in_progress", "content": "Create dark mode toggle component"},
      {"status": "pending", "content": "Add dark mode state management"},
      {"status": "pending", "content": "Implement CSS-in-JS styles for dark theme"},
      {"status": "pending", "content": "Run tests and build"}
    ]
  }
}
```

## Task States

| State | Meaning |
|-------|---------|
| `pending` | Task not yet started |
| `in_progress` | Currently working on (limit to ONE at a time) |
| `completed` | Task finished successfully |
| `cancelled` | Task no longer needed |

## Best Practices

1. Only ONE task should be `in_progress` at a time
2. Mark tasks complete IMMEDIATELY after finishing
3. Cancel tasks that become irrelevant
4. Break complex tasks into smaller steps
5. Update status in real-time as you work

## Output Format

Returns:
- `title`: Count of non-completed tasks (e.g., "3 todos")
- `output`: JSON representation of all todos
- `metadata.todos`: Full todo array
