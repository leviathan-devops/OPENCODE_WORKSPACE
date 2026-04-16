# skill

Load specialized skills that provide domain-specific instructions and workflows.

## Tool Definition

**Tool Name:** `skill`
**Source:** `vanilla-source/packages/opencode/src/tool/skill.ts`

## Arguments Schema (Zod)

```typescript
{
  name: string                 // Name of the skill to load (required)
}
```

## What It Does

Loads specialized skill modules that provide:

- Domain-specific instructions
- Custom workflows
- Access to bundled resources (scripts, references, templates)
- Injected instructions into conversation context

## Permission Required

- `skill` permission with skill name pattern

## Truncation Handling

- Lists up to 10 sample files from skill directory
- Full skill content is loaded

## Model-Specific Behavior

**All models:** Available to all models

## Example Usage

```json
{
  "tool": "skill",
  "parameters": {
    "name": "react-developer"
  }
}
```

## Available Skills

Skills are dynamically loaded and may include:
- Language/framework-specific skills
- Tool-specific skills
- Domain-specific skills

## Key Behaviors

1. **Dynamic skill list** - Skills are loaded from configuration
2. **Error on missing** - Throws error with available skills if not found
3. **File sampling** - Lists up to 10 sample files from skill directory
4. **Base directory** - Provides base URL for relative paths in skill

## Output Format

Returns:
```
<skill_content name="skill-name">
# Skill: skill-name

[Skill content]

Base directory for this skill: file:///path/to/skill
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
[Sample files]
</skill_files>
</skill_content>
```

## Metadata

Returns:
- `metadata.name`: Skill name
- `metadata.dir`: Skill directory path
