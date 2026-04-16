# Debugging OpenCode Issues

## General Debugging

### Enable Debug Logging

```bash
# Via command line
opencode --debug

# Via environment
export OPENCODE_LOG_LEVEL=debug

# Specific component
OPENCODE_DEBUG=plugin opencode
```

### Verbose Output

```bash
opencode --verbose
opencode ask "test" --verbose
```

---

## Checking Status

### System Health

```bash
# Full diagnostic
opencode health

# Detailed output
opencode health --verbose
```

### Provider Status

```bash
# Check all providers
opencode status

# Specific provider
opencode status --provider anthropic
```

### Plugin Status

```bash
# List plugins
opencode plugins list

# Detailed plugin info
opencode plugins list --verbose
```

---

## Viewing Logs

### Main Log

```bash
# View recent logs
opencode logs --tail 100

# Filter by level
opencode logs --level error

# Filter by session
opencode logs --session <session-id>

# Filter by plugin
opencode logs --plugin my-plugin
```

### Log Locations

```
# Linux/macOS
~/.local/share/opencode/logs/opencode.log

# Windows
%LOCALAPPDATA%\opencode\logs\opencode.log
```

---

## Session Debugging

### View Session Details

```bash
# Show session info
opencode session show <session-id>

# Show with messages
opencode session show <session-id> --messages

# Show tool calls
opencode session show <session-id> --tools
```

### Trace Session

```bash
# Enable session tracing
export OPENCODE_TRACE_SESSION=1

# Run command with trace
opencode chat --session <session-id>
```

---

## Plugin Debugging

### Debug Plugin Loading

```bash
# Enable plugin debug
OPENCODE_DEBUG=plugin opencode

# Verbose plugin list
opencode plugins list --verbose
```

### Test Plugin Manually

```typescript
// Create test script
import { OpenCode } from 'opencode';

const opencode = new OpenCode({
  plugins: ['./path/to/plugin']
});

await opencode.initialize();
console.log('Tools:', opencode.getTools().map(t => t.name));
console.log('Hooks:', opencode.getHooks().map(h => h.name));

await opencode.dispose();
```

---

## Database Debugging

### Query Sessions Database

```bash
# Query via CLI
opencode db query "SELECT * FROM sessions LIMIT 10"

# Interactive sqlite3
sqlite3 ~/.local/share/opencode/sessions/sessions.db

# Check tool call history
opencode db query "SELECT tool, COUNT(*) FROM tool_calls GROUP BY tool"
```

### Export for Analysis

```bash
# Export session data
opencode session export <session-id> --format json

# Export all sessions
opencode db export --output ./backup/
```

---

## Common Issues

### Plugin Not Loading

1. Check file path exists:
   ```bash
   ls -la /path/to/plugin/dist/index.js
   ```

2. Validate manifest:
   ```bash
   cat package.json | jq '.opencode'
   ```

3. Check permissions:
   ```bash
   ls -la /path/to/plugin
   ```

### Provider Connection Failed

1. Test network:
   ```bash
   curl -I https://api.anthropic.com
   ```

2. Verify API key:
   ```bash
   opencode config get providers.anthropic.apiKey
   ```

3. Check key validity:
   ```bash
   opencode status --provider anthropic
   ```

### Tool Not Working

1. Check tool is registered:
   ```bash
   opencode tools list
   ```

2. Verify permissions:
   ```bash
   opencode config get permissions
   ```

3. Test tool directly:
   ```bash
   opencode ask "test" --verbose 2>&1 | grep tool
   ```

### Session Corruption

1. Check database:
   ```bash
   sqlite3 sessions.db "PRAGMA integrity_check;"
   ```

2. Export working sessions:
   ```bash
   opencode db export --output ./backup/
   ```

3. Clear corrupted session:
   ```bash
   opencode session delete <corrupted-session-id>
   ```

---

## Diagnostic Commands

```bash
# Full system check
opencode doctor

# Fix issues automatically
opencode doctor --fix

# Validate config
opencode config validate

# Check config
opencode config get --flat
```

---

## Performance Issues

### Check Resource Usage

```bash
# CPU/Memory
top -p $(pgrep -f opencode)

# Disk I/O
iotop -p $(pgrep -f opencode)
```

### Optimize

```yaml
# In config - reduce context window
agents:
  - name: default
    maxTokens: 4096  # Reduce from 8192

# Limit session history
sessions:
  maxHistory: 100
```

---

## Getting Help

```bash
# Show help
opencode help

# Show specific command help
opencode help <command>

# Debug mode with trace
opencode --debug --verbose
```
