# How the Permission System Enables Safe Multi-Agent Use

## Overview

OpenCode's permission system is the foundation for safe multi-agent operation. It ensures agents and plugins can only perform actions they've been explicitly granted permission for.

---

## Permission Categories

### Filesystem Permissions

```
filesystem:read       - Read files
filesystem:write      - Create/modify files
filesystem:delete     - Delete files
filesystem:list       - List directories
```

### Network Permissions

```
network:http          - HTTP requests
network:https         - HTTPS requests
network:ws            - WebSocket connections
network:dns           - DNS resolution
```

### Process Permissions

```
process:spawn        - Spawn child processes
process:kill         - Terminate processes
process:read         - Read process info
```

### Tool Permissions

```
tools:use            - Use available tools
tools:register       - Register new tools
tools:configure      - Configure tool settings
```

### Agent Permissions

```
agents:create        - Create new agents
agents:configure     - Configure agents
agents:access        - Access specific agents
```

---

## How Permissions Work

### Declaration

Plugins declare required permissions in manifest:

```json
{
  "opencode": {
    "plugins": [{
      "name": "my-plugin",
      "permissions": [
        "filesystem:read:/workspace/**",
        "filesystem:write:/workspace/**",
        "network:https:api.example.com"
      ]
    }]
  }
}
```

### Enforcement

The runtime checks every operation:

```
User Request
    |
    v
Permission Check --> Denied if not authorized
    |
    v
Operation Executed
    |
    v
Logged for Audit
```

### Path Matching

Permissions support glob patterns:

```yaml
filesystem:read:/workspace/**     # All under workspace
filesystem:read:/workspace/*      # One level only
filesystem:read:/workspace/*.ts   # Only TypeScript
```

---

## Multi-Agent Permission Patterns

### Isolated Agents

Each agent has limited permissions:

```yaml
agents:
  - name: trusted-coder
    permissions:
      filesystem:read: ["**"]
      filesystem:write: ["/workspace/**"]
      
  - name: untrusted-code-review
    permissions:
      filesystem:read: ["/workspace/**"]
      # No write access
```

### Privilege Escalation

Higher-privilege actions require explicit approval:

```yaml
agents:
  - name: auto-fix
    permissions:
      filesystem:write: ["**"]
      # But destructive ops require confirmation
      requireConfirmation:
        - filesystem:delete
        - process:kill
```

### Shared Context with Controlled Access

```yaml
# Agent can read shared data
filesystem:read:/shared/data/**

# But cannot write to others' directories
filesystem:write:/users/${user}/**  # Only own directory
```

---

## Session-Based Permissions

### Temporary Permissions

Permissions can be time-limited:

```yaml
sessions:
  - id: temp-debug
    permissions:
      filesystem:read: ["**"]
      process:spawn: true
    expiresIn: 3600  # 1 hour
```

### Revocable Access

```bash
# Grant temporary access
opencode session grant <session-id> --permission network:https:api.example.com --duration 1h

# Revoke immediately
opencode session revoke <session-id> --permission network:https
```

---

## Security Benefits

### 1. Blast Radius Limiting

If a plugin is compromised:

```
Without permissions: Full system access
With permissions: Only declared access
```

### 2. Explicit over Implicit

Every access is intentional:

```yaml
# Plugin declares it needs network
permissions:
  network:https:api.example.com

# User approves
# Only that access is granted
```

### 3. Audit Trail

All operations are logged:

```
[2024-01-15 10:23:45] [INFO] Permission granted: network:https:api.example.com
[2024-01-15 10:23:46] [INFO] Network request: GET https://api.example.com/data
[2024-01-15 10:23:47] [INFO] Network response: 200 OK (1256 bytes)
```

### 4. Defense in Depth

Multiple layers of protection:

```
Layer 1: Permission declaration
Layer 2: Permission enforcement
Layer 3: Sandboxing (optional)
Layer 4: Audit logging
Layer 5: Rate limiting
```

---

## Configuring Permissions

### Default Configuration

```yaml
permissions:
  defaults:
    filesystem:
      read: ["~/.config/**"]
      write: ["~/.cache/**"]
    network:
      allowed: []
    process:
      spawn: false
```

### Per-Session Overrides

```yaml
sessions:
  "debug-*":
    filesystem:
      read: ["**"]
      write: ["**"]
    process:
      spawn: true
```

### Plugin Restrictions

```yaml
plugins:
  - name: untrusted-plugin
    permissions:
      filesystem:
        read: ["/workspace/plugin-files/**"]
      network:
        allowed: []
```

---

## Best Practices

### 1. Least Privilege

Only grant what's needed:

```yaml
# Bad: Too broad
permissions:
  filesystem:read: ["**"]

# Good: Specific paths
permissions:
  filesystem:read: ["/workspace/src/**"]
```

### 2. Separate Concerns

Different agents for different tasks:

```yaml
agents:
  - name: editor
    permissions:
      filesystem:write: ["/workspace/src/**"]
      
  - name: tester
    permissions:
      filesystem:read: ["**"]
      process:spawn: true  # Run tests
```

### 3. Time-Bound Access

Limit exposure window:

```yaml
permissions:
  network:https:api.example.com
  expiresIn: 3600
```

### 4. Regular Audits

Review permissions periodically:

```bash
# List all permissions
opencode permissions list

# Check for overly broad permissions
opencode permissions audit
```

---

## Troubleshooting Permission Issues

### Permission Denied

```bash
# Check required permissions
opencode config get permissions

# Grant missing permission
opencode config add-permission network:https:api.example.com
```

### Plugin Blocked

```bash
# Check plugin permissions
opencode plugins list --verbose

# Grant plugin permission
opencode plugins grant my-plugin --permission filesystem:read
```

### Unexpected Behavior

```bash
# Enable debug logging
OPENCODE_DEBUG=permission opencode

# Check audit logs
opencode logs --grep "permission"
```

---

## Future Enhancements

The permission system will evolve:

- **Capability-based security**: Finer-grained than paths
- **AI-powered auditing**: Anomaly detection
- **Zero-knowledge proofs**: Verify without exposing
- **Hardware security**: TPM integration
- **Collaborative permissions**: Team-based policies
