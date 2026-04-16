# question

Ask the user questions during execution to gather preferences or requirements.

## Tool Definition

**Tool Name:** `question`
**Source:** `vanilla-source/packages/opencode/src/tool/question.ts`

## Arguments Schema (Zod)

```typescript
{
  questions: array             // Array of question objects (required)
}
```

Each question object:
```typescript
{
  question: string             // The question to ask
  options?: array              // Answer options [{label: string, description?: string}]
  multiple?: boolean           // Allow multiple selections (default: false)
  custom?: boolean            // Enable "Type your own answer" option (default: true)
}
```

## What It Does

Interactive question tool that:

- Pauses execution to get user input
- Supports single and multiple choice questions
- Provides "Type your own answer" option (custom=true)
- Returns user answers as arrays
- Supports recommended options

## Permission Required

- `question` permission with pattern

## Truncation Handling

No truncation - passes full questions to user interface.

## Model-Specific Behavior

**App/CLI/Desktop only:** This tool is only available in interactive environments

## Example Usage

```json
{
  "tool": "question",
  "parameters": {
    "questions": [
      {
        "question": "Which framework should I use?",
        "options": [
          {"label": "React", "description": "A JavaScript library for building UIs"},
          {"label": "Vue", "description": "The progressive JavaScript framework"},
          {"label": "Angular", "description": "Platform for building mobile and desktop web apps"}
        ],
        "multiple": false,
        "custom": true
      }
    ]
  }
}
```

## Question Options

| Field | Type | Description |
|-------|------|-------------|
| `question` | string | The question text (required) |
| `options` | array | Answer options with label/description |
| `multiple` | boolean | Allow multiple selections (default: false) |
| `custom` | boolean | Enable custom answer input (default: true) |

## Key Behaviors

1. **Execution pauses** - Waits for user response before continuing
2. **Recommended first** - Put recommended option first with "(Recommended)" suffix
3. **No catch-all options** - Don't add "Other" with custom=true
4. **Custom by default** - "Type your own answer" added automatically
5. **Array answers** - Returns arrays, join with ", " for display

## Output Format

Returns:
- `title`: "Asked N question(s)"
- `output`: "User has answered your questions: "question"="answer", ..."
- `metadata.answers`: Array of answer arrays

## Question States

Answers are returned as arrays:
- Single select: `["option1"]`
- Multiple select: `["option1", "option2"]`
- Custom: `["custom answer text"]`
- Unanswered: Returns "Unanswered"
