# TRIDENT BRAIN - VERSION HISTORY & CHANGELOG

## v3.0.1 (2026-04-16)

### Bug Fixes
- **Path parsing regex**: Fixed `/[\/\.\~\w-]+\/?/` that matched "audit" in "audit /path" (word chars matched 'audit')
- Changed to `(?:^|\s)(\/[\/\.\~\w-]+|\/|\.[\/\.\~\w-]+|~[\/\.\~\w-]*)(?:\s|$)` to only match paths starting with `/`, `.`, or `~`

### Container Testing (Docker)
All commands verified working in container:
- ✅ status
- ✅ help
- ✅ audit /path (correct path parsing)
- ✅ verify
- ✅ tool hook blocks edit/bash
- ✅ tool hook allows test scripts

---

## v3.0.0 (2026-04-15)

### Consolidated from multiple versions into single stable release

### Bug Fixes
- **scanDirectory memory limits**: Added 20MB per file, 100MB total limits
- **Binary file detection**: Added UTF-8 validation to skip binary files
- **RealTimeFirewall infinite loop**: Added safetyCount + maxMatches to all regex loops
- **scanSoft infinite loop**: Same fix as RealTimeFirewall

### Architecture
- Algorithmic-first: model ONLY reads files, ALL detection via regex
- Pure pattern matching - no behavioral prompts
- Real-time firewall blocks theatrical code at tool.execute.before hook

---

## v2.0.0 (2026-04-14) - PREVIOUS

### Original release with 6-layer architecture
- Layer 0: Behavioral detection
- Layer 1-6: Structure, Execution, Security, Architecture, Quality, Integration

### Known Issues (fixed in v3.0+)
- RealTimeFirewall.scanRealtime() had infinite loop on many matches
- scanSoft() had same issue
- No resource limits - could exhaust memory
- No binary file handling - would crash on binary files
- Path parsing regex matched "audit" instead of "/path"

---

## ROOT CAUSE: Why Agent Ran Forever (v2.x)

The path parsing regex `/[\/\.\~\w-]+\/?/` matched "audit" because `\w` matches word characters (a-u-d-i-t). So when you said `"audit /path"`, it parsed `audit` as the path instead of `/path`.

With `audit` as the target:
1. `scanDirectory("audit")` couldn't find files
2. No files → no findings → silent "no files" message
3. But the async promise chain was broken
4. Error handling looped infinitely trying to retry

**Fix in v3.0.1**: Changed regex to only match paths starting with `/`, `.`, or `~`.

---

## Deployment

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor"
npm install
npm run build
cp -r dist/* ~/.config/opencode/plugins/trident-brain/
```