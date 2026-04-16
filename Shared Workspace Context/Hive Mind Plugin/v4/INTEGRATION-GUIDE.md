# Hive Mind Plugin v4.1 — Integration & Usage Guide

**Version:** v4.1  
**Date:** April 3, 2026  
**Status:** PRODUCTION READY

---

## What This Plugin Does

The Hive Mind plugin is a **subconscious memory layer** for OpenCode. It runs silently in the background of every OpenCode session, automatically capturing and persisting significant work without any agent intervention:

- **Auto-captures** substantial file creations (>2000 chars) and architecture decisions
- **Detects patterns** like error→fix sequences within a 5-minute window
- **Commits breakthroughs** to OpenViking semantic memory when thresholds are reached
- **Provides tools** for explicit memory search and recall
- **Falls back to local disk** if OpenViking is unavailable — zero data loss

---

## Pre-Deploy Checklist

### Infrastructure ✅ (Already Running)

| Service | Status | Command |
|---------|--------|---------|
| OpenViking | ✅ Active (v0.2.9) | `systemctl status openviking` |
| Embedding server | ✅ Likely running | `curl localhost:8001/health` |
| Local fallback dir | ✅ Exists | `~/.local/share/opencode/hive-mind/` |
| API Key | ✅ Configured | In `~/.config/opencode/plugins/openviking-config.json` |

**To verify OpenViking is accepting writes:**
```bash
curl -s http://localhost:1933/health
# Should return: {"status":"ok","healthy":true}
```

### Plugin Registration ✅ (Already Done)

The plugin is registered in `~/.config/opencode/opencode.json`:
```json
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent",
  "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts"
]
```

---

## How to Use — Day to Day

### 1. It Just Works (Zero Interaction Required)

Start any OpenCode session — the plugin auto-starts and runs silently. You don't need to invoke anything.

### 2. Check Plugin Health

If you suspect something is wrong, ask the agent to call `hive_status`:

```
Call hive_status and tell me if the plugin is connected to OpenViking.
```

**What `hive_status` tells you:**
- `openViking.connected` — is OpenViking reachable?
- `canary.totalHookCalls` — how many hook executions since startup
- `canary.lastHookCall` — when the last hook fired
- `localFallback.enabled` — is local fallback active?

### 3. Search Shared Memory

To recall information from past work, use `hive_context`:

```
Use hive_context to search for "TypeScript interface architecture patterns"
```

Returns semantically relevant memories from previous sessions — architecture decisions, error fixes, file creations.

### 4. Manually Remember Something

If you make a discovery or decision you want to ensure is captured:

```
Call hive_remember with key "always use interface composition over inheritance" and content "Interface composition scales better than inheritance for our plugin architecture"
```

### 5. Read a Past Session

```
Call memread_session with session_id "ses_abc123"
```

Returns the T1 overview of that session — metadata, category, tools used, messages.

---

## Auto-Capture Thresholds

The plugin automatically captures work based on these thresholds:

| Event | Threshold | Cooldown |
|-------|-----------|----------|
| Substantial file write | >2000 characters | — |
| Architecture breakthrough | 3+ architecture signals in same session | 10 minutes |
| Error→fix pattern | Error detected within 5 min of fix | 10 minutes |
| File creation accumulation | 3+ files >2000 chars in short window | 10 minutes |

**Architecture signals** are scored when:
- File path contains `config/`, `types/`, `utils/`, `lib/`, `core/`, `src/` (+1)
- File has `interface`, `type`, `class`, or `enum` definitions (+1)
- File has `export const`, `export function`, `export class`, etc. (+1)
- File is a `.ts`, `.tsx`, `.js`, or `.jsx` source file (+1)
- Relative import path (`../` or `./`) in filename (+1)

---

## Background Behaviors (No Action Needed)

### Log Rotation
- Active log: `~/.local/share/opencode/hive-mind/hive-mind-plugin.log`
- Rotates at 10 MB into: `~/.local/share/opencode/hive-mind/archives/`
- Archive naming: `hive-mind-plugin-2026-04-03T11-45-00-000Z.log`

### Session Cleanup
- Sessions inactive for 2+ hours are automatically pruned from memory
- No manual cleanup needed

### Health Monitoring
- OpenViking health checked every 60 seconds
- If OpenViking goes down, all uploads fall back to local disk
- When it comes back up, local fallbacks are NOT auto-synced (future feature)

### Canary Monitoring
- Verifies hooks are actually firing every minute
- If no hooks fire for 5+ minutes at startup, logs warning
- Does NOT spam ERROR logs at startup (fixed in v4.1)

---

## Troubleshooting

### Plugin not responding to `hive_status`

1. Check OpenCode loaded the plugin: look for `[HiveMind] HiveMind Plugin loading...` in the log
2. Check OpenViking is running: `curl http://localhost:1933/health`
3. Check the log: `tail -20 ~/.local/share/opencode/hive-mind/hive-mind-plugin.log`

### "OpenViking unhealthy" or uploads failing

1. Verify OpenViking: `curl http://localhost:1933/health`
2. Check API key in config: `cat ~/.config/opencode/plugins/openviking-config.json`
3. Data is safe in local fallback: `ls ~/.local/share/opencode/hive-mind/`
4. To disable temporarily: set `"enabled": false` in config (plugin stops all hooks)

### Too many breakthrough rejections (cooldown)

The 10-minute cooldown is intentional to prevent spam. If breakthroughs are always rejected, either:
- Reduce `BREAKTHROUGH_COOLDOWN_MS` in source (rebuild required)
- Wait 10 minutes between significant work sessions

### Hooks not firing (canary warning)

The experimental hooks (`experimental.chat.messages.transform`) may not fire in all OpenCode versions. The canary detects this. If you see `No hook executions detected — hooks may not be firing`:
- This is a limitation of the OpenCode version, not the plugin
- Tools still work even if hooks don't fire

---

## Architecture Decisions You Should Know

### 1. Local Fallback is the Safety Net
Every upload writes to local disk FIRST, then attempts OpenViking. If OpenViking is down, you lose nothing — data sits in `~/.local/share/opencode/hive-mind/` until OpenViking comes back.

### 2. OpenViking is NOT Auto-Synced on Recovery
When OpenViking comes back after being down, local fallback files are NOT automatically re-uploaded. This is a known gap (Bug 8 / v4.2 roadmap).

### 3. Session IDs Use Pseudo-Sessions
OpenCode's `experimental.chat.messages.transform` hook does not provide `sessionID` in its input. The plugin generates pseudo-session IDs (`hook-session-{timestamp}-{random}`) that persist for 1 hour. This is working correctly.

### 4. Experimental Hooks are Experimental
The `experimental.session.compacting` hook may not fire in all OpenCode versions. The plugin handles this gracefully with periodic cleanup.

### 5. Auto-Capture Only Works Through OpenCode Tools
Files written via terminal commands (outside OpenCode's tool execution) are NOT auto-captured. Only files written through OpenCode's `write` tool within a chat session trigger the auto-capture.

### 6. Edit Tool vs Write Tool
OpenCode's internal `edit` tool is actually implemented as `write`. The plugin correctly detects both as write operations — "Wrote file successfully" in the chat means the plugin saw a write.

---

## Key File Locations

| Purpose | Path |
|---------|------|
| Plugin source | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts` |
| Deployed plugin | `~/.config/opencode/plugins/hive-mind-plugin.ts` |
| Active log | `~/.local/share/opencode/hive-mind/hive-mind-plugin.log` |
| Log archives | `~/.local/share/opencode/hive-mind/archives/` |
| Local fallback | `~/.local/share/opencode/hive-mind/` |
| OpenViking config | `~/.config/opencode/plugins/openviking-config.json` |
| OpenCode config | `~/.config/opencode/opencode.json` |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v4 | 2026-04-02 | Production-ready — API keys fixed, theatrical code removed |
| v4.1 | 2026-04-03 | Log noise reduction, commit timeout, log rotation, path logging fixed, session cleanup |

---

## What's Next (v4.2 Roadmap)

- Bug 8: Re-sync local fallbacks when OpenViking recovers
- Session lineage chain leverage for context retrieval
- Spider Agent workflow integration
