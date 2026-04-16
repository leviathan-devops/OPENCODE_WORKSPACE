# How to Debug When Spider Agent Isn't Loading

## Debugging Checklist

### 1. Verify Plugin Exists

```bash
ls -la ~/OPENCODE_WORKSPACE/plugins/spider-agent/
ls -la ~/OPENCODE_WORKSPACE/plugins/spider-agent/dist/
```

Must see `dist/index.js`.

### 2. Check Plugin Registration

In your OpenCode config:
```bash
cat ~/.opencode/config.json | grep -A5 spider
```

Or run:
```
/opencode plugins list
```

### 3. Verify JavaScript Loads

```bash
node -e "require('~/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js')"
```

Should not throw errors.

---

## Common Issues

### Issue: "Agent 'spider' not found"

**Cause:** Plugin not registered in agents config

**Fix:** Add to `.opencode.json`:
```json
{
  "agents": {
    "spider": {
      "model": "1-minimax/MiniMax-M2.7",
      "fallback_models": ["1-deepseek/deepseek-chat"]
    }
  }
}
```

### Issue: "Unknown command /swarm"

**Cause:** Hook not registered

**Fix:** Check plugin `package.json` exports hooks correctly. Verify:
```json
{
  "opencode": {
    "hooks": {
      "command.execute.before": true
    }
  }
}
```

### Issue: Plugin loads but agents not available

**Cause:** Agent definitions not exported properly

**Fix:** Check `dist/agents/` directory exists and contains agent definitions.

---

## Diagnostic Commands

### Check Config
```
/swarm config doctor
```
Validates configuration schema.

### Check Status
```
/swarm status
```
If this works, plugin is loaded.

### Check Agents
```
/swarm agents
```
Lists all registered agents.

---

## Manual Plugin Loading Test

```bash
cd ~/OPENCODE_WORKSPACE/plugins/spider-agent
node -e "
const plugin = require('./dist/index.js');
console.log('Plugin loaded:', Object.keys(plugin));
"
```

---

## View Plugin Logs

Spider Agent writes to OpenCode's log directory:
```bash
ls ~/OPENCODE_WORKSPACE/logs/
tail -f ~/OPENCODE_WORKSPACE/logs/spider-*.log
```

---

## State Corruption Debug

If state is corrupted:

1. Check state file:
```bash
cat .Spider/state.json | python3 -m json.tool
```

2. If invalid:
```bash
/swarm reset-session
# or
/swarm reset --confirm
```

3. If that fails, manually delete:
```bash
rm -rf .Spider/
```

---

## Verify TypeScript Source

If you modified source and need to rebuild:

```bash
cd ~/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Opencode\ Macro-Architecture/spider-source
npm run build
```

Output goes to `~/OPENCODE_WORKSPACE/plugins/spider-agent/dist/`

---

## Get Help

If stuck, run:
```
/swarm diagnose
/swarm config
```

And check:
- OpenCode version: `/opencode version`
- Plugin version: check `package.json` in spider-agent
