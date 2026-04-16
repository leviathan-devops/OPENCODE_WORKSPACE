# DEPLOYMENT BUG REPORT — 2026-04-14

## Bug: Ship Package Overwrites All Plugins

**Severity:** CRITICAL  
**Category:** Deployment / Data Loss  
**Status:** ✅ RESTORED

---

## What Happened

When deploying the ship package to `~/.config/opencode/plugins/`, the deployment process:
1. The opencode-config.json overwrote the previous config
2. Result: All plugins except kraken and subagent-manager were removed

---

## Restoration Steps

1. Backed up broken config: `~/.config/opencode/opencode.json.broken-20260414`
2. Restored backup: `~/.config/opencode/opencode.json.backup`
3. Added kraken-v2.0 plugin to config:
   ```json
   "plugin": [
     "file:///home/leviathan/agent-swarm/spider-agent",
     "hive-mind-plugin",
     "file:///home/leviathan/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js"
   ]
   ```

---

## Verification

```bash
opencode debug agent kraken
# ✅ clusterCount: 3, totalAgents: 11, krakenHiveReady: true
```

---

## Prevention Protocol

### CORRECT DEPLOYMENT PROCESS

```bash
# 1. BACKUP existing config
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup-$(date +%Y%m%d_%H%M%S)

# 2. LIST existing plugins (DO NOT DELETE ANY)
cat ~/.config/opencode/opencode.json | grep -A20 '"plugin"'

# 3. DEPLOY bundle to plugin directory (NOT to config)
cp new-bundle/index.js ~/.config/opencode/plugins/kraken-agent-v2.0/dist/

# 4. MERGE new plugin into existing config (keep existing plugins!)
# Add ONLY the new plugin entry, preserve all existing entries

# 5. VERIFY
opencode debug agent kraken
opencode agent list
```

### NEVER DO

- ❌ Don't overwrite opencode.json with ship config
- ❌ Don't delete existing plugin entries
- ❌ Don't assume ship config is complete
- ❌ Don't deploy without backup

---

## Ship Package Fix Required

Update ship package to:
1. Include `DEPLOYMENT_README.md` with correct process
2. Provide MERGE script, not REPLACE
3. Document that config must be merged manually
