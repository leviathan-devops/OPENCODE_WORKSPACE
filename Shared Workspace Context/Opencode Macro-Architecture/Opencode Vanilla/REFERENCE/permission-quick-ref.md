# OpenCode Permission Quick Reference

## Permission Categories

### Filesystem Permissions

| Permission | Description | Example |
|------------|-------------|---------|
| filesystem:read | Read files/directories | "/workspace/**" |
| filesystem:write | Create/modify files | "/workspace/**" |
| filesystem:delete | Delete files | "/tmp/**" |
| filesystem:list | List directory contents | "/workspace" |

### Network Permissions

| Permission | Description | Example |
|------------|-------------|---------|
| network:http | Make HTTP requests | "api.example.com" |
| network:https | Make HTTPS requests | "*.github.com" |
| network:ws | WebSocket connections | "ws://localhost:*" |
| network:dns | DNS resolution | Enabled |

### Process Permissions

| Permission | Description | Example |
|------------|-------------|---------|
| process:spawn | Spawn child processes | true |
| process:kill | Terminate processes | false |
| process:read | Read process info | true |

### Tool Permissions

| Permission | Description | Example |
|------------|-------------|---------|
| tools:use | Use available tools | ["bash", "read", "write"] |
| tools:register | Register new tools | false |
| tools:configure | Configure tool settings | false |

### Agent Permissions

| Permission | Description | Example |
|------------|-------------|---------|
| agents:create | Create new agents | false |
| agents:configure | Configure agent behavior | false |
| agents:access | Access to specific agents | ["default"] |

### Session Permissions

| Permission | Description | Example |
|------------|-------------|---------|
| sessions:create | Create new sessions | true |
| sessions:read | Read session data | true |
| sessions:write | Modify sessions | true |
| sessions:delete | Delete sessions | false |

---

## Permission Syntax

### Wildcard Patterns

```
*       # All (same as **)
**      # All recursively
*.example.com  # Subdomain matching
/path/*         # Single level wildcard
/path/**        # Recursive path match
```

### Permission Sets

```yaml
# Full access (not recommended)
permissions:
  - "*"

# Read-only filesystem
permissions:
  - "filesystem:read"

# Specific paths only
permissions:
  - "filesystem:read:/workspace/**"
  - "filesystem:write:/workspace/**"
```

---

## Common Permission Patterns

### Development Environment

```yaml
permissions:
  filesystem:
    read: ["**"]
    write: ["/workspace/**"]
  network:
    allowed: ["*"]
  process:
    spawn: true
```

### Production Environment

```yaml
permissions:
  filesystem:
    read: ["/app/**"]
    write: ["/app/data/**"]
  network:
    allowed: ["api.company.com"]
    denied: ["internal.*"]
  process:
    spawn: false
```

### Restricted Environment

```yaml
permissions:
  filesystem:
    read: ["/workspace/**"]
  network:
    allowed: []
  process:
    spawn: false
```

---

## Tool Permission Requirements

| Tool | Required Permissions |
|------|---------------------|
| bash | process:spawn, filesystem:read, filesystem:write |
| read | filesystem:read |
| write | filesystem:write |
| glob | filesystem:read, filesystem:list |
| grep | filesystem:read |
| edit | filesystem:read, filesystem:write |
| http | network:http or network:https |

---

## Checking Permissions in Code

```typescript
// Check if permission is granted
if (context.permissions.has('filesystem:write:/workspace/**')) {
  // Can write to workspace
}

// Request additional permission
const granted = await context.permissions.request('network:http:api.example.com');
```

---

## Permission Errors

| Error Code | Meaning | Resolution |
|------------|---------|------------|
| E_DENIED | Permission explicitly denied | Check config |
| E_NOTFOUND | Permission not declared | Add to config |
| E_SCOPE | Action outside scope | Restrict path patterns |
| E_LEVEL | Insufficient level | Request elevation |

---

## Best Practices

1. Principle of Least Privilege: Only grant what is needed
2. Path Specificity: Use specific paths over wildcards
3. Network Whitelisting: Only allow required domains
4. Regular Audits: Review permissions periodically
5. Session Isolation: Use separate configs per use case
