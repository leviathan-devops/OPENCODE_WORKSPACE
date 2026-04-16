# DEPENDENCY MAP - Building Deep Planning Mode

## Component Dependencies

- Template Engine → Gate Validator (validation uses templates as schema)
- State Machine → Gate Validator (advance requires validation)
- Plugin Coordinator → State Machine (hooks query state)
- Build Scripts → Plugin Coordinator (deploy requires registered plugin)

## Data Flow

1. **Templates** define structure (input to everything)
2. **State Machine** tracks progress (queries templates for requirements)
3. **Gate Validator** checks output against templates
4. **Context Library** aggregates validated output
5. **Plugin Coordinator** exposes state to host

## Key Dependencies

| From | To | Nature |
|------|----|--------|
| Layer 1 | Layer 2 | Output becomes input |
| Layer 2 | Layer 3 | Components become context |
| Gate Validator | State Machine | Validation gates advancement |