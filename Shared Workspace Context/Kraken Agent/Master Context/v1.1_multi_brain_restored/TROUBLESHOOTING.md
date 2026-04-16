# Troubleshooting Guide - Kraken v1.1 Multi-Brain Orchestrator

## Quick Diagnostics

### Run These Commands First

```bash
# Check all dist files exist and have correct sizes
ls -la /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Master\ Context/v1.1_multi_brain_restored/dist/index.js        # Should be 521 KB
ls -la /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Master\ Context/v1.1_multi_brain_restored/shark-agent/dist/index.js  # Should be 490 KB
ls -la /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Master\ Context/v1.1_multi_brain_restored/manta-agent/dist/index.js  # Should be 541 KB
ls -la /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Master\ Context/v1.1_multi_brain_restored/subagent-manager/dist/index.js # Should be 944 KB

# Verify Python wrappers exist
ls -la /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Master\ Context/v1.1_multi_brain_restored/subagent-manager/wrappers/

# Check Docker is running
docker ps
```

---

## Common Issues

### Issue 1: Plugins Not Loading

**Symptoms:**
- `/kraken-status` returns "unknown command"
- No cluster info appears

**Diagnosis:**
```bash
# Check OpenCode config
cat ~/.config/opencode/opencode.json | python3 -m json.tool
```

**Fix:**
1. Verify plugin paths are correct (check for typos, spaces in paths)
2. Ensure file:// prefix is present
3. Restart OpenCode: `pkill -f opencode && opencode`

---

### Issue 2: Cluster Tools Not Available

**Symptoms:**
- `spawn_cluster_task` not found
- `spawn_shark_agent` not found

**Diagnosis:**
```bash
# Check if kraken-agent loaded
# In OpenCode, try: /help
# Look for kraken-* tools
```

**Fix:**
1. Verify kraken-agent dist file exists (521 KB)
2. Verify config has kraken-agent plugin entry
3. Check plugin order (subagent-manager FIRST, then kraken-agent)

---

### Issue 3: subagent-manager Not Spawning Containers

**Symptoms:**
- Tasks queue but never execute
- No Docker containers appear
- `run_subagent_task` returns error

**Diagnosis:**
```bash
# Check Python wrapper exists and is executable
file /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Master\ Context/v1.1_multi_brain_restored/subagent-manager/wrappers/opencode_agent.py

# Test Python wrapper directly
python3 /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Master\ Context/v1.1_multi_brain_restored/subagent-manager/wrappers/opencode_agent.py --help

# Check Docker
docker ps
```

**Fix:**
1. Ensure Python >= 3.11
2. Ensure Docker is running
3. Ensure opencode CLI is in PATH
4. Check wrapper has execute permissions: `chmod +x opencode_agent.py`

---

### Issue 4: Shark/Manta Agents Not Working

**Symptoms:**
- Cluster tasks complete but agents don't respond
- "Agent not found" errors

**Diagnosis:**
```bash
# Check shark and manta dist files
ls -la .../shark-agent/dist/index.js   # Should be 490 KB
ls -la .../manta-agent/dist/index.js   # Should be 541 KB

# Check they're in plugin config after kraken-agent
```

**Fix:**
1. Verify shark-agent and manta-agent plugins are in config
2. Verify dist files have correct sizes (not truncated)
3. Restart OpenCode after config changes

---

### Issue 5: Hive Mind Not Working

**Symptoms:**
- `kraken-hive-store` not found
- `kraken-hive-search` not found
- No memory persistence

**Diagnosis:**
```bash
# Check Hive tools exist
# In OpenCode: /help | grep kraken-hive
```

**Fix:**
1. Verify kraken-agent loaded correctly
2. Check `src/kraken-hive/index.ts` is present in source
3. Verify dist/index.js includes hive code (should be 521 KB)

---

## Verification Commands

### After Fresh Installation, Run These:

```bash
# 1. Verify cluster status
/kraken-status

# Expected output:
# Cluster load info for Alpha, Beta, Gamma clusters

# 2. Verify subagent tools
/run_subagent_task --help

# 3. Verify cluster tools
/spawn_cluster_task --help

# 4. Verify Hive tools
/kraken-hive-store --help
/kraken-hive-search --help
```

---

## Debug Mode

To enable debug logging:

1. Edit `~/.config/opencode/opencode.json`:
```json
{
  "debug": true,
  "plugins": [...]
}
```

2. Check debug logs:
```bash
tail -f ~/.opencode/logs/debug.log
```

---

## Rollback Procedure

If v1.1 has issues and you need to restore a previous state:

1. **Kill OpenCode**
```bash
pkill -f opencode
```

2. **Check for backups**
```bash
ls -la /home/leviathan/OPENCODE_WORKSPACE/KRAKEN_BACKUPS/
```

3. **Restore from backup**
```bash
cp -r /home/leviathan/OPENCODE_WORKSPACE/KRAKEN_BACKUPS/kraken-v2.0-20260412_232458/* /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Master\ Context/v1.1_multi_brain_restored/
```

4. **Restart OpenCode**
```bash
opencode
```

---

## Emergency Recovery

If the entire installation is corrupted:

1. **Restore from this archive** (files are already copied)
2. **Verify all 4 dist files**
3. **Update config**
4. **Restart**

The installation is self-contained at:
```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/v1.1_multi_brain_restored/
```