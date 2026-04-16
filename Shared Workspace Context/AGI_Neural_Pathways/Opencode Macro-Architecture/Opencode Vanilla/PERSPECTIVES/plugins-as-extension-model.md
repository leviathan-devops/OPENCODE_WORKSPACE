# Why Plugins Are the Extension Model

## The Case for Plugins

### vs. Built-in Features

**Built-in approach problems:**
- Feature bloat in core
- Slower development velocity
- Single team bottleneck
- One-size-fits-all mentality
- Hard to customize or remove features

**Plugin approach benefits:**
- Core stays lean and focused
- Fast innovation through independence
- Community contributions
- Users pick what they need
- Easy to add or remove features

### vs. Scripting/Macros

Scripts are powerful but:
- No type safety
- No structured API
- Hard to share/distribute
- Limited to existing interfaces
- No isolation

Plugins provide:
- Full TypeScript/JavaScript
- Structured plugin API
- npm distribution
- Sandboxed execution
- Rich capabilities

### vs. Forking

Forking the codebase:
- Diverges from upstream
- Maintenance burden
- No community benefits
- Hard to merge improvements

Plugins allow:
- Stay with upstream
- Contribute back
- Benefit from community
- Automatic updates

---

## Plugin Architecture Benefits

### 1. Capability Expansion

Plugins can add entirely new capabilities:

```typescript
// A plugin can add tools
class DatabasePlugin implements Plugin {
  getTools() {
    return [
      {
        name: 'sql-query',
        execute: async (input) => { /* query database */ }
      }
    ];
  }
}
```

### 2. Behavior Modification

Hooks allow modifying behavior without core changes:

```typescript
// Intercept and modify tool calls
class AuditHook implements Hook {
  name = 'after-tool-call';
  async handle(payload) {
    await logToAudit(payload);
    return payload;
  }
}
```

### 3. Domain Specialization

Different domains can have tailored solutions:

- **Web dev plugins**: Framework-specific tools
- **Data plugins**: Database and ETL tools
- **ML plugins**: Model training and inference
- **DevOps plugins**: Deployment and monitoring

### 4. Graduated Trust

Users choose plugins based on trust:

```
Level 1: Built-in tools (fully trusted)
Level 2: Verified plugins (community reviewed)
Level 3: Published plugins (npm packages)
Level 4: Local plugins (self-written)
Level 5: Untrusted sources (sandboxed)
```

---

## Distribution Advantages

### npm Ecosystem

Plugins leverage npm:
- Familiar tooling
- Version management
- Dependency resolution
- Quality signals (stars, downloads)
- Security scanning

### Multiple Distribution Channels

```
# npm (public registry)
npm install opencode-plugin-xyz

# Private registry
npm install @company/plugin --registry=https://npm.internal

# Local file
npm install ./path/to/plugin

# Git
npm install github:user/repo
```

### Easy Updates

```bash
# Update single plugin
opencode plugins update opencode-plugin-xyz

# Update all
opencode plugins update --all

# Automatic via npm
npm audit fix
```

---

## Developer Experience

### Quick to Build

```bash
# Scaffold new plugin
npm create opencode-plugin

# Standard TypeScript project
# Built-in hot reload
# Template code included
```

### Full IDE Support

- TypeScript definitions included
- Auto-complete for plugin API
- Inline documentation
- Jump to definition

### Testing Support

```typescript
// test/plugin.test.ts
import { test, expect } from 'vitest';
import { MyPlugin } from '../src';

test('tool registration', async () => {
  const plugin = new MyPlugin();
  await plugin.initialize();
  expect(plugin.getTools()).toHaveLength(3);
});
```

---

## Security Model

### Declared Permissions

Plugins declare what they need:

```json
{
  "opencode": {
    "plugins": [{
      "name": "my-plugin",
      "permissions": ["filesystem:read", "network:http"]
    }]
  }
}
```

### Enforcement

The runtime enforces declared permissions:
- Filesystem access restricted
- Network access limited
- Dangerous operations blocked
- All access logged

### User Control

Users can:
- Review permissions before install
- Reject plugins that request too much
- Use sandbox mode for untrusted plugins
- Audit logs to see what ran

---

## Future Extensibility

The plugin model allows OpenCode to grow:

- New hook types
- New tool capabilities
- New agent types
- New permission categories
- New distribution mechanisms

All without core changes.

---

## Comparison Summary

| Aspect | Built-in | Scripts | Forking | Plugins |
|--------|----------|---------|---------|---------|
| Type Safety | Full | None | Full | Full |
| Distribution | N/A | Manual | Fork | npm |
| Updates | Versioned | Manual | Manual | Automatic |
| Isolation | Full | None | Full | Sandboxed |
| Community | N/A | Limited | None | Full |
| Maintenance | Core team | User | User | Shared |
