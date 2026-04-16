# TRIDENT BRAIN - VERSION HISTORY & CHANGELOG

## v3.0.1 (2026-04-16)

### Bug Fixes
- **Path parsing regex**: Fixed issue where "audit /path" was matching "audit" as the path instead of "/path"
- **scanDirectory memory limits**: Added 20MB per file, 100MB total limits
- **Binary file detection**: Added UTF-8 validation to skip binary files
- **RealTimeFirewall infinite loop**: Added safetyCount + maxMatches to all regex loops
- **scanSoft infinite loop**: Same fix as RealTimeFirewall

### Verified in Container (Docker)
- ✅ status command works
- ✅ help command works
- ✅ audit /path correctly parses path and scans
- ✅ verify command works
- ✅ tool.execute.before blocks edit/bash
- ✅ tool.execute.before allows test scripts

### Architecture
- Algorithmic-first: model ONLY reads files, ALL detection via regex
- Pure pattern matching - no behavioral prompts
- Real-time firewall blocks theatrical code at tool.execute.before hook

---

## v3.0.0 (2026-04-15)

### Initial consolidated release

### What's Fixed vs v2.x
| Issue | Status |
|-------|--------|
| Infinite loop on scanRealtime() | ✅ Fixed |
| Infinite loop on scanSoft() | ✅ Fixed |
| Memory bloat on large projects | ✅ Fixed (20MB/100MB limits) |
| Binary file crashes | ✅ Fixed (UTF-8 validation) |
| No tool enforcement | ✅ Fixed (tool.execute.before hook blocks edit/bash) |

### Commands
- `audit this` - Scan current directory
- `audit /path` - Scan specific path
- `verify that [claim]` - Proof verification
- `analyze hook isolation` - Cross-plugin check
- `cross-reference check` - Validate imports/references
- `show fix documentation` - WHY/HOW explanations (documentation only)

---

## v2.0.0 (2026-04-14) - PREVIOUS

### Original release with 6-layer architecture
- Layer 0: Behavioral detection
- Layer 1-6: Structure, Execution, Security, Architecture, Quality, Integration

### Known Issues (fixed in v3.0.0)
- RealTimeFirewall.scanRealtime() had infinite loop on many matches
- scanSoft() had same issue
- No resource limits - could exhaust memory
- No binary file handling - would crash on binary files

---

## ROOT CAUSE: Why Agent Ran Forever

The `tool.execute.before` hook in the debug version had a critical flaw:

```typescript
'tool.execute.before': async (input: any, output: any) => {
  const toolName = input.tool as string;
  // ...
  if (isBlocked) {
    output.blocked = true;
    output.blockReason = '[Trident] TOOL BLOCKED — ...';
  }
}
```

This hook is called for EVERY tool execution. When Trident was selected as agent and sent a message:
1. `chat.message` hook fires for Trident agent
2. Trident starts audit (async operation)
3. Engine calls other tools for filesystem operations
4. Those tools get BLOCKED by the hook because they contain "bash", "edit", etc.
5. The blocked tools return errors
6. Trident's logic might interpret blocked as "try again" → infinite loop

### The Real Issue

The `tool.execute.before` hook has `output.blocked = true` but doesn't actually halt execution. The tool continues to run and the error handling in Trident wasn't accounting for blocked tools properly.

**Fix in v3.0**: The hook correctly blocks edit/bash tools. But the issue was in the audit engine itself - it was calling tools that got blocked, and the blocked error didn't stop the audit loop.

### Why Sessions Kept Crashing

1. The audit starts async via `runAudit(target).then(...)`
2. But the hook blocks any subsequent tool calls
3. The promise chain gets broken
4. Session crashes when it tries to handle the broken promise state

---

## Deployment

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-v3.0
npm install
npm run deploy
```

Or manually:
```bash
cp -r dist/* ~/.config/opencode/plugins/trident-brain/
```