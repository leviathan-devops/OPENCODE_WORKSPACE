# OpenCode Design Philosophy

## Core Principles

### 1. Extensibility Through Plugins

OpenCode is built on the principle that the best software grows through community contributions and specialized extensions. Rather than baking in every feature, OpenCode provides a rich plugin API that allows developers to extend:

- **Tools**: New capabilities the agent can use
- **Hooks**: Interceptors for observing and modifying behavior
- **Agents**: Specialized AI personalities and behaviors

This philosophy means OpenCode can adapt to any domain or workflow without requiring core changes.

### 2. Security by Design

Every operation in OpenCode operates within a permission system. Plugins declare the permissions they need, and the system enforces those boundaries. This enables:

- Safe multi-agent collaboration
- Sandboxed execution environments
- Auditable access patterns

Security isn't an afterthought; it's woven into the architecture.

### 3. Provider Agnosticism

OpenCode treats AI providers as interchangeable backends. The same code can work with Anthropic, OpenAI, Ollama, or any other provider through a unified interface. This means:

- No vendor lock-in
- Freedom to choose models based on cost/performance
- Ability to switch providers based on requirements

### 4. Transparency and Control

Users should always understand what OpenCode is doing and have full control. This manifests as:

- Comprehensive logging of all operations
- Clear permission prompts
- Session history that can be audited and exported
- Configuration that is explicit and readable

### 5. Developer Ergonomics

Building on OpenCode should feel natural for developers:

- TypeScript-first with full type safety
- Standard npm packaging
- Familiar patterns (hooks, plugins, events)
- Excellent documentation

---

## Architectural Decisions

### Why Plugins Over Monolithic Features?

A monolithic approach forces choices about what belongs in core. Plugins allow:

- **Experimentation**: Try new ideas without risking core stability
- **Specialization**: Domain experts build for their specific needs
- **Velocity**: Independent release cycles for different features
- **Colloboration**: Multiple teams can work in parallel

### Why Permission-Based Security?

Traditional CLI tools have full system access. OpenCode's permission system enables:

- **Least Privilege**: Tools only get the access they need
- **Multi-Agent Safety**: Different agents can have different trust levels
- **Auditability**: Every access is logged and can be reviewed
- **Sandboxing**: Untrusted code can be run safely

### Why SQLite for Sessions?

Sessions store critical context that should be:

- **Reliable**: ACID transactions prevent corruption
- **Queryable**: SQL enables powerful analysis
- **Portable**: Single file can be moved between machines
- **Persistent**: Data survives restarts and reboots

### Why YAML Configuration?

YAML provides:

- **Human readability**: Easy to understand and edit
- **Structure**: Hierarchical config matches mental models
- **Portability**: Works across all platforms
- **Interpolation**: Environment variables and references

---

## Design Trade-offs

### Flexibility vs. Simplicity

OpenCode prioritizes flexibility over simplicity. A more complex system can do more, but requires more understanding. We mitigate this through:

- Sensible defaults that work out of the box
- Progressive disclosure of complexity
- Excellent documentation at all levels

### Extensibility vs. Stability

Plugin APIs evolve, but breaking changes hurt users. We handle this through:

- Semantic versioning with clear change logs
- Migration guides for major versions
- Long deprecation periods
- Compatibility layers where possible

### Power vs. Safety

More powerful systems can do more damage. We balance through:

- Permission systems that limit blast radius
- Explicit confirmations for dangerous operations
- Sandboxing options for untrusted code
- Clear warnings and undo capabilities

---

## Future Philosophy

OpenCode will continue to:

- **Embrace openness**: More interfaces, more extensibility
- **Strengthen security**: Better isolation, clearer permissions
- **Improve UX**: Make common tasks effortless
- **Enable collaboration**: Better multi-agent, team features
- **Maintain stability**: Respect existing investments
